import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = { role: "user" | "assistant"; content: string };

type PrivyContextValue = {
  ready: boolean;
  authed: boolean;
  sendMessage: (messages: ChatMessage[], onChunk: (text: string) => void, signal?: AbortSignal) => Promise<void>;
  burnAllData: () => Promise<void>;
};

const PrivyContext = createContext<PrivyContextValue | null>(null);

export function PrivyProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

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
    async (messages: ChatMessage[], onChunk: (text: string) => void, signal?: AbortSignal) => {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error("Not signed in");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/privy-chat`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
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

      // Parse SSE stream from Privy proxied through our edge function.
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
            };
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
    },
    [],
  );

  const burnAllData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (accessToken) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/privy-burn`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) {
        console.error("burn failed", e);
      }
    }
    await supabase.auth.signOut();
  }, []);

  return (
    <PrivyContext.Provider value={{ ready, authed, sendMessage, burnAllData }}>
      {children}
    </PrivyContext.Provider>
  );
}

export function usePrivy() {
  const ctx = useContext(PrivyContext);
  if (!ctx) throw new Error("usePrivy must be used within PrivyProvider");
  return ctx;
}