import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

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

    // Look up the most recent OTP for this email
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
      return new Response(JSON.stringify({ error: "Verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      console.log("No matching OTP found for", normalizedEmail, "code:", otpCode);
      return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // OTP matched! Generate a fresh magiclink token via admin API
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("generateLink error:", linkError);
      return new Response(JSON.stringify({ error: "Verification failed. Try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("OTP verified successfully for", normalizedEmail);

    return new Response(
      JSON.stringify({ token_hash: linkData.properties.hashed_token }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
