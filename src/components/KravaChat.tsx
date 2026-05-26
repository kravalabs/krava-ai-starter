import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Send, Lock, Bot } from "lucide-react";
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
import { useKrava, type ChatProvider } from "@/hooks/useKrava";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { Markdown } from "@/components/Markdown";
import { APP_NAME, CHAT_GREETING, CHAT_INPUT_PLACEHOLDER } from "@/config";

type Msg = { role: "user" | "assistant"; content: string };

export default function KravaChat() {
  const navigate = useNavigate();
  const { sendMessage, burnAllData } = useKrava();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [currentStream, setCurrentStream] = useState("");
  const [burnOpen, setBurnOpen] = useState(false);
  const [burning, setBurning] = useState(false);
  const [provider, setProvider] = useState<ChatProvider>("gemini");

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
      }, undefined, provider);
      setMessages((prev) => [...prev, { role: "assistant", content: accumulated }]);
    } catch (e) {
      console.error(e);
      toast({
        title: `${APP_NAME} couldn't respond`,
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
            <div className="rounded-3xl bubble-luna p-6 shadow-bubble">
              <p className="text-base leading-relaxed">{CHAT_GREETING}</p>
            </div>
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
        <div className="mx-auto max-w-2xl space-y-2">
          <div className="flex items-center gap-1 p-1 rounded-full bg-muted/60 w-fit text-xs">
            <button
              type="button"
              onClick={() => setProvider("gemini")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                provider === "gemini"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              Gemini
            </button>
            <button
              type="button"
              onClick={() => setProvider("krava")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
                provider === "krava"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock className="h-3.5 w-3.5" />
              Krava AI
            </button>
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={CHAT_INPUT_PLACEHOLDER}
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
      </div>

      <Dialog open={burnOpen} onOpenChange={setBurnOpen}>
        <DialogContent className="bg-card border-border rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-destructive" />
              Permanently delete all your data?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This will erase every memory and conversation, then sign you out.
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
        className={`max-w-[85%] rounded-3xl px-5 py-3 shadow-bubble leading-relaxed ${
          isUser ? "bubble-user rounded-br-md" : "bubble-luna rounded-bl-md"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <Markdown variant="onLight">{content}</Markdown>
        )}
        {streaming && <span className="inline-block ml-1 animate-pulse-soft">▋</span>}
      </div>
    </div>
  );
}
