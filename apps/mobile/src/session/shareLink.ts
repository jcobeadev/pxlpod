import { File } from "expo-file-system";
import type { PoplabClient } from "@poplab/api";

/**
 * Create a public share link for a finished strip, with no server round-trip.
 *
 * The guest uploads the strip to the public `shares` bucket under their own auth
 * uid (the storage write policy scopes the path to them), then inserts a
 * share_links row for themselves. The public web page at WEB_URL/s/<slug> reads
 * it. This is the one route that DOES upload the photo, so the caller must have
 * taken the guest's consent first.
 */
const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL ?? "https://poplab.app";
const EXPIRY_DAYS = 30;

export interface ShareLinkResult {
  slug: string;
  url: string;
}

export async function createShareLink(client: PoplabClient, localUri: string, tenantId: string): Promise<ShareLinkResult> {
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in.");
  const uid = userData.user.id;

  const slug = randomSlug();
  const path = `${uid}/${slug}.jpg`;

  const bytes = new File(localUri).bytes();
  const { error: upErr } = await client.storage.from("shares").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 3600 * 1000).toISOString();
  const { error: insErr } = await client.from("share_links").insert({
    tenant_id: tenantId,
    slug,
    render_path: path,
    created_by: uid,
    expires_at: expiresAt,
  });
  if (insErr) throw new Error(insErr.message);

  return { slug, url: `${WEB_URL}/s/${slug}` };
}

function randomSlug(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}
