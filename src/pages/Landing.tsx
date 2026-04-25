import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  BookOpen,
  MessageCircle,
  Flame,
  Stethoscope,
} from "lucide-react";
import { MoonLogo } from "@/components/MoonLogo";
import { Button } from "@/components/ui/button";
import { AppFooter } from "@/components/layout/AppFooter";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Always-on companion",
    body: "A warm, judgement-free chat for the questions you don't want to ask in a 7-minute appointment.",
  },
  {
    icon: Sparkles,
    title: "Research-grade answers",
    body: "Cited synthesis from ACOG, NICE, Cochrane, PubMed and OpenEvidence — not random forums.",
    accent: true,
  },
  {
    icon: ShieldCheck,
    title: "Privacy by design",
    body: "Your conversations stay yours. One tap to permanently burn every memory and trace.",
  },
  {
    icon: Heart,
    title: "Trimester-aware",
    body: "Guidance that adapts to where you are — nutrition, symptoms, prep, recovery.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Tell Luna where you are",
    body: "Share your weeks, what you're feeling, what you're curious about.",
  },
  {
    n: "02",
    title: "Ask anything",
    body: "From caffeine limits to labor signs — get a calm, specific answer in seconds.",
  },
  {
    n: "03",
    title: "Verify the evidence",
    body: "Switch to Research mode for cited, guideline-based deep dives.",
  },
];

const SOURCES = [
  "OpenEvidence",
  "PubMed",
  "ACOG",
  "NICE",
  "Cochrane",
  "UpToDate",
  "WHO",
  "CDC",
];

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/chat", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Marketing header (kept distinct from in-app AppHeader) */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <MoonLogo className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight">Luna</span>
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
            <span>AI pregnancy companion · evidence-first · private</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05]">
            Pregnancy is hard.
            <br />
            <span className="gemini-text">You shouldn&apos;t face it alone.</span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Luna is a private, evidence-based AI companion for every week of pregnancy.
            Calm answers, real citations, and a memory only you can erase.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth?mode=signup">
              <Button
                size="lg"
                className="rounded-full h-12 px-7 text-base bg-foreground text-background hover:bg-foreground/90"
              >
                Start chatting free
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
                  Is one cup of coffee a day okay at 22 weeks?
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-2xl gemini-gradient flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium gemini-text mb-1">Luna · Research</p>
                  <div className="rounded-3xl rounded-tl-md bg-background/60 border border-border/60 px-4 py-3 text-sm leading-relaxed">
                    Yes — staying under <span className="font-medium">200&nbsp;mg/day</span> of caffeine
                    is consistent with current guidance (ACOG 2010, reaffirmed; NICE NG201).
                    A standard 8&nbsp;oz brewed coffee is roughly 95–165&nbsp;mg, so one cup is generally fine.
                    <span className="block mt-2 text-xs text-muted-foreground">
                      Sources: ACOG · NICE NG201 · Cochrane review (2015)
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
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why Luna</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              The companion you&apos;d build for someone you love.
            </h2>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f) => (
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
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
              Three quiet steps. No clinical jargon.
            </h2>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
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
              Cited answers from the sources clinicians trust.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              When you want depth, switch to Research. Luna synthesizes peer-reviewed studies
              and major clinical guidelines, attributes inline, and lists its sources — no
              hallucinated DOIs, no Reddit threads.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {SOURCES.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground"
                >
                  {s}
                </span>
              ))}
            </div>
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
                <Stethoscope className="h-4 w-4 gemini-text" />
                <span className="font-medium">Vitamin D in pregnancy</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most guidelines recommend <span className="text-foreground font-medium">10&nbsp;µg (400&nbsp;IU)/day</span>
                throughout pregnancy (NICE PH56). Higher doses (up to 4,000&nbsp;IU/day) appear safe in
                deficient individuals based on systematic reviews (Cochrane, 2019) — confirm levels with your provider.
              </p>
              <div className="pt-2 border-t border-border/60 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span>NICE PH56</span>·<span>Cochrane 2019</span>·<span>WHO 2020</span>
              </div>
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
            Your pregnancy is yours.
          </h2>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Luna is built privacy-first. We never sell your data, and you can permanently
            erase every memory and conversation with one button.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 text-destructive px-3 py-1.5 text-xs">
            <Flame className="h-3.5 w-3.5" />
            One-tap data burn
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/40 bg-background/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Meet Luna.
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            A calmer way to navigate the next nine months.
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