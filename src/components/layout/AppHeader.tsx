import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Flame, LogOut } from "lucide-react";
import { MoonLogo } from "@/components/MoonLogo";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@/hooks/usePrivy";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  onBurn?: () => void;
};

export function AppHeader({ onBurn }: Props) {
  const { authed } = usePrivy();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const navItem = (to: string, label: string, accent = false) => {
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "px-3 py-1.5 rounded-full text-sm transition-colors",
          active
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
          accent && !active && "text-foreground",
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to={authed ? "/chat" : "/"} className="flex items-center gap-2.5 shrink-0">
          <MoonLogo className="h-8 w-8" />
          <div className="leading-tight">
            <p className="text-base font-semibold">Luna</p>
            <p className="text-[11px] text-muted-foreground -mt-0.5">Pregnancy companion</p>
          </div>
        </Link>

        {authed && (
          <nav className="hidden sm:flex items-center gap-1">
            {navItem("/chat", "Chat")}
            <Link
              to="/research"
              className={cn(
                "group relative px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5",
                pathname === "/research"
                  ? "bg-secondary text-foreground"
                  : "text-foreground hover:bg-secondary/60",
              )}
            >
              <Sparkles className="h-3.5 w-3.5 gemini-text" />
              <span className="gemini-text font-medium">Research</span>
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-1">
          {authed && onBurn && (
            <button
              onClick={onBurn}
              className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
              aria-label="Burn all data"
            >
              <Flame className="h-4 w-4" />
              Burn
            </button>
          )}
          {authed ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/", { replace: true });
              }}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>

      {authed && (
        <nav className="sm:hidden flex items-center gap-1 px-4 pb-2">
          {navItem("/chat", "Chat")}
          <Link
            to="/research"
            className={cn(
              "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5",
              pathname === "/research"
                ? "bg-secondary"
                : "hover:bg-secondary/60",
            )}
          >
            <Sparkles className="h-3.5 w-3.5 gemini-text" />
            <span className="gemini-text font-medium">Research</span>
          </Link>
        </nav>
      )}
    </header>
  );
}