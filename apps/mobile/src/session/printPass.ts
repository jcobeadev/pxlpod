import { File } from "expo-file-system";
import type { PoplabClient, PrintJobRow } from "@poplab/api";

/**
 * Issue a print pass for a finished strip at a live pop-up.
 *
 * Uploads the print-res strip to the shares bucket (path scoped to the guest's
 * auth uid), then calls issue_print_job — a SECURITY DEFINER RPC that validates
 * the event is live, prices the pass from the event, mints the code and
 * attributes it to auth.uid(). Like share links this uploads the photo, so the
 * caller takes consent first.
 */
export async function createPrintPass(
  client: PoplabClient,
  localUri: string,
  eventId: string,
  templateId: string | null,
  variantLabel: string | null,
): Promise<PrintJobRow> {
  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) throw new Error("Not signed in.");
  const uid = userData.user.id;

  const path = `${uid}/print-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const bytes = new File(localUri).bytes();
  const { error: upErr } = await client.storage.from("shares").upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await client.rpc("issue_print_job", {
    p_event_id: eventId,
    // The RPC's SQL params are nullable, but the generated types mark them
    // non-null; null is valid at runtime (no template / no variant).
    p_template_id: templateId as string,
    p_variant: variantLabel as string,
    p_render_path: path,
  });
  if (error) throw new Error(error.message);
  return data as unknown as PrintJobRow;
}
