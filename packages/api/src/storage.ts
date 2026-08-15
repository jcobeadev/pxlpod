import type { PoplabClient } from "./client.ts";

/**
 * Public URL for artwork in the `overlays` bucket (template PNGs). The bucket
 * is public and unauthenticated, so this is a pure string transform — no
 * network round trip.
 */
export function overlayUrl(client: PoplabClient, path: string): string {
  const { data } = client.storage.from("overlays").getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Short-lived signed URL for a guest render in the private `renders` bucket.
 * There is no public/anon read policy on this bucket at all — a signed URL is
 * the only way to reach a render short of holding a booth staff session.
 */
export async function signedRenderUrl(
  client: PoplabClient,
  path: string,
  seconds: number,
): Promise<string> {
  const { data, error } = await client.storage
    .from("renders")
    .createSignedUrl(path, seconds);
  if (error) {
    throw error;
  }
  if (!data) {
    throw new Error(`No signed URL returned for renders/${path}`);
  }
  return data.signedUrl;
}
