import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { planId, minutes, bonus, price, redirectUrl } = await req.json();
    if (!planId || !minutes || price === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") || "1";
    if (!merchantId || !saltKey) {
      return new Response(JSON.stringify({ error: "PhonePe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionId = `ST_${userId.substring(0, 8)}_${Date.now()}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/phonepe-callback`;

    const payload = {
      merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: price * 100, // paise
      redirectUrl: redirectUrl || "https://singletape.in/recharge?status=success",
      redirectMode: "REDIRECT",
      callbackUrl,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const checksum = await sha256(base64Payload + "/pg/v1/pay" + saltKey);
    const xVerify = checksum + "###" + saltIndex;

    // PhonePe UAT/Test endpoint
    const phonepeUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

    const res = await fetch(phonepeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("PhonePe initiation failed:", data);
      return new Response(JSON.stringify({ error: "PhonePe payment initiation failed", details: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store transaction info for callback verification
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("wallet_transactions").insert({
      user_id: userId,
      type: "pending",
      minutes: (minutes || 0) + (bonus || 0),
      amount: price,
      description: `PhonePe pending: ${transactionId} | Plan: ${planId}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: data.data?.instrumentResponse?.redirectInfo?.url,
        transactionId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
