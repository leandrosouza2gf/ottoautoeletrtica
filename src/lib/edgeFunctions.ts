import { supabase } from "@/integrations/supabase/client";

/**
 * Invoca uma Edge Function autenticada, incluindo automaticamente
 * o token JWT do usuário logado no header Authorization.
 * 
 * Uso:
 * ```typescript
 * const { data, error } = await invokeAuthenticatedFunction<MyResponseType>(
 *   "minha-funcao",
 *   { param1: "valor" }
 * );
 * ```
 */
export async function invokeAuthenticatedFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Erro ao obter sessão:", sessionError.message);
      return { data: null, error: new Error("Erro ao verificar autenticação") };
    }

    if (!session?.access_token) {
      return { data: null, error: new Error("Usuário não autenticado") };
    }

    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error(`Erro na função ${functionName}:`, error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erro desconhecido");
    console.error(`Erro ao invocar ${functionName}:`, error.message);
    return { data: null, error };
  }
}

/**
 * Invoca uma Edge Function pública (sem autenticação).
 * 
 * Uso:
 * ```typescript
 * const { data, error } = await invokePublicFunction<MyResponseType>(
 *   "consultar-os-publica",
 *   { numero_os: 123 }
 * );
 * ```
 */
export async function invokePublicFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body,
    });

    if (error) {
      console.error(`Erro na função ${functionName}:`, error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err : new Error("Erro desconhecido");
    console.error(`Erro ao invocar ${functionName}:`, error.message);
    return { data: null, error };
  }
}
