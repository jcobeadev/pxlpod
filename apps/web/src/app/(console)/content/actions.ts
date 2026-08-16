"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

/** Upsert one app_content block (e.g. About) that the mobile app reads. */
export async function saveContent(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const key = formData.get("key") as string;
  const body = (formData.get("body") as string) ?? "";
  await supabase
    .from("app_content")
    .upsert({ tenant_id: staff.tenantId, key, value: { body }, updated_at: new Date().toISOString() });
  revalidatePath("/content");
}
