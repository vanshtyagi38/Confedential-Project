import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logRequest(functionName: string, method: string, statusCode: number, responseTimeMs: number, errorMessage?: string, ip?: string) {
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    await admin.from("api_request_logs").insert({ 
      function_name: functionName, 
      method, 
      status_code: statusCode, 
      response_time_ms: responseTimeMs, 
      api_version: "v1",
      error_message: errorMessage || null, 
      ip_address: ip || null 
    });
  } catch (_) {}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || null;

  try {
    const body = await req.json();
    const { credential } = body;

    if (!credential) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 400, elapsed, "Missing credential", ip || undefined);
      return new Response(JSON.stringify({ error: "Missing credential" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    if (!GOOGLE_CLIENT_ID) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 500, elapsed, "Server misconfiguration", ip || undefined);
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Verify the Google ID token
    const verifyResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!verifyResp.ok) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 401, elapsed, "Invalid Google token", ip || undefined);
      return new Response(JSON.stringify({ error: "Invalid Google token" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const payload = await verifyResp.json();

    // Validate token
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 401, elapsed, "Token audience mismatch", ip || undefined);
      return new Response(JSON.stringify({ error: "Token audience mismatch" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 401, elapsed, "Invalid token issuer", ip || undefined);
      return new Response(JSON.stringify({ error: "Invalid token issuer" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      const elapsed = Date.now() - start;
      await logRequest("google-oauth", req.method, 401, elapsed, "Email not verified", ip || undefined);
      return new Response(JSON.stringify({ error: "Email not verified" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture || null;
    const googleId = payload.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!, 
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for existing user by email
    let existingUser = null;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (listError) { 
        console.error("listUsers error:", listError); 
        break; 
      }
      const found = userList?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) { 
        existingUser = found; 
        break; 
      }
      if (!userList?.users || userList.users.length < perPage) break;
      page++;
    }

    let userId: string;
    let isNew = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email, 
        email_confirm: true,
        user_metadata: { 
          full_name: name, 
          avatar_url: picture, 
          provider: "google", 
          google_id: googleId 
        },
      });
      
      if (createError || !newUser?.user) {
        const elapsed = Date.now() - start;
        await logRequest("google-oauth", req.method, 500, elapsed, "Failed to create user", ip || undefined);
        return new Response(JSON.stringify({ error: "Failed to create user" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }
      
      userId = newUser.user.id;
      isNew = true;

      // Create user profile
      const { error: profileError } = await supabaseAdmin.from("user_profiles").insert({
        user_id: userId, 
        display_name: name, 
        gender: "male", 
        preferred_gender: "female", 
        age: 22, 
        email, 
        image_url: picture,
        balance_minutes: 5,
        spin_credits: 0,
      });
      
      if (profileError) console.error("Profile creation error:", profileError);
    }

    // Create a session using signInWithIdToken (more direct than magic link)
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithIdToken({
      provider: "google",
      token: credential,
      nonce: undefined,
    });

    if (signInError || !signInData.session) {
      // Fallback to magic link approach
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({ 
        type: "magiclink", 
        email 
      });

      if (sessionError || !sessionData) {
        const elapsed = Date.now() - start;
        await logRequest("google-oauth", req.method, 500, elapsed, "Failed to create session", ip || undefined);
        return new Response(JSON.stringify({ error: "Failed to create session" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const hashedToken = sessionData.properties?.hashed_token || "";
      if (!hashedToken) {
        const elapsed = Date.now() - start;
        await logRequest("google-oauth", req.method, 500, elapsed, "Failed to create session token", ip || undefined);
        return new Response(JSON.stringify({ error: "Failed to create session token" }), { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const elapsed = Date.now() - start;
      logRequest("google-oauth", req.method, 200, elapsed, undefined, ip || undefined);

      return new Response(
        JSON.stringify({ 
          token_hash: hashedToken, 
          email, 
          name, 
          picture, 
          is_new: isNew 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return the actual session tokens
    const elapsed = Date.now() - start;
    logRequest("google-oauth", req.method, 200, elapsed, undefined, ip || undefined);

    return new Response(
      JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
        expires_in: signInData.session.expires_in,
        token_type: signInData.session.token_type,
        email,
        name,
        picture,
        is_new: isNew,
        provider_token: signInData.session.provider_token,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unhandled error:", err);
    const elapsed = Date.now() - start;
    await logRequest("google-oauth", req.method, 500, elapsed, "Internal server error", ip || undefined);
    return new Response(JSON.stringify({ error: "Internal server error" }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
