import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting admin seed process...");

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if any admin user already exists
    const { data: existingRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("role", "admin");

    if (rolesError) {
      console.error("Error checking existing roles:", rolesError);
      throw new Error(`Failed to check existing roles: ${rolesError.message}`);
    }

    if (existingRoles && existingRoles.length > 0) {
      console.log("Admin user already exists, skipping creation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin já existe no sistema",
          created: false 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create admin user
    console.log("Creating admin user: admin@admin.com");
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@admin.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: {
        name: "Administrador",
      },
    });

    if (authError) {
      console.error("Error creating admin user:", authError);
      throw new Error(`Failed to create admin user: ${authError.message}`);
    }

    console.log("Admin user created with ID:", authData.user?.id);

    // Create profile for admin
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user!.id,
        email: "admin@admin.com",
        name: "Administrador",
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Continue anyway, profile might be auto-created by trigger
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: authData.user!.id,
        role: "admin",
      });

    if (roleError) {
      console.error("Error assigning admin role:", roleError);
      throw new Error(`Failed to assign admin role: ${roleError.message}`);
    }

    console.log("Admin role assigned successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin criado com sucesso! Email: admin@admin.com, Senha: admin123",
        created: true,
        userId: authData.user?.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in seed-admin function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
