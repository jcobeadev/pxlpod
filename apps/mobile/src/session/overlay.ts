import type { PoplabClient } from "@poplab/api";
import type { Variant } from "@poplab/template-spec/schema";

/**
 * Public URL for a variant's overlay artwork in the `overlays` bucket.
 *
 * The compositor and the effect/assemble previews all need the same resolved
 * URL, so it lives here rather than being re-derived per screen. The bucket is
 * public-read, so a plain public URL is correct — no signing.
 */
export function overlayUriFor(client: PoplabClient, variant: Variant): string {
  return client.storage.from("overlays").getPublicUrl(variant.overlay).data.publicUrl;
}
