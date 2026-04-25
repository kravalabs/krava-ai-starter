import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { MoonLogo } from "@/components/MoonLogo";

type Mode = "signin" | "signup";

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/chat", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/chat", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/chat` },
        });
        if (error) throw error;
        // Auto-confirm is on, so the user is signed in immediately.
        // onAuthStateChange will navigate to /chat.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Please try again.";
      toast({ title: "Authentication failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
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

        <form onSubmit={onSubmit} className="mt-10 space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-2xl bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          Your conversations are end-to-end encrypted. Only you can read them.
        </p>
      </div>

      <PrivacyBadge />
    </main>
  );
}