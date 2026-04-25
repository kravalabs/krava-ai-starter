const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const appKey = Deno.env.get("PRIVY_APP_KEY") ?? "";
  const result: Record<string, unknown> = {
    appKeyLen: appKey.length,
    appKeyPrefix: appKey.slice(0, 6),
  };
  try {
    const r = await fetch("https://privyai.ch/api/platform/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${appKey}` },
      body: JSON.stringify({ externalUserId: "diag-test-user" }),
    });
    const text = await r.text();
    result.status = r.status;
    result.body = text.slice(0, 500);
    result.contentType = r.headers.get("content-type");
  } catch (e) {
    result.error = (e as Error).message;
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
