import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createPrivyPlatformClient, createPrivyClient } from "npm:@privyai/api-client@0.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRIVY_BASE_URL = "https://privyai.ch";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const appKey = Deno.env.get("PRIVY_APP_KEY")!;
    const platform = createPrivyPlatformClient({ baseUrl: PRIVY_BASE_URL, appKey });
    const { userToken } = await platform.users.getOrCreate(user.id);
    const client = createPrivyClient({ baseUrl: PRIVY_BASE_URL, getToken: () => userToken });
    try { await client.memory.clear(); } catch (e) { console.error("memory clear", e); }
    try { await client.agent.destroy(); } catch (e) { console.error("agent destroy", e); }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("privy-burn error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});