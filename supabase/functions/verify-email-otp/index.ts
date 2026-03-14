import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-version",
};

const OTP_TTL_MS = 10 * 60 * 1000;

async function logRequest(functionName: string, method: string, statusCode: number, responseTimeMs: number, apiVersion: string, errorMessage?: string, ip?: string) {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    await supabaseAdmin.from("api_request_logs").insert({
      function_name: functionName, method, status_code: statusCode,
      response_time_ms: responseTimeMs, api_version: apiVersion,
      error_message: errorMessage || null, ip_address: ip || null,
    });
  } catch (_) {}
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const apiVersion = req.headers.get("X-API-Version") || "v1";
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

  if (req.method !== "POST") {
    const elapsed = Date.now() - start;
    await logRequest("verify-email-otp", req.method, 405, elapsed, apiVersion, "Method not allowed", ip || undefined);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, otp } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const otpCode = typeof otp === "string" ? otp.trim() : "";

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      const elapsed = Date.now() - start;
      await logRequest("verify-email-otp", req.method, 400, elapsed, apiVersion, "Invalid email", ip || undefined);
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{6}$/.test(otpCode)) {
      const elapsed = Date.now() - start;
      await logRequest("verify-email-otp", req.method, 400, elapsed, apiVersion, "Invalid OTP format", ip || undefined);
      return new Response(JSON.stringify({ error: "Enter a valid 6-digit code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabaseAdmin
      .from("email_send_log")
      .select("created_at, metadata")
      .eq("recipient_email", normalizedEmail)
      .eq("status", "pending")
      .not("metadata", "is", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("DB lookup error:", error);
      const elapsed = Date.now() - start;
      await logRequest("verify-email-otp", req.method, 500, elapsed, apiVersion, "DB lookup error", ip || undefined);
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const matched = (data || []).find((row: any) => {
      const metadata = row.metadata as { otp_code?: string } | null;
      if (!metadata?.otp_code) return false;
      if (metadata.otp_code !== otpCode) return false;
      const createdAt = new Date(row.created_at).getTime();
      if (Number.isNaN(createdAt)) return false;
      return now - createdAt <= OTP_TTL_MS;
    });

    if (!matched) {
      const elapsed = Date.now() - start;
      await logRequest("verify-email-otp", req.method, 401, elapsed, apiVersion, "Invalid or expired code", ip || undefined);
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink", email: normalizedEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkError);
      const elapsed = Date.now() - start;
      await logRequest("verify-email-otp", req.method, 500, elapsed, apiVersion, "generateLink failed", ip || undefined);
      return new Response(JSON.stringify({ error: "Verification failed. Try again." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const elapsed = Date.now() - start;
    logRequest("verify-email-otp", req.method, 200, elapsed, apiVersion, undefined, ip || undefined);

    return new Response(
      JSON.stringify({ token_hash: linkData.properties.hashed_token }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    const elapsed = Date.now() - start;
    await logRequest("verify-email-otp", req.method, 500, elapsed, apiVersion, "Internal server error", ip || undefined);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
