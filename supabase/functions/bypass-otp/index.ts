import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-version",
};

async function logRequest(functionName: string, method: string, statusCode: number, responseTimeMs: number, apiVersion: string, errorMessage?: string, ip?: string) {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    await admin.from("api_request_logs").insert({ function_name: functionName, method, status_code: statusCode, response_time_ms: responseTimeMs, api_version: apiVersion, error_message: errorMessage || null, ip_address: ip || null });
  } catch (_) {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const apiVersion = req.headers.get("X-API-Version") || "v1";
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

  try {
    const { email, otp } = await req.json();

    if (!email || otp !== "111111") {
      const elapsed = Date.now() - start;
      await logRequest("bypass-otp", req.method, 401, elapsed, apiVersion, "Invalid bypass code", ip || undefined);
      return new Response(JSON.stringify({ error: "Invalid bypass code" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ filter: `email.eq.${email}` });
    const existingUser = users?.[0];

    if (existingUser) {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
      if (error) {
        const elapsed = Date.now() - start;
        await logRequest("bypass-otp", req.method, 400, elapsed, apiVersion, error.message, ip || undefined);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const elapsed = Date.now() - start;
      logRequest("bypass-otp", req.method, 200, elapsed, apiVersion, undefined, ip || undefined);
      return new Response(JSON.stringify({ token_hash: data.properties?.hashed_token, user_id: existingUser.id, is_new: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      const randomPass = crypto.randomUUID() + "!Aa1";
      const { data, error } = await supabaseAdmin.auth.admin.createUser({ email, password: randomPass, email_confirm: true });
      if (error) {
        const elapsed = Date.now() - start;
        await logRequest("bypass-otp", req.method, 400, elapsed, apiVersion, error.message, ip || undefined);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
      const elapsed = Date.now() - start;
      logRequest("bypass-otp", req.method, 200, elapsed, apiVersion, undefined, ip || undefined);
      return new Response(JSON.stringify({ token_hash: linkData?.properties?.hashed_token, user_id: data.user?.id, is_new: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    const elapsed = Date.now() - start;
    await logRequest("bypass-otp", req.method, 500, elapsed, apiVersion, "Internal server error", ip || undefined);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
