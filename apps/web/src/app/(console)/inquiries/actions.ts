"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

export type InquiryStatus = "new" | "contacted" | "quoted" | "booked" | "completed" | "lost";

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  const staff = await requireStaff();
  const supabase = await createClient();
  await supabase.from("inquiries").update({ status }).eq("id", id).eq("tenant_id", staff.tenantId);
  revalidatePath("/inquiries");
}
