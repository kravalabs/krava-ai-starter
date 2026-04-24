import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { createPrivyPlatformClient, createPrivyClient } from "npm:@privyai/api-client@0.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRIVY_BASE_URL = "https://www.privyai.ch";

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

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appKey = Deno.env.get("PRIVY_APP_KEY");
    if (!appKey) {
      return new Response(JSON.stringify({ error: "PRIVY_APP_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null) as
      | { messages?: Array<{ role: "user" | "assistant"; content: string }>; system?: string; model?: string }
      | null;
    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mint a fresh Privy user token, then a gateway token for this chat call.
    const platform = createPrivyPlatformClient({ baseUrl: PRIVY_BASE_URL, appKey });
    const { userToken } = await platform.users.getOrCreate(user.id);

    const client = createPrivyClient({ baseUrl: PRIVY_BASE_URL, getToken: () => userToken });
    const creds = await client.agent.getGatewayCredentials();

    const upstream = await client.v1.agentChat(
      {
        model: body.model ?? "claude-sonnet-4-6-20250514",
        system: body.system ??
          "You are Luna, a warm and knowledgeable pregnancy companion. " +
          "You help expecting parents with nutrition, emotional support, symptom questions, and birth preparation. " +
          "Be warm, reassuring, and evidence-based. Never alarmist. " +
          "Always recommend consulting a healthcare provider for medical decisions.",
        messages: body.messages,
        stream: true,
      },
      { gatewayToken: creds.gatewayToken },
    );

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("Privy chat failed", upstream.status, text);
      return new Response(
        JSON.stringify({ error: `Privy responded ${upstream.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Stream the SSE body straight back to the browser.
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("privy-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});