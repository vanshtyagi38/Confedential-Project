import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const apiVersion = req.headers.get("X-API-Version") || "v1";

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const services: Record<string, { status: string; latency_ms: number; error?: string }> = {};

  // Test Database
  const dbStart = Date.now();
  try {
    const { error } = await supabaseAdmin.from("user_profiles").select("id").limit(1);
    services.database = { status: error ? "degraded" : "up", latency_ms: Date.now() - dbStart, ...(error && { error: error.message }) };
  } catch (e) {
    services.database = { status: "down", latency_ms: Date.now() - dbStart, error: String(e) };
  }

  // Test Auth
  const authStart = Date.now();
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    services.auth = { status: error ? "degraded" : "up", latency_ms: Date.now() - authStart, ...(error && { error: error.message }) };
  } catch (e) {
    services.auth = { status: "down", latency_ms: Date.now() - authStart, error: String(e) };
  }

  // Test Storage
  const storageStart = Date.now();
  try {
    const { error } = await supabaseAdmin.storage.getBucket("chat-images");
    services.storage = { status: error ? "degraded" : "up", latency_ms: Date.now() - storageStart, ...(error && { error: error.message }) };
  } catch (e) {
    services.storage = { status: "down", latency_ms: Date.now() - storageStart, error: String(e) };
  }

  const overallStatus = Object.values(services).every(s => s.status === "up") ? "healthy"
    : Object.values(services).some(s => s.status === "down") ? "unhealthy" : "degraded";

  const responseTime = Date.now() - start;

  // Log this request
  try {
    await supabaseAdmin.from("api_request_logs").insert({
      function_name: "health-check",
      method: req.method,
      status_code: 200,
      response_time_ms: responseTime,
      api_version: apiVersion,
    });
  } catch (_) { /* non-critical */ }

  return new Response(
    JSON.stringify({
      status: overallStatus,
      version: apiVersion,
      supported_versions: ["v1"],
      timestamp: new Date().toISOString(),
      response_time_ms: responseTime,
      services,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
