import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_TTL_MS = 10 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { email, otp } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const otpCode = typeof otp === "string" ? otp.trim() : "";

    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!/^\d{6}$/.test(otpCode)) {
      return new Response(JSON.stringify({ error: "Enter a valid 6-digit code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      .eq("template_name", "magiclink")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const matched = (data || []).find((row) => {
      const metadata = row.metadata as { otp_code?: string; token_hash?: string } | null;
      if (!metadata?.otp_code || !metadata?.token_hash) return false;
      if (metadata.otp_code !== otpCode) return false;

      const createdAt = new Date(row.created_at).getTime();
      if (Number.isNaN(createdAt)) return false;
      return now - createdAt <= OTP_TTL_MS;
    });

    if (!matched) {
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenHash = (matched.metadata as { token_hash?: string }).token_hash;

    return new Response(JSON.stringify({ token_hash: tokenHash }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
