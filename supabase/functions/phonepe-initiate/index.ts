import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHONEPE_SANDBOX_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

async function getAuthToken(clientId: string, clientSecret: string, clientVersion: string): Promise<string> {
  const tokenUrl = `${PHONEPE_SANDBOX_URL}/v1/oauth/token`;
  const body = `client_id=${clientId}&client_version=${clientVersion}&client_secret=${clientSecret}&grant_type=client_credentials`;

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error("Token fetch failed:", JSON.stringify(data));
    throw new Error(`Failed to get auth token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
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

    const clientId = Deno.env.get("PHONEPE_CLIENT_ID");
    const clientSecret = Deno.env.get("PHONEPE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "PhonePe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Get OAuth token
    const accessToken = await getAuthToken(clientId, clientSecret, "1");

    // Step 2: Create payment order
    const merchantOrderId = `ST_${userId.substring(0, 8)}_${Date.now()}`;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callbackUrl = `${supabaseUrl}/functions/v1/phonepe-callback`;

    const paymentPayload = {
      merchantOrderId,
      amount: price * 100, // paise
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: userId,
        udf2: planId,
        udf3: String(minutes),
        udf4: String(bonus || 0),
        udf5: String(price),
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: redirectUrl || "https://singletape.in/recharge?status=success",
          callbackUrl,
        },
      },
    };

    const payRes = await fetch(`${PHONEPE_SANDBOX_URL}/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const payData = await payRes.json();
    if (!payRes.ok) {
      console.error("PhonePe payment creation failed:", JSON.stringify(payData));
      return new Response(JSON.stringify({ error: "PhonePe payment initiation failed", details: payData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store pending transaction
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await serviceClient.from("wallet_transactions").insert({
      user_id: userId,
      type: "pending",
      minutes: (minutes || 0) + (bonus || 0),
      amount: price,
      description: `PhonePe pending: ${merchantOrderId} | Plan: ${planId}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: payData.redirectUrl || payData.data?.redirectUrl,
        orderId: merchantOrderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
