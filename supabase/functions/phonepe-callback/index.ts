import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-verify, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const body = await req.json();
    const { response } = body;

    if (!response) {
      return new Response(JSON.stringify({ error: "No response data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode response
    const decodedResponse = JSON.parse(atob(response));
    console.log("PhonePe callback response:", JSON.stringify(decodedResponse));

    const merchantId = Deno.env.get("PHONEPE_MERCHANT_ID");
    const saltKey = Deno.env.get("PHONEPE_SALT_KEY");
    const saltIndex = Deno.env.get("PHONEPE_SALT_INDEX") || "1";

    if (!merchantId || !saltKey) {
      console.error("PhonePe not configured");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the callback by checking payment status
    const transactionId = decodedResponse.data?.merchantTransactionId;
    if (!transactionId) {
      return new Response(JSON.stringify({ error: "No transaction ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify status with PhonePe
    const statusUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${transactionId}`;
    const statusChecksum = await sha256(`/pg/v1/status/${merchantId}/${transactionId}` + saltKey);
    const xVerify = statusChecksum + "###" + saltIndex;

    const statusRes = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": xVerify,
        "X-MERCHANT-ID": merchantId,
      },
    });

    const statusData = await statusRes.json();
    console.log("PhonePe status check:", JSON.stringify(statusData));

    if (statusData.code !== "PAYMENT_SUCCESS") {
      console.log("Payment not successful:", statusData.code);
      return new Response(JSON.stringify({ success: false, code: statusData.code }), {
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
      .ilike("description", `%${transactionId}%`)
      .single();

    if (!pendingTx) {
      console.error("Pending transaction not found for:", transactionId);
      return new Response(JSON.stringify({ error: "Transaction not found" }), {
        status: 404,
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
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
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
          ` | PhonePe: ${statusData.data?.transactionId || ""}`,
      })
      .eq("id", pendingTx.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
