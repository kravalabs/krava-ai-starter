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
    const r1 = await fetch("https://privyai.ch/api/platform/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${appKey}` },
      body: JSON.stringify({ externalUserId: "diag-test-user" }),
    });
    const j1 = await r1.json();
    result.usersStatus = r1.status;
    result.usersBody = j1;
    const userToken = j1?.userToken;

    const r2 = await fetch("https://privyai.ch/api/agent/status", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    result.agentStatus = r2.status;
    result.agentBody = (await r2.text()).slice(0, 500);

    const r3 = await fetch("https://privyai.ch/api/agent/provision", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({}),
    });
    result.provisionStatus = r3.status;
    result.provisionBody = (await r3.text()).slice(0, 500);
  } catch (e) {
    result.error = (e as Error).message;
  }
  return new Response(JSON.stringify(result, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
