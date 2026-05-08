import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Send, ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { usePrivy } from "@/hooks/usePrivy";
import { AppLogo } from "@/components/AppLogo";
import { Markdown } from "@/components/Markdown";
import { RESEARCH_SUGGESTED, RESEARCH_SOURCES } from "@/config";

type Msg = { role: "user" | "assistant"; content: string };

export default function Research() {
  const navigate = useNavigate();
  const { ready, authed } = usePrivy();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ready && !authed) navigate("/", { replace: true });
  }, [ready, authed, navigate]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, currentStream]);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text.trim() }];
    setMessages(next);
    setStreaming(true);
    setCurrentStream("");

    let accumulated = "";
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Not signed in");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/research`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        let msg = errText;
        try {
          msg = JSON.parse(errText).error ?? errText;
        } catch {
          /* ignore */
        }
        if (res.status === 429) msg = "Rate limit reached. Please wait a moment.";
        if (res.status === 402)
          msg = "Workspace AI credits exhausted. Add credits to continue.";
        throw new Error(msg || `Research failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { value, done: rDone } = await reader.read();
        if (rDone) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            done = true;
            break;
          }
          try {
            const evt = JSON.parse(payload);
            const chunk = evt.choices?.[0]?.delta?.content;
            if (typeof chunk === "string") {
              accumulated += chunk;
              setCurrentStream(accumulated);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: accumulated },
      ]);
    } catch (e) {
      toast({
        title: "Research couldn't respond",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
      setCurrentStream("");
    }
  }

  if (!ready || !authed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AppLogo className="h-16 w-16 animate-pulse-soft" />
        <p className="text-sm text-muted-foreground">Opening Research…</p>
      </main>
    );
  }

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppHeader />

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-8"
      >
        <div className="mx-auto max-w-3xl">
          {empty && (
            <section className="text-center mb-10">
              <div className="mx-auto h-14 w-14 rounded-3xl gemini-gradient flex items-center justify-center mb-5 shadow-soft">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                <span className="gemini-text">Deep Research</span>
              </h1>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Cited, evidence-based answers synthesised from reliable sources.
                Always confirm with a qualified professional.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {RESEARCH_SOURCES.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-border transition"
                  >
                    <BookOpen className="h-3 w-3" />
                    {s.name}
                    <ExternalLink className="h-3 w-3 opacity-60" />
                  </a>
                ))}
              </div>

              <div className="mt-10 grid sm:grid-cols-2 gap-3 text-left">
                {RESEARCH_SUGGESTED.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="shimmer-border rounded-2xl p-[1px] text-left group"
                  >
                    <div className="rounded-[calc(theme(borderRadius.2xl)-1px)] bg-card/70 hover:bg-card transition p-4 h-full">
                      <p className="text-sm leading-relaxed">{q}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {!empty && (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <ResearchBubble key={i} role={m.role} content={m.content} />
              ))}
              {streaming && (
                <ResearchBubble
                  role="assistant"
                  content={currentStream || "…"}
                  streaming
                />
              )}
            </div>
          )}
        </div>
      </main>

      <div className="border-t border-border/60 bg-background/60 backdrop-blur px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="shimmer-border rounded-2xl p-[1px]">
            <div className="rounded-[calc(theme(borderRadius.2xl)-1px)] bg-card flex items-end gap-2 p-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask a research question…"
                rows={1}
                className="min-h-[44px] max-h-40 resize-none border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                className="h-10 w-10 rounded-xl gemini-gradient text-white hover:opacity-90 shrink-0 p-0"
                aria-label="Ask"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            Information only — not professional advice. Always consult a qualified expert.
          </p>
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

function ResearchBubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-3xl rounded-br-md bubble-user px-5 py-3 shadow-bubble whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 rounded-2xl gemini-gradient flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium gemini-text mb-1">Deep Research</p>
        <div className="rounded-3xl rounded-tl-md bg-card/80 border border-border/60 px-5 py-4 shadow-bubble leading-relaxed text-sm">
          <Markdown>{content}</Markdown>
          {streaming && (
            <span className="inline-block ml-1 animate-pulse-soft">▋</span>
          )}
        </div>
      </div>
    </div>
  );
}
