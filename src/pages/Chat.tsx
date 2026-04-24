import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@/hooks/usePrivy";
import LunaChat from "@/components/LunaChat";
import { MoonLogo } from "@/components/MoonLogo";

export default function ChatPage() {
  const navigate = useNavigate();
  const { userToken, ready, initPrivySession } = usePrivy();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) {
        navigate("/", { replace: true });
        return;
      }
      if (!userToken && ready) {
        try { await initPrivySession(); } catch (e) { console.error(e); }
      }
      setChecking(false);
    })();
    return () => { mounted = false; };
  }, [navigate, userToken, ready, initPrivySession]);

  if (checking || !ready || !userToken) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <MoonLogo className="h-16 w-16 animate-pulse-soft" />
        <p className="text-sm text-muted-foreground">Opening your private space…</p>
      </main>
    );
  }

  return <LunaChat />;
}