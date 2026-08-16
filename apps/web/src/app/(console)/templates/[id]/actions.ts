"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { TemplateSchema, shotCount } from "@poplab/template-spec";

/**
 * Persist a template's spec. The spec is re-validated against the shared schema
 * server-side — the console never trusts a client-shaped document — and the
 * denormalised columns (shot_count, status, name) are derived from it so they
 * cannot drift.
 */
export async function saveTemplate(input: {
  id: string;
  name: string;
  status: "draft" | "published" | "archived";
  spec: unknown;
}) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const parsed = TemplateSchema.safeParse(input.spec);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid template" };
  }
  // The spec's tenant must be this operator's — belt to the RLS braces.
  if (parsed.data.tenantId !== staff.tenantId) {
    return { ok: false as const, error: "Template belongs to another tenant" };
  }

  const spec = { ...parsed.data, name: input.name };

  const { error } = await supabase
    .from("templates")
    .update({
      name: input.name,
      status: input.status,
      shot_count: shotCount(spec),
      spec,
      published_at: input.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .eq("tenant_id", staff.tenantId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/templates");
  revalidatePath(`/templates/${input.id}`);
  return { ok: true as const };
}
