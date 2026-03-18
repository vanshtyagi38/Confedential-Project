import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHONEPE_SANDBOX_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";

async function getAuthToken(clientId: string, clientSecret: string): Promise<string> {
  const tokenUrl = `${PHONEPE_SANDBOX_URL}/v1/oauth/token`;
  const body = `client_id=${clientId}&client_version=1&client_secret=${clientSecret}&grant_type=client_credentials`;

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Token fetch failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // PhonePe sends callback as POST with JSON body
    const body = await req.json();
    console.log("PhonePe callback received:", JSON.stringify(body));

    const merchantOrderId = body.merchantOrderId || body.data?.merchantOrderId;
    if (!merchantOrderId) {
      console.error("No merchantOrderId in callback");
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("PHONEPE_CLIENT_ID");
    const clientSecret = Deno.env.get("PHONEPE_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      console.error("PhonePe not configured");
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify payment status with PhonePe
    const accessToken = await getAuthToken(clientId, clientSecret);

    const statusRes = await fetch(
      `${PHONEPE_SANDBOX_URL}/checkout/v2/order/${merchantOrderId}/status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${accessToken}`,
        },
      }
    );

    const statusData = await statusRes.json();
    console.log("PhonePe status check:", JSON.stringify(statusData));

    const paymentState = statusData.state || statusData.data?.state;
    if (paymentState !== "COMPLETED") {
      console.log("Payment not completed:", paymentState);
      return new Response(JSON.stringify({ success: false, state: paymentState }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Payment successful - update balance
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the pending transaction
    const { data: pendingTx } = await serviceClient
      .from("wallet_transactions")
      .select("*")
      .eq("type", "pending")
      .ilike("description", `%${merchantOrderId}%`)
      .single();

    if (!pendingTx) {
      console.error("Pending transaction not found for:", merchantOrderId);
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current balance
    const { data: profile } = await serviceClient
      .from("user_profiles")
      .select("balance_minutes")
      .eq("user_id", pendingTx.user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newBalance = profile.balance_minutes + pendingTx.minutes;

    // Update balance
    await serviceClient
      .from("user_profiles")
      .update({ balance_minutes: newBalance })
      .eq("user_id", pendingTx.user_id);

    // Update transaction to credit
    await serviceClient
      .from("wallet_transactions")
      .update({
        type: "credit",
        description: pendingTx.description?.replace("pending", "completed") +
          ` | PhonePe order: ${merchantOrderId}`,
      })
      .eq("id", pendingTx.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
