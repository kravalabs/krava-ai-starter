import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const PRIVY_CHAT_URL = "https://privyai.ch/api/platform/chat";

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
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      system?: string;
      model?: string;
      provider?: "gemini" | "privy";
      userToken?: string;
      chatId?: string;
    } | null;
    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Privy provider ----
    if (body.provider === "privy") {
      if (!body.userToken) {
        return new Response(JSON.stringify({ error: "Missing Privy userToken" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const lastUser = [...body.messages].reverse().find((m) => m.role === "user");
      if (!lastUser) {
        return new Response(JSON.stringify({ error: "No user message" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const privyRes = await fetch(PRIVY_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${body.userToken}`,
        },
        body: JSON.stringify({
          message: lastUser.content,
          ...(body.chatId ? { chatId: body.chatId } : {}),
        }),
      });
      if (!privyRes.ok || !privyRes.body) {
        const t = await privyRes.text().catch(() => "");
        console.error("Privy chat failed", privyRes.status, t);
        return new Response(
          JSON.stringify({ error: "Privy chat failed", status: privyRes.status, body: t }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(privyRes.body, {
        headers: {
          ...corsHeaders,
          "Content-Type":
            privyRes.headers.get("content-type") ?? "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // ---- Gemini (default) ----
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const upstream = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model ?? "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              body.system ??
              "You are Luna, a warm and knowledgeable pregnancy companion. " +
                "You help expecting parents with nutrition, emotional support, symptom questions, and birth preparation. " +
                "Be warm, reassuring, and evidence-based. Never alarmist. " +
                "Always recommend consulting a healthcare provider for medical decisions.",
          },
          ...body.messages,
        ],
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("Luna AI gateway failed", upstream.status, text);
      return new Response(
        JSON.stringify({ error: "Luna couldn't respond. Please try again." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Stream the SSE body straight back to the browser.
    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type":
          upstream.headers.get("content-type") ?? "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown";
    console.error("privy-chat error", e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
