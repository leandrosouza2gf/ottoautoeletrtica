import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export interface AuthResult {
  user: { id: string; email: string } | null;
  error: string | null;
  role: "admin" | "user" | null;
}

/**
 * Autentica uma requisição usando o token JWT do header Authorization.
 * Valida o token e busca a role do usuário na tabela user_roles.
 * 
 * Uso:
 * ```typescript
 * const auth = await authenticateRequest(req);
 * if (auth.error || !auth.user) {
 *   return new Response(JSON.stringify({ error: auth.error }), { status: 401 });
 * }
 * // auth.user.id é a identidade confiável
 * // auth.role é "admin" ou "user"
 * ```
 */
export async function authenticateRequest(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Token não fornecido", role: null };
  }

  const token = authHeader.replace("Bearer ", "");
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Validar JWT e obter claims
  const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
  
  if (claimsError || !claims?.claims) {
    console.error("Erro ao validar JWT:", claimsError?.message);
    return { user: null, error: "Token inválido ou expirado", role: null };
  }

  const userId = claims.claims.sub as string;
  const email = claims.claims.email as string;

  if (!userId) {
    return { user: null, error: "Token inválido: user_id ausente", role: null };
  }

  // Buscar role do usuário usando service role key (bypassa RLS)
  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (roleError) {
    console.error("Erro ao buscar role:", roleError.message);
  }

  const role = (roleData?.role as "admin" | "user") || "user";

  console.log(`Usuário autenticado: ${userId} (${role})`);

  return {
    user: { id: userId, email: email || "" },
    error: null,
    role,
  };
}

/**
 * Verifica se o usuário tem a role necessária.
 * Retorna uma Response de erro se não tiver permissão.
 */
export function requireRole(
  auth: AuthResult, 
  requiredRole: "admin" | "user"
): Response | null {
  if (auth.error || !auth.user) {
    return new Response(
      JSON.stringify({ error: auth.error || "Não autorizado" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (requiredRole === "admin" && auth.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Acesso negado. Requer perfil de administrador." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return null; // Autorizado
}
