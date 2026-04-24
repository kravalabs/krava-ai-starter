import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { MoonLogo } from "@/components/MoonLogo";
import { usePrivy } from "@/hooks/usePrivy";
import { PrivacyBadge } from "@/components/PrivacyBadge";

export default function Auth() {
  const navigate = useNavigate();
  const { initPrivySession } = usePrivy();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          await initPrivySession();
          navigate("/chat", { replace: true });
        } catch (e) {
          console.error(e);
          toast({ title: "Could not start your private session", variant: "destructive" });
        }
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/chat", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, initPrivySession]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/chat` },
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send link", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/chat` },
    });
    if (error) {
      toast({ title: "Google sign-in failed", description: error.message, variant: "destructive" });
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-8">
          <MoonLogo className="h-24 w-24 drop-shadow-[0_0_40px_hsl(280_60%_60%/0.4)]" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          Your private pregnancy companion
        </h1>
        <p className="mt-3 text-muted-foreground">
          Anonymous. Encrypted. Yours alone.
        </p>

        {sent ? (
          <div className="mt-10 rounded-2xl bg-card p-6 shadow-soft border border-border">
            <p className="text-sm text-card-foreground">
              Check your inbox at <span className="font-medium">{email}</span> for a sign-in link.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            <form onSubmit={sendMagicLink} className="space-y-3">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={sending}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                {sending ? "Sending…" : "Send magic link"}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
              className="w-full h-12 rounded-2xl bg-card border-border text-card-foreground hover:bg-secondary"
            >
              Continue with Google
            </Button>
          </div>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          No passwords. No tracking. Your conversations are end-to-end encrypted.
        </p>
      </div>

      <PrivacyBadge />
    </main>
  );
}