import type { PoplabClient } from "./client.ts";

/**
 * Guarantees the client holds an identity before any RLS-scoped write —
 * print pass issuance and share-link creation both key off `auth.uid()`.
 *
 * The mobile app never shows a sign-in screen, so this is the only source of
 * identity a guest ever gets. Safe to call on every launch: if a session
 * (anonymous or not) already exists it is left untouched and its user id is
 * returned; otherwise `signInAnonymously()` mints one and persists it via
 * whichever storage adapter the client was created with.
 */
export async function ensureAnonymousSession(
  client: PoplabClient,
): Promise<string> {
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();
  if (sessionError) {
    throw sessionError;
  }
  if (sessionData.session) {
    return sessionData.session.user.id;
  }

  const { data, error } = await client.auth.signInAnonymously();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error("signInAnonymously returned no user");
  }
  return data.user.id;
}
