import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
  teamId: string;
  invitedBy: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, fullName, role, teamId, invitedBy }: CreateMemberRequest = await req.json();

    // Validate required fields
    if (!email || !password || !teamId || !invitedBy) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the inviter is the owner of the team
    const { data: inviterProfile, error: inviterError } = await supabaseAdmin
      .from("profiles")
      .select("team_id, team_role")
      .eq("id", invitedBy)
      .single();

    if (inviterError || !inviterProfile) {
      return new Response(
        JSON.stringify({ error: "Inviter not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inviterProfile.team_id !== teamId || inviterProfile.team_role !== "owner") {
      return new Response(
        JSON.stringify({ error: "Only team owners can create members" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: "Email already registered" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the profile with team info (the profile is created by trigger)
    // Wait a bit for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update the newly created profile to join the investor's team
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        team_id: teamId,
        team_role: role || "member",
        full_name: fullName,
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      // Don't fail, the user is created, just log the error
    }

    // Delete the auto-created team for this user (since they're joining an existing team)
    const { data: userProfile } = await supabaseAdmin
      .from("profiles")
      .select("team_id")
      .eq("id", newUser.user.id)
      .single();

    // The trigger created a new team, but we want this user to join the investor's team
    // So we need to delete the auto-created team
    if (userProfile?.team_id && userProfile.team_id !== teamId) {
      await supabaseAdmin
        .from("teams")
        .delete()
        .eq("id", userProfile.team_id);
    }

    // Update profile again to ensure correct team
    await supabaseAdmin
      .from("profiles")
      .update({
        team_id: teamId,
        team_role: role || "member",
      })
      .eq("id", newUser.user.id);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user.id,
          email: newUser.user.email,
          fullName,
        },
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error in create-team-member:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
