import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");

    // Return client ID for frontend initialization
    if (body.action === "get_client_id") {
      return new Response(
        JSON.stringify({ client_id: GOOGLE_CLIENT_ID || null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { credential } = body;
    if (!credential) {
      return new Response(
        JSON.stringify({ error: "Missing credential" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GOOGLE_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify Google ID token
    const verifyResp = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    if (!verifyResp.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid Google token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyResp.json();

    // Security: verify audience
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return new Response(
        JSON.stringify({ error: "Token audience mismatch" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Security: verify issuer
    if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) {
      return new Response(
        JSON.stringify({ error: "Invalid token issuer" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    // Security: verify email
    if (payload.email_verified !== "true" && payload.email_verified !== true) {
      return new Response(
        JSON.stringify({ error: "Email not verified" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = payload.email;
    const name = payload.name || email.split("@")[0];
    const picture = payload.picture || null;
    const googleId = payload.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find existing user by email
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            full_name: name,
            avatar_url: picture,
            provider: "google",
            google_id: googleId,
          },
        });
      if (createError || !newUser?.user) {
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = newUser.user.id;

      // Create profile for new user
      await supabaseAdmin.from("user_profiles").insert({
        user_id: userId,
        display_name: name,
        gender: "male",
        preferred_gender: "female",
        age: 22,
        email,
        image_url: picture,
      });
    }

    // Generate magic link token for session creation
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (sessionError || !sessionData) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const actionLink = sessionData.properties?.action_link || "";
    let tokenHash = "";
    try {
      const linkUrl = new URL(actionLink);
      tokenHash = linkUrl.searchParams.get("token_hash") || "";
      if (!tokenHash) {
        const hashParams = new URLSearchParams(linkUrl.hash.replace("#", ""));
        tokenHash = hashParams.get("token_hash") || "";
      }
    } catch {
      // Try to extract from raw string
      const match = actionLink.match(/token_hash=([^&]+)/);
      tokenHash = match?.[1] || "";
    }

    return new Response(
      JSON.stringify({
        token_hash: tokenHash,
        email,
        name,
        picture,
        is_new: !existingUser,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
