import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRIVY_USERS_URL = "https://privyai.ch/api/platform/users";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ---- DEBUG MODE: GET /privy-session?debug=1 ----
  // Verifies PRIVY_APP_KEY against Privy's /users endpoint without requiring
  // a Supabase session. Returns full upstream status + body for inspection.
  const url = new URL(req.url);
  if (req.method === "GET" && url.searchParams.get("debug") === "1") {
    const appKey = Deno.env.get("PRIVY_APP_KEY");
    console.log("[privy-session][debug] PRIVY_APP_KEY present:", !!appKey,
      "length:", appKey?.length ?? 0,
      "prefix:", appKey ? appKey.slice(0, 6) + "…" : "n/a");
    if (!appKey) {
      return new Response(JSON.stringify({ ok: false, error: "PRIVY_APP_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const externalUserId = url.searchParams.get("externalUserId") ?? "debug-ping-user";
    const t0 = Date.now();
    let upstream: Response;
    try {
      upstream = await fetch(PRIVY_USERS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${appKey}` },
        body: JSON.stringify({ externalUserId }),
      });
    } catch (e) {
      console.error("[privy-session][debug] fetch threw", e);
      return new Response(JSON.stringify({ ok: false, stage: "fetch", error: String(e) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const body = await upstream.text();
    const ms = Date.now() - t0;
    const respHeaders: Record<string, string> = {};
    upstream.headers.forEach((v, k) => { respHeaders[k] = v; });
    console.log("[privy-session][debug] upstream", upstream.status, ms + "ms",
      "headers:", JSON.stringify(respHeaders),
      "bodyPreview:", body.slice(0, 500));
    let parsed: unknown;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    return new Response(JSON.stringify({
      ok: upstream.ok,
      url: PRIVY_USERS_URL,
      externalUserId,
      appKeyLength: appKey.length,
      appKeyPrefix: appKey.slice(0, 6),
      upstreamStatus: upstream.status,
      upstreamHeaders: respHeaders,
      upstreamBody: parsed ?? body,
      durationMs: ms,
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    console.log("[privy-session] requesting userToken for", user.id);
    const upstream = await fetch(PRIVY_USERS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${appKey}`,
      },
      body: JSON.stringify({ externalUserId: user.id }),
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error("[privy-session] upstream error", upstream.status, text);
      return new Response(
        JSON.stringify({ error: "Privy session failed", status: upstream.status, body: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userToken: string | undefined;
    try {
      userToken = (JSON.parse(text) as { userToken?: string }).userToken;
    } catch {
      /* ignore */
    }
    if (!userToken) {
      return new Response(
        JSON.stringify({ error: "Privy did not return userToken", body: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({ userToken }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
