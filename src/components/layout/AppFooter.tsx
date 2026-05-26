import { AppLogo } from "@/components/AppLogo";
import { APP_NAME } from "@/config";

export function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-background/40 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <AppLogo className="h-5 w-5" />
          <span>{APP_NAME} · powered by Krava AI</span>
        </div>
        <p className="max-w-md leading-relaxed">
          {APP_NAME} is supportive guidance, not a substitute for professional advice.
          Always consult a qualified professional for important decisions.
        </p>
        <p>© {new Date().getFullYear()} {APP_NAME}</p>
      </div>
    </footer>
  );
}
