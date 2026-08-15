import * as SQLite from "expo-sqlite";

/**
 * Persistent storage for the guest's Supabase session, backed by expo-sqlite.
 *
 * Why not AsyncStorage or SecureStore, which is what every Supabase example
 * uses? Both ship native code, and adding either would need a new development
 * build before the app could run again. expo-sqlite is already linked into the
 * build on the device, so this costs nothing to adopt.
 *
 * Why persist at all? The app never asks anyone to sign in, but it does call
 * `signInAnonymously`, and `print_jobs` and `share_links` are scoped by RLS to
 * `created_by = auth.uid()`. Without persistence every cold start mints a new
 * anonymous user, and a guest who closes the app loses access to the print pass
 * they just paid for — the row is still there, they simply are not the person
 * who created it any more.
 *
 * SecureStore would be the better home if we ever store something that matters
 * if extracted. An anonymous session token grants access only to rows that
 * session itself created, so sqlite is proportionate.
 */

const DB_NAME = "poplab.db";
const TABLE = "auth_kv";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const database = await SQLite.openDatabaseAsync(DB_NAME);
    await database.execAsync(
      `CREATE TABLE IF NOT EXISTS ${TABLE} (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
    );
    return database;
  })();
  return dbPromise;
}

/**
 * Matches the storage contract supabase-js expects. Every method swallows its
 * errors and degrades to the in-memory behaviour we had before: a failure to
 * persist a session should cost the guest a re-authentication, never a crash on
 * launch.
 */
export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const row = await (await db()).getFirstAsync<{ value: string }>(
        `SELECT value FROM ${TABLE} WHERE key = ?`,
        [key],
      );
      return row?.value ?? null;
    } catch (error) {
      console.warn("[authStorage] getItem failed:", error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await (await db()).runAsync(
        `INSERT OR REPLACE INTO ${TABLE} (key, value) VALUES (?, ?)`,
        [key, value],
      );
    } catch (error) {
      console.warn("[authStorage] setItem failed:", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await (await db()).runAsync(`DELETE FROM ${TABLE} WHERE key = ?`, [key]);
    } catch (error) {
      console.warn("[authStorage] removeItem failed:", error);
    }
  },
};
