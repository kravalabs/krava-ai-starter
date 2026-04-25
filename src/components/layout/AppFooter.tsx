import { MoonLogo } from "@/components/MoonLogo";

export function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/40 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <MoonLogo className="h-5 w-5" />
          <span>Luna · private pregnancy companion</span>
        </div>
        <p className="max-w-md leading-relaxed">
          Luna is supportive guidance, not a substitute for medical advice. Always consult
          your healthcare provider for medical decisions.
        </p>
        <p>© {new Date().getFullYear()} Luna</p>
      </div>
    </footer>
  );
}