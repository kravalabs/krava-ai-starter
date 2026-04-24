import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPrivyClient, parseAgentChatStream } from "@privyai/api-client";
import { supabase } from "@/integrations/supabase/client";

const PRIVY_BASE = "https://privyai.ch";
const STORAGE_KEY = "privy_token";

type ChatMessage = { role: "user" | "assistant"; content: string };

type PrivyContextValue = {
  userToken: string | null;
  ready: boolean;
  initPrivySession: () => Promise<void>;
  sendMessage: (messages: ChatMessage[], onChunk: (text: string) => void, signal?: AbortSignal) => Promise<void>;
  burnAllData: () => Promise<void>;
  clearLocal: () => void;
};

const PrivyContext = createContext<PrivyContextValue | null>(null);

export function PrivyProvider({ children }: { children: ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [ready, setReady] = useState(false);

  const initPrivySession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    if (!accessToken) {
      sessionStorage.removeItem(STORAGE_KEY);
      setUserToken(null);
      setReady(true);
      return;
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/privy-session`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      console.error("privy-session failed", await res.text());
      setReady(true);
      throw new Error("Failed to start Privy session");
    }
    const { userToken: token } = await res.json();
    sessionStorage.setItem(STORAGE_KEY, token);
    setUserToken(token);
    setReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session && !userToken) {
        try { await initPrivySession(); } catch (e) { console.error(e); }
      } else {
        setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        sessionStorage.removeItem(STORAGE_KEY);
        setUserToken(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const client = useMemo(
    () => userToken ? createPrivyClient({ baseUrl: PRIVY_BASE, getToken: () => userToken }) : null,
    [userToken],
  );

  const sendMessage = useCallback(
    async (messages: ChatMessage[], onChunk: (text: string) => void, signal?: AbortSignal) => {
      if (!client) throw new Error("Not authenticated");
      const creds = await client.agent.getGatewayCredentials();
      const res = await client.v1.agentChat(
        {
          model: "claude-sonnet-4-6-20250514",
          system:
            "You are Luna, a warm and knowledgeable pregnancy companion. " +
            "You help expecting parents with nutrition, emotional support, symptom questions, and birth preparation. " +
            "Be warm, reassuring, and evidence-based. Never alarmist. " +
            "Always recommend consulting a healthcare provider for medical decisions.",
          messages,
          stream: true,
        },
        { gatewayToken: creds.gatewayToken, signal },
      );
      for await (const event of parseAgentChatStream(res)) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          onChunk(event.delta.text);
        }
      }
    },
    [client],
  );

  const burnAllData = useCallback(async () => {
    if (client) {
      try { await client.memory.clear(); } catch (e) { console.error("memory clear failed", e); }
      try { await client.agent.destroy(); } catch (e) { console.error("agent destroy failed", e); }
    }
    sessionStorage.removeItem(STORAGE_KEY);
    setUserToken(null);
    await supabase.auth.signOut();
  }, [client]);

  const clearLocal = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUserToken(null);
  }, []);

  const value: PrivyContextValue = {
    userToken,
    ready,
    initPrivySession,
    sendMessage,
    burnAllData,
    clearLocal,
  };

  return <PrivyContext.Provider value={value}>{children}</PrivyContext.Provider>;
}

export function usePrivy() {
  const ctx = useContext(PrivyContext);
  if (!ctx) throw new Error("usePrivy must be used within PrivyProvider");
  return ctx;
}