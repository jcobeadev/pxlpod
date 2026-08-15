import {
  createClient,
  type SupabaseClient,
  type SupportedStorage,
} from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

export interface CreatePoplabClientOptions {
  /** Supabase project URL. Read from EXPO_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL by the caller. */
  url: string;
  /** Supabase publishable (anon) key. Never the service role key. */
  anonKey: string;
  /**
   * Session storage adapter. Mobile passes AsyncStorage/SecureStore so a
   * guest's anonymous session survives an app relaunch; web omits this and
   * falls back to the Supabase default (localStorage in a browser).
   */
  storage?: SupportedStorage;
}

export type PoplabClient = SupabaseClient<Database>;

/**
 * Creates the one typed Supabase client both the mobile app and the web
 * console build all reads and writes on top of.
 *
 * `detectSessionInUrl` is disabled whenever a custom `storage` is supplied —
 * that only happens on native, where there is no browser URL to inspect for
 * an OAuth/magic-link fragment.
 */
export function createPoplabClient({
  url,
  anonKey,
  storage,
}: CreatePoplabClientOptions): PoplabClient {
  return createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: storage === undefined,
      ...(storage ? { storage } : {}),
    },
  });
}
