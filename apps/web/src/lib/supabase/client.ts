import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@poplab/api";

/** Supabase client for Client Components (sign-in form, interactive editors). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
