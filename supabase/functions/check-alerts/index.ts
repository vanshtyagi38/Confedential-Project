import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch active thresholds
    const { data: thresholds } = await supabaseAdmin
      .from("api_alert_thresholds")
      .select("*")
      .eq("is_active", true);

    if (!thresholds || thresholds.length === 0) {
      return new Response(JSON.stringify({ alerts: [], message: "No active thresholds" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alerts: any[] = [];
    const now = Date.now();

    for (const threshold of thresholds) {
      const windowStart = new Date(now - threshold.window_minutes * 60 * 1000).toISOString();

      // Skip if this threshold was triggered recently (within 2x the window to avoid spam)
      if (threshold.last_triggered_at) {
        const lastTriggered = new Date(threshold.last_triggered_at).getTime();
        if (now - lastTriggered < threshold.window_minutes * 60 * 1000 * 2) continue;
      }

      const { data: logs } = await supabaseAdmin
        .from("api_request_logs")
        .select("status_code, response_time_ms")
        .gte("created_at", windowStart);

      if (!logs || logs.length === 0) continue;

      let currentValue = 0;
      let triggered = false;

      switch (threshold.metric_name) {
        case "error_rate_percent": {
          const errors = logs.filter((l: any) => l.status_code >= 400).length;
          currentValue = Math.round((errors / logs.length) * 100 * 10) / 10;
          triggered = currentValue > threshold.threshold_value;
          break;
        }
        case "avg_response_time_ms": {
          currentValue = Math.round(logs.reduce((s: number, l: any) => s + l.response_time_ms, 0) / logs.length);
          triggered = currentValue > threshold.threshold_value;
          break;
        }
        case "total_errors_count": {
          currentValue = logs.filter((l: any) => l.status_code >= 400).length;
          triggered = currentValue > threshold.threshold_value;
          break;
        }
        case "p95_response_time_ms": {
          const sorted = logs.map((l: any) => l.response_time_ms).sort((a: number, b: number) => a - b);
          const p95Index = Math.floor(sorted.length * 0.95);
          currentValue = sorted[p95Index] || 0;
          triggered = currentValue > threshold.threshold_value;
          break;
        }
      }

      if (triggered) {
        // Insert alert
        await supabaseAdmin.from("api_alerts").insert({
          alert_type: "threshold_exceeded",
          metric_name: threshold.metric_name,
          current_value: currentValue,
          threshold_value: threshold.threshold_value,
          details: {
            window_minutes: threshold.window_minutes,
            total_requests: logs.length,
            timestamp: new Date().toISOString(),
          },
        });

        // Update last_triggered_at
        await supabaseAdmin
          .from("api_alert_thresholds")
          .update({ last_triggered_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", threshold.id);

        // Create admin notification
        // Get admin user IDs
        const { data: adminRoles } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        const adminIds = (adminRoles || []).map((r: any) => r.user_id);

        if (adminIds.length > 0) {
          await supabaseAdmin.from("admin_notifications").insert({
            title: `⚠️ API Alert: ${threshold.metric_name.replace(/_/g, " ")}`,
            message: `${threshold.metric_name.replace(/_/g, " ")} is ${currentValue} (threshold: ${threshold.threshold_value}) over the last ${threshold.window_minutes} minutes.`,
            type: "alert",
            target: "admins",
            target_user_ids: adminIds,
            sent_by: adminIds[0] || "system",
          });
        }

        alerts.push({
          metric: threshold.metric_name,
          current: currentValue,
          threshold: threshold.threshold_value,
          window_minutes: threshold.window_minutes,
        });
      }
    }

    // Log this check
    try {
      await supabaseAdmin.from("api_request_logs").insert({
        function_name: "check-alerts",
        method: "POST",
        status_code: 200,
        response_time_ms: Date.now() - now,
        api_version: "v1",
      });
    } catch (_) {}

    return new Response(
      JSON.stringify({ alerts, checked: thresholds.length, triggered: alerts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Alert check error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
