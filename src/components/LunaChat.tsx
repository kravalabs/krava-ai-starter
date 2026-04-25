import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { usePrivy } from "@/hooks/usePrivy";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";

type Msg = { role: "user" | "assistant"; content: string };

export default function LunaChat() {
  const navigate = useNavigate();
  const { sendMessage, burnAllData } = usePrivy();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const [burnOpen, setBurnOpen] = useState(false);
  const [burning, setBurning] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, currentStream]);

  async function onSend() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setStreaming(true);
    setCurrentStream("");

    let accumulated = "";
    try {
      await sendMessage(next, (chunk) => {
        accumulated += chunk;
        setCurrentStream(accumulated);
      });
      setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Luna couldn't respond",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
      setCurrentStream("");
    }
  }

  async function confirmBurn() {
    setBurning(true);
    try {
      await burnAllData();
      toast({ title: "All data permanently deleted." });
      navigate("/", { replace: true });
    } catch (e) {
      toast({
        title: "Couldn't burn data",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBurning(false);
      setBurnOpen(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <AppHeader onBurn={() => setBurnOpen(true)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.length === 0 && (
            <>
              <div className="rounded-3xl bubble-luna p-6 shadow-bubble">
                <p className="text-base leading-relaxed">
                  Hi, I&apos;m Luna 🌙 — your private pregnancy companion. How far along are you?
                </p>
              </div>
              <Link
                to="/research"
                className="shimmer-border block rounded-3xl p-[1px] group"
              >
                <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-card/80 backdrop-blur p-5 flex items-start gap-4">
                  <div className="h-10 w-10 rounded-2xl gemini-gradient flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      <span className="gemini-text">Research AI Companion</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Cited, evidence-based answers from OpenEvidence, PubMed, ACOG, NICE & more.
                    </p>
                  </div>
                </div>
              </Link>
            </>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}

          {streaming && (
            <Bubble role="assistant" content={currentStream || "…"} streaming />
          )}
        </div>
      </div>

      <div className="border-t border-border/60 bg-background/60 backdrop-blur px-4 sm:px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Share what's on your mind…"
            rows={1}
            className="min-h-[48px] max-h-40 resize-none rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={onSend}
            disabled={!input.trim() || streaming}
            className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={burnOpen} onOpenChange={setBurnOpen}>
        <DialogContent className="bg-card border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              Permanently delete all your data?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will erase every memory and conversation Luna has of you, then sign you out.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setBurnOpen(false)} disabled={burning}>
              Cancel
            </Button>
            <Button
              onClick={confirmBurn}
              disabled={burning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {burning ? "Burning…" : "Yes, burn everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppFooter />
    </div>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-bubble whitespace-pre-wrap leading-relaxed ${
          isUser ? "bubble-user rounded-br-md" : "bubble-luna rounded-bl-md"
        }`}
      >
        {content}
        {streaming && <span className="inline-block ml-1 animate-pulse-soft">▋</span>}
      </div>
    </div>
  );
}