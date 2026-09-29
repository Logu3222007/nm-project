import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Verifies the caller's JWT and returns a Supabase client scoped to that
 * user (so all queries still go through RLS) plus the authenticated user id.
 * Throws if the Authorization header is missing or the token is invalid —
 * identity is NEVER taken from a client-supplied field.
 */
export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("UNAUTHENTICATED");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const client: SupabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("UNAUTHENTICATED");

  return { client, userId: data.user.id };
}

/** Admin client using the service role — only for privileged writes
 * (generations, exports, audit logs) after ownership has been verified. */
export function serviceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(supabaseUrl, serviceKey);
}
