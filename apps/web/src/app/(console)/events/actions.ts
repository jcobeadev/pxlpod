"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "event";
}

/**
 * Create or update an event. Runs as the operator's session, so RLS guarantees
 * the row belongs to their tenant — the tenant_id is taken from requireStaff(),
 * never from the form.
 */
export async function saveEvent(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const id = (formData.get("id") as string) || null;
  const title = (formData.get("title") as string).trim();
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;

  const printPricePesos = Number(formData.get("print_price") ?? 0);

  const payload = {
    tenant_id: staff.tenantId,
    title,
    slug: slugify(title),
    description: (formData.get("description") as string) ?? "",
    starts_at: new Date(startsAt).toISOString(),
    ends_at: new Date(endsAt).toISOString(),
    venue_name: (formData.get("venue_name") as string) || null,
    city: (formData.get("city") as string) || null,
    is_published: formData.get("is_published") === "on",
    printing_enabled: formData.get("printing_enabled") === "on",
    print_price_cents: Math.round(printPricePesos * 100),
  };

  if (id) {
    await supabase.from("events").update(payload).eq("id", id);
  } else {
    await supabase.from("events").insert(payload);
  }

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/events");
  redirect("/events");
}
