import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp } = await req.json();

    if (!email || otp !== "111111") {
      return new Response(
        JSON.stringify({ error: "Invalid bypass code" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists by email (listUsers has pagination issues)
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ filter: `email.eq.${email}` });
    const existingUser = users?.[0];

    if (existingUser) {
      // Generate a magic link token for existing user
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Return the token properties for client-side verification
      return new Response(
        JSON.stringify({
          token_hash: data.properties?.hashed_token,
          user_id: existingUser.id,
          is_new: false,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Create new user with auto-confirm
      const randomPass = crypto.randomUUID() + "!Aa1";
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomPass,
        email_confirm: true,
      });
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Generate a link so client can get a session
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      return new Response(
        JSON.stringify({
          token_hash: linkData?.properties?.hashed_token,
          user_id: data.user?.id,
          is_new: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
