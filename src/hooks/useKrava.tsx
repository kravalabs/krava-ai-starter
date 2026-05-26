import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatProvider = "gemini" | "krava";

type KravaContextValue = {
  ready: boolean;
  authed: boolean;
  sendMessage: (
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    provider?: ChatProvider,
  ) => Promise<void>;
  burnAllData: () => Promise<void>;
};

const KravaContext = createContext<KravaContextValue | null>(null);

export function KravaProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [kravaToken, setKravaToken] = useState<string | null>(null);
  const [kravaChatId, setKravaChatId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthed(!!session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const sendMessage = useCallback(
    async (
      messages: ChatMessage[],
      onChunk: (text: string) => void,
      signal?: AbortSignal,
      provider: ChatProvider = "gemini",
    ) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Not signed in");

      let userToken: string | null = kravaToken;
      if (provider === "krava" && !userToken) {
        const sessRes = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/krava-session`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!sessRes.ok) {
          const t = await sessRes.text().catch(() => "");
          throw new Error(t || "Failed to create Krava session");
        }
        const j = (await sessRes.json()) as { userToken?: string };
        if (!j.userToken) throw new Error("Krava session missing userToken");
        userToken = j.userToken;
        setKravaToken(userToken);
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/krava-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          provider,
          ...(provider === "krava"
            ? { userToken, chatId: kravaChatId ?? undefined }
            : {}),
        }),
        signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        let message = text;

        try {
          const parsed = JSON.parse(text) as { error?: string };
          if (typeof parsed.error === "string") {
            message = parsed.error;
          }
        } catch {
          /* keep plain text */
        }

        throw new Error(message || `Chat failed (${res.status})`);
      }

      // Parse SSE stream from Krava proxied through our edge function.
      let kravaGotText = false;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const rawEvent = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const dataLines = rawEvent
            .split("\n")
            .filter((l) => l.startsWith("data:"))
            .map((l) => l.slice(5).trimStart());
          if (dataLines.length === 0) continue;
          const payload = dataLines.join("\n");
          if (payload === "[DONE]") return;
          try {
            const evt = JSON.parse(payload) as {
              type?: string;
              delta?: { type?: string; text?: string };
              choices?: Array<{ delta?: { content?: string } }>;
              text?: string;
              chatId?: string;
            };
            if (provider === "krava") {
              if (typeof evt.chatId === "string") setKravaChatId(evt.chatId);
              if (typeof evt.text === "string") {
                kravaGotText = true;
                onChunk(evt.text);
              }
              continue;
            }
            const openAiChunk = evt.choices?.[0]?.delta?.content;
            if (typeof openAiChunk === "string") {
              onChunk(openAiChunk);
              continue;
            }
            if (
              evt.type === "content_block_delta" &&
              evt.delta?.type === "text_delta" &&
              typeof evt.delta.text === "string"
            ) {
              onChunk(evt.delta.text);
            }
          } catch {
            /* ignore non-JSON event */
          }
        }
      }
      if (provider === "krava" && !kravaGotText) {
        throw new Error(
          "Krava AI accepted the request but returned no text. " +
            "This is an upstream issue — try Gemini instead.",
        );
      }
    },
    [kravaToken, kravaChatId],
  );

  const burnAllData = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (accessToken) {
      try {
        await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/krava-burn`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
      } catch (e) {
        console.error("burn failed", e);
      }
    }
    await supabase.auth.signOut();
    setKravaToken(null);
    setKravaChatId(null);
  }, []);

  return (
    <KravaContext.Provider value={{ ready, authed, sendMessage, burnAllData }}>
      {children}
    </KravaContext.Provider>
  );
}

export function useKrava() {
  const ctx = useContext(KravaContext);
  if (!ctx) throw new Error("useKrava must be used within KravaProvider");
  return ctx;
}
