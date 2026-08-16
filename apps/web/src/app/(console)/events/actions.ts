"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "event"
  );
}

/**
 * Create or update an event. Runs as the operator's session, so RLS guarantees
 * the row belongs to their tenant — tenant_id comes from requireStaff(), never
 * the form. Errors are surfaced (thrown) rather than swallowed: an insert that
 * silently failed is exactly why "add event" looked like it did nothing.
 */
export interface SaveEventState {
  error?: string;
}

/**
 * useActionState-shaped: returns `{ error }` on failure so the form can show it
 * inline, and redirects on success. Errors are never swallowed — a silently
 * failed insert (a constraint like end-before-start, or a slug clash on retry)
 * is exactly what made "add event" look like it did nothing.
 */
export async function saveEvent(_prev: SaveEventState, formData: FormData): Promise<SaveEventState> {
  const staff = await requireStaff();
  const supabase = await createClient();

  const id = (formData.get("id") as string) || null;
  const title = ((formData.get("title") as string) || "").trim();
  const startsAt = formData.get("starts_at") as string;
  const endsAt = formData.get("ends_at") as string;

  if (!title) return { error: "Title is required." };
  if (!startsAt || !endsAt) return { error: "Start and end times are required." };

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (!(end.getTime() > start.getTime())) {
    return { error: "End time must be after the start time." };
  }

  const printPricePesos = Number(formData.get("print_price") ?? 0);

  const base = {
    title,
    description: (formData.get("description") as string) ?? "",
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    venue_name: (formData.get("venue_name") as string) || null,
    city: (formData.get("city") as string) || null,
    is_published: formData.get("is_published") === "on",
    printing_enabled: formData.get("printing_enabled") === "on",
    print_price_cents: Math.round((Number.isFinite(printPricePesos) ? printPricePesos : 0) * 100),
  };

  if (id) {
    const { error } = await supabase.from("events").update(base).eq("id", id).eq("tenant_id", staff.tenantId);
    if (error) return { error: `Couldn't save event: ${error.message}` };
  } else {
    // Slug is unique per tenant; a duplicate title would clash, so make it unique.
    const slug = `${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
    const { error } = await supabase.from("events").insert({ ...base, tenant_id: staff.tenantId, slug });
    if (error) return { error: `Couldn't create event: ${error.message}` };
  }

  revalidatePath("/events");
  revalidatePath("/");
  redirect("/events");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(`Couldn't delete event: ${error.message}`);
  revalidatePath("/events");
  redirect("/events");
}
