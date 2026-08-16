import { File } from "expo-file-system";

/**
 * Read a local file as an ArrayBuffer for a Supabase Storage upload.
 *
 * React Native's fetch (which supabase-js hands the body to) rejects a bare
 * Uint8Array with "Unsupported BodyInit type" — the exact error guests hit when
 * creating a share link or a print pass. An ArrayBuffer is a supported BodyInit,
 * and it's the same API the on-device library already uses to copy strips.
 */
export async function readFileForUpload(localUri: string): Promise<ArrayBuffer> {
  return await new File(localUri).arrayBuffer();
}
