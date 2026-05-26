import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  Flame,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/layout/AppFooter";
import { supabase } from "@/integrations/supabase/client";
import {
  APP_NAME,
  APP_TAGLINE,
  HERO_HEADLINE,
  HERO_SUBHEADLINE,
  FEATURES,
  HOW_IT_WORKS,
} from "@/config";

const FEATURE_ICONS = [MessageCircle, Sparkles, ShieldCheck, Flame];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/chat", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <AppLogo className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#research" className="hover:text-foreground transition">Research</a>
            <a href="#privacy" className="hover:text-foreground transition">Privacy</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden sm:inline">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                Get started
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full opacity-40 blur-3xl gemini-gradient" />
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-20 sm:pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground mb-6">
            <Sparkles className="h-3 w-3 gemini-text" />
            <span>Private AI · encrypted memory · hardware-attested inference</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            {HERO_HEADLINE.split("\n").map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {i === 1 ? <span className="gemini-text">{line}</span> : line}
              </span>
            ))}
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {HERO_SUBHEADLINE}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth?mode=signup">
              <Button
                size="lg"
                className="rounded-full h-12 px-7 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                Start for free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full h-12 px-7 text-base border-border/60 bg-card/40 hover:bg-card"
              >
                I already have an account
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            No credit card · Burn your data anytime
          </p>
        </div>

        {/* Hero preview card */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 pb-20">
          <div className="shimmer-border rounded-3xl p-[1px]">
            <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-card/80 backdrop-blur p-6 sm:p-8 space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-3xl rounded-br-md bubble-user px-4 py-2.5 text-sm">
                  Can you help me understand my situation better?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-2xl gemini-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium gemini-text mb-1">{APP_NAME} · Krava AI</p>
                  <div className="rounded-3xl rounded-tl-md bg-background/60 border border-border/60 px-4 py-3 text-sm leading-relaxed">
                    Of course — I'm here to help. Your conversation is end-to-end encrypted,
                    so feel free to share whatever's on your mind.
                    <span className="block mt-2 text-xs text-muted-foreground">
                      Zero-knowledge encrypted · only you can read this
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/40 bg-background/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why {APP_NAME}</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              The companion you'd want for someone you care about.
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              return (
                <div
                  key={f.title}
                  className={
                    f.accent
                      ? "shimmer-border rounded-3xl p-[1px]"
                      : "rounded-3xl border border-border/60 p-[1px] bg-border/20"
                  }
                >
                  <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-card/70 h-full p-6">
                    <div
                      className={
                        "h-10 w-10 rounded-2xl flex items-center justify-center mb-4 " +
                        (f.accent
                          ? "gemini-gradient text-white"
                          : "bg-secondary text-foreground")
                      }
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Three steps. Zero friction.
            </h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n} className="rounded-3xl border border-border/60 bg-card/50 p-6">
                <p className="text-sm gemini-text font-medium">{s.n}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research */}
      <section id="research" className="border-t border-border/40 bg-background/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs">
              <BookOpen className="h-3 w-3 gemini-text" />
              <span className="gemini-text font-medium">Research mode</span>
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
              Cited answers from sources you can trust.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              When you want depth, switch to Research. The AI synthesises peer-reviewed
              sources and attributes claims inline — no hallucinated links, no Reddit threads.
            </p>
            <Link to="/auth?mode=signup" className="inline-block mt-8">
              <Button className="rounded-full gemini-gradient text-white hover:opacity-90">
                Try Research mode
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          <div className="shimmer-border rounded-3xl p-[1px]">
            <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-card/80 p-6 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 gemini-text" />
                <span className="font-medium">Example research question</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The AI cites its sources inline and lists them at the end —
                so you can always verify where the information comes from.
                <span className="block mt-2 text-[11px]">
                  <a
                    href="https://pubmed.ncbi.nlm.nih.gov"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition"
                  >
                    PubMed <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}·{" "}
                  <a
                    href="https://www.cochranelibrary.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition"
                  >
                    Cochrane <ExternalLink className="h-3 w-3" />
                  </a>
                  {" "}·{" "}
                  <a
                    href="https://www.who.int"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-foreground transition"
                  >
                    WHO <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-5">
            <ShieldCheck className="h-6 w-6 text-foreground" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Your data is yours.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {APP_NAME} is built privacy-first. Conversations are encrypted with a key only
            you hold — even we can't read them. Erase everything permanently with one tap.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-3 py-1.5 text-xs">
            <Flame className="h-3.5 w-3.5" />
            One-tap data burn
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-background/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Meet {APP_NAME}.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            {APP_TAGLINE}
          </p>
          <Link to="/auth?mode=signup" className="inline-block mt-8">
            <Button
              size="lg"
              className="rounded-full h-12 px-7 text-base bg-foreground text-background hover:bg-foreground/90"
            >
              Start free
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
