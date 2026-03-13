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
      console.error("Google token verification failed:", verifyResp.status);
      return new Response(
        JSON.stringify({ error: "Invalid Google token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await verifyResp.json();

    // Security: verify audience
    if (payload.aud !== GOOGLE_CLIENT_ID) {
      console.error("Token audience mismatch:", payload.aud);
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

    // Find existing user by email - paginate through ALL users
    let existingUser = null;
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (listError) {
        console.error("listUsers error:", listError);
        break;
      }
      const found = userList?.users?.find(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        existingUser = found;
        break;
      }
      // No more pages
      if (!userList?.users || userList.users.length < perPage) break;
      page++;
    }

    let userId: string;
    let isNew = false;

    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing user found:", userId);
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
        console.error("createUser error:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = newUser.user.id;
      isNew = true;
      console.log("New user created:", userId);

      // Create profile for new user
      const { error: profileError } = await supabaseAdmin.from("user_profiles").insert({
        user_id: userId,
        display_name: name,
        gender: "male",
        preferred_gender: "female",
        age: 22,
        email,
        image_url: picture,
      });
      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    // Generate magic link token for session creation
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (sessionError || !sessionData) {
      console.error("generateLink error:", sessionError);
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

    if (!tokenHash) {
      console.error("Failed to extract token_hash from action_link:", actionLink);
      return new Response(
        JSON.stringify({ error: "Failed to create session token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated token_hash for user:", userId, "isNew:", isNew);

    return new Response(
      JSON.stringify({
        token_hash: tokenHash,
        email,
        name,
        picture,
        is_new: isNew,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
