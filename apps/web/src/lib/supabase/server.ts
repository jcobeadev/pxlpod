import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@poplab/api";

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 *
 * Reads the operator's session from cookies, so every query runs as that staff
 * member and row-level security scopes it to their tenant. There is no service
 * role here — the console never bypasses RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where setting cookies is a no-op;
            // the middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
