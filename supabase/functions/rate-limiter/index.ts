import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limit store (per isolate - resets on cold start)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const LIMITS: Record<string, { max: number; windowMs: number }> = {
  login: { max: 5, windowMs: 15 * 60 * 1000 },      // 5 per 15 min
  signup: { max: 3, windowMs: 60 * 60 * 1000 },      // 3 per hour
  otp: { max: 5, windowMs: 10 * 60 * 1000 },         // 5 per 10 min
  chat: { max: 60, windowMs: 60 * 1000 },             // 60 per minute
  report: { max: 5, windowMs: 60 * 60 * 1000 },      // 5 per hour
  general: { max: 100, windowMs: 60 * 1000 },         // 100 per minute
};

function checkRateLimit(key: string, action: string): { allowed: boolean; retryAfter: number } {
  const limit = LIMITS[action] || LIMITS.general;
  const now = Date.now();
  const entry = rateLimits.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limit.max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimits) {
    if (now > entry.resetAt) rateLimits.delete(key);
  }
}, 5 * 60 * 1000);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, identifier } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    const key = `${action}:${identifier || ip}`;

    const result = checkRateLimit(key, action);

    if (!result.allowed) {
      // Log suspicious activity
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      await supabaseAdmin.from("security_events").insert({
        event_type: "rate_limit_exceeded",
        ip_address: ip,
        details: { action, identifier, key },
        severity: "warning",
      });

      return new Response(
        JSON.stringify({ error: "Too many requests", retryAfter: result.retryAfter }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(result.retryAfter) } }
      );
    }

    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
