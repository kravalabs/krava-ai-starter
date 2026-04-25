import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createPrivyPlatformClient } from "npm:@privyai/api-client@0.1.0";

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
      Deno.env.get("SUPABASE_ANON_KEY") ??
        Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appKey = Deno.env.get("PRIVY_APP_KEY");
    if (!appKey) {
      return new Response(
        JSON.stringify({ error: "PRIVY_APP_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("[privy-session] appKey length", appKey.length, "prefix", appKey.slice(0, 6));
    const platform = createPrivyPlatformClient({
      baseUrl: PRIVY_BASE_URL,
      appKey,
    });

    try {
      const { userToken } = await platform.users.getOrCreate(user.id);
      console.log("[privy-session] success userToken length", userToken?.length);
      return new Response(JSON.stringify({ userToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (sdkErr) {
      const anyErr = sdkErr as { name?: string; message?: string; status?: number; body?: unknown; cause?: unknown };
      console.error("[privy-session] SDK error", {
        name: anyErr?.name,
        message: anyErr?.message,
        status: anyErr?.status,
        body: anyErr?.body,
        cause: anyErr?.cause,
      });
      return new Response(
        JSON.stringify({
          error: anyErr?.message ?? "Privy SDK call failed",
          status: anyErr?.status,
          body: anyErr?.body,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  } catch (e) {
    console.error("privy-session error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
