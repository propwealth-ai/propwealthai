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

    // Verify the inviter is the owner of the team (check user_roles table first, fallback to profiles)
    const { data: inviterRole } = await supabaseAdmin
      .from("user_roles")
      .select("role, team_id")
      .eq("user_id", invitedBy)
      .eq("team_id", teamId)
      .single();

    let isOwner = inviterRole?.role === "owner";

    // Fallback to profiles table for backwards compatibility
    if (!isOwner) {
      const { data: inviterProfile } = await supabaseAdmin
        .from("profiles")
        .select("team_id, team_role")
        .eq("id", invitedBy)
        .single();

      if (!inviterProfile || inviterProfile.team_id !== teamId || inviterProfile.team_role !== "owner") {
        return new Response(
          JSON.stringify({ error: "Only team owners can create members" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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

    // Wait for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get the auto-created team ID to delete later
    const { data: autoProfile } = await supabaseAdmin
      .from("profiles")
      .select("team_id")
      .eq("id", newUser.user.id)
      .single();

    const autoCreatedTeamId = autoProfile?.team_id;

    // Update the profile to join the investor's team with must_change_password flag
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        team_id: teamId,
        team_role: role || "member",
        full_name: fullName,
        must_change_password: true, // Force password change on first login
      })
      .eq("id", newUser.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    // Insert into user_roles table for proper RBAC
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: role || "member",
        team_id: teamId,
      });

    if (roleError) {
      console.error("Error inserting user role:", roleError);
    }

    // Delete the auto-created team if different from the target team
    if (autoCreatedTeamId && autoCreatedTeamId !== teamId) {
      // First delete any roles associated with the auto-created team
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("team_id", autoCreatedTeamId);

      // Then delete the team
      await supabaseAdmin
        .from("teams")
        .delete()
        .eq("id", autoCreatedTeamId);
    }

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
