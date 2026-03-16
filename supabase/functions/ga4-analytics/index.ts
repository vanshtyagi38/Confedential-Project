import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const toBase64Url = (str: string) =>
    btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const toBase64UrlFromBytes = (bytes: Uint8Array) => {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  }));

  const unsignedToken = `${header}.${payload}`;

  const pemContents = serviceAccount.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const signedToken = `${unsignedToken}.${toBase64UrlFromBytes(new Uint8Array(signature))}`;

  const tokenRes = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`Token error: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function runReport(accessToken: string, propertyId: string, body: any) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (data.error) {
    console.error("GA4 runReport error:", JSON.stringify(data.error));
  }
  return data;
}

async function runRealtimeReport(accessToken: string, propertyId: string, body: any) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  if (data.error) {
    console.error("GA4 runRealtimeReport error:", JSON.stringify(data.error));
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("GA_SERVICE_ACCOUNT_JSON");
    const propertyId = Deno.env.get("GA4_PROPERTY_ID");

    if (!serviceAccountJson || !propertyId) {
      throw new Error("Missing GA_SERVICE_ACCOUNT_JSON or GA4_PROPERTY_ID");
    }

    // Parse request body for date range
    let startDate = "7daysAgo";
    let endDate = "today";
    try {
      const body = await req.json();
      if (body.startDate) startDate = body.startDate;
      if (body.endDate) endDate = body.endDate;
    } catch {
      // No body or invalid JSON, use defaults
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Run all reports in parallel
    const [activeUsersRes, todayRes, pageViewsRes, countriesRes, topPagesRes, dailyRes, newVsReturningRes, userLifecycleRes] = await Promise.all([
      // Active users (realtime)
      runRealtimeReport(accessToken, propertyId, {
        metrics: [{ name: "activeUsers" }],
      }),
      // Today's visitors
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "totalUsers" }, { name: "screenPageViews" }, { name: "sessions" }],
      }),
      // Page views for selected range
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "screenPageViews" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // Top countries for selected range
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }],
        dimensions: [{ name: "country" }],
        orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
        limit: 10,
      }),
      // Top pages for selected range
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "screenPageViews" }],
        dimensions: [{ name: "pagePath" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      // Daily visitors for selected range (with new vs returning)
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "newUsers" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
      // New vs returning users breakdown
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagedSessions" }, { name: "averageSessionDuration" }],
        dimensions: [{ name: "newVsReturning" }],
      }),
      // User lifecycle: daily new users (first-time visitors)
      runReport(accessToken, propertyId, {
        dateRanges: [{ startDate, endDate }],
        metrics: [{ name: "newUsers" }, { name: "totalUsers" }],
        dimensions: [{ name: "date" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const parseRows = (report: any) =>
      (report.rows || []).map((row: any) => ({
        dimensions: (row.dimensionValues || []).map((d: any) => d.value),
        metrics: (row.metricValues || []).map((m: any) => m.value),
      }));

    const result = {
      activeUsers: activeUsersRes?.rows?.[0]?.metricValues?.[0]?.value || "0",
      todayVisitors: todayRes?.rows?.[0]?.metricValues?.[0]?.value || "0",
      todayPageViews: todayRes?.rows?.[0]?.metricValues?.[1]?.value || "0",
      todaySessions: todayRes?.rows?.[0]?.metricValues?.[2]?.value || "0",
      pageViewsByDay: parseRows(pageViewsRes),
      countries: parseRows(countriesRes),
      topPages: parseRows(topPagesRes),
      dailyVisitors: parseRows(dailyRes),
      newVsReturning: parseRows(newVsReturningRes),
      userLifecycle: parseRows(userLifecycleRes),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("GA4 Analytics error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
