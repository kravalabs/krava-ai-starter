import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKrava } from "@/hooks/useKrava";
import KravaChat from "@/components/KravaChat";
import { AppLogo } from "@/components/AppLogo";

export default function ChatPage() {
  const navigate = useNavigate();
  const { ready, authed } = useKrava();

  useEffect(() => {
    if (ready && !authed) navigate("/", { replace: true });
  }, [ready, authed, navigate]);

  if (!ready || !authed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AppLogo className="h-16 w-16 animate-pulse-soft" />
        <p className="text-sm text-muted-foreground">Opening your private space…</p>
      </main>
    );
  }

  return <KravaChat />;
}
