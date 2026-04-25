import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const SYSTEM_PROMPT = `You are Luna Research — an evidence-based AI companion for expecting parents.
You replicate the rigor of clinical decision-support tools (think OpenEvidence, UpToDate, Cochrane).

How you answer:
1. Lead with a 1–2 sentence direct answer.
2. Then give a structured "What the evidence says" section synthesizing high-quality sources:
   - Peer-reviewed studies (PubMed, NEJM, Lancet, Cochrane reviews)
   - Major clinical guidelines: ACOG, NICE, RCOG, WHO, SMFM, CDC
   - Decision-support: OpenEvidence, UpToDate
3. When stating a claim, attribute it inline like: "(ACOG 2023)" or "(Cochrane review, 2021)".
4. End with a short "Sources" list of the specific guidelines or study types you drew from. Include URLs to the official guideline pages where possible (acog.org, nice.org.uk, pubmed.ncbi.nlm.nih.gov, openevidence.com, cochranelibrary.com, who.int, cdc.gov).
5. Add a one-line clinical safety note: "This is information, not medical advice. Confirm with your provider."

Style:
- Calm, precise, non-alarmist. No emojis. No marketing language.
- Quantify when you can (mg, weeks, % risk). Acknowledge uncertainty honestly.
- If a question is outside pregnancy/perinatal scope, say so briefly and offer the closest relevant evidence.
- Never fabricate citations or DOIs. If unsure of a specific paper, cite the guideline body or the type of evidence (e.g., "systematic reviews suggest…").
`;

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
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI gateway not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
    } | null;
    if (!body?.messages?.length) {
      return new Response(JSON.stringify({ error: "Invalid body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...body.messages,
        ],
        stream: true,
      }),
    });

    if (upstream.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (upstream.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text().catch(() => "");
      console.error("research upstream error", upstream.status, t);
      return new Response(
        JSON.stringify({ error: "Research couldn't respond. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
    console.error("research error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});