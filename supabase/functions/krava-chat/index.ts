import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const KRAVA_CHAT_URL = "https://privyai.ch/api/platform/chat";

// ── Customise your AI persona here ─────────────────────────────────────────
// This prompt is used when the user selects the Gemini provider.
// The Krava provider uses the system prompt you set on your Krava app via
// the platform API (POST /api/platform/apps).
const GEMINI_SYSTEM_PROMPT =
  Deno.env.get("GEMINI_SYSTEM_PROMPT") ??
  "You are a helpful, warm, and thoughtful AI companion. " +
    "Be concise, supportive, and evidence-based where relevant. " +
    "Always recommend consulting a licensed professional for important decisions.";
// ───────────────────────────────────────────────────────────────────────────

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
      provider?: "gemini" | "krava";
      userToken?: string;
      chatId?: string;
    } | null;
    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Krava provider (zero-knowledge encrypted) ──────────────────────────
    if (body.provider === "krava") {
      if (!body.userToken) {
        return new Response(JSON.stringify({ error: "Missing Krava userToken" }), {
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
      const reqBody = JSON.stringify({
        message: lastUser.content,
        ...(body.chatId ? { chatId: body.chatId } : {}),
      });
      const kravaRes = await fetch(KRAVA_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${body.userToken}`,
        },
        body: reqBody,
      });
      if (!kravaRes.ok || !kravaRes.body) {
        const t = await kravaRes.text().catch(() => "");
        console.error("Krava chat failed", kravaRes.status, t);
        return new Response(
          JSON.stringify({ error: "Krava chat failed", status: kravaRes.status, body: t }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const [forward, inspect] = kravaRes.body.tee();
      (async () => {
        const reader = inspect.getReader();
        const dec = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
        }
        console.log("[krava-chat] stream complete, chars:", buf.length);
      })().catch((e) => console.error("[krava-chat] inspect error", e));

      return new Response(forward, {
        headers: {
          ...corsHeaders,
          "Content-Type":
            kravaRes.headers.get("content-type") ?? "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // ── Gemini (default, via Lovable AI gateway) ───────────────────────────
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway is not configured (LOVABLE_API_KEY missing)" }),
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
          { role: "system", content: body.system ?? GEMINI_SYSTEM_PROMPT },
          ...body.messages,
        ],
        stream: true,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("Gemini gateway failed", upstream.status, text);
      return new Response(
        JSON.stringify({ error: "AI couldn't respond. Please try again." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
    console.error("krava-chat error", e);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
