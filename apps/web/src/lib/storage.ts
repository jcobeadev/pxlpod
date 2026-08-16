const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Public URL for an object in a public Storage bucket. */
export function publicUrl(bucket: string, path: string): string {
  return `${BASE}/storage/v1/object/public/${bucket}/${path}`;
}

export function overlayUrl(path: string): string {
  return publicUrl("overlays", path);
}
