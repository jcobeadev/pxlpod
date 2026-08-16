"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { TemplateSchema, shotCount, type Template } from "@poplab/template-spec";

export interface NewTemplateInput {
  name: string;
  category: string;
  overlayPath: string; // already uploaded to the overlays bucket
  canvas: { width: number; height: number };
  slots: {
    id: string;
    photoIndex: number;
    x: number;
    y: number;
    w: number;
    h: number;
    shape: "rect" | "circle";
  }[];
}

/**
 * Create a template from freshly uploaded artwork. The client has uploaded the
 * overlay and run slot detection; here we assemble the full spec (adding the
 * tenant, a default variant and per-slot defaults), validate it against the
 * shared schema, and insert it as a draft.
 */
export async function createTemplate(input: NewTemplateInput) {
  const staff = await requireStaff();
  const supabase = await createClient();

  const spec: Template = {
    version: 1,
    tenantId: staff.tenantId,
    name: input.name,
    description: "",
    category: input.category,
    canvas: { width: input.canvas.width, height: input.canvas.height, dpi: 300, background: "#FFFFFF" },
    slots: input.slots.map((s) => ({
      id: s.id,
      photoIndex: s.photoIndex,
      x: s.x,
      y: s.y,
      w: s.w,
      h: s.h,
      shape: s.shape,
      cornerRadius: 0,
      rotation: 0,
      fit: "cover",
      mirror: false,
    })),
    layers: [],
    variants: [
      {
        id: "default",
        label: "Original",
        overlay: input.overlayPath,
        textColor: "#14140F",
        isDefault: true,
      },
    ],
    capture: { defaultTimer: 3, allowRetakePerShot: true, allowedFilters: [] },
    gif: { enabled: true, width: 600, fps: 4, boomerang: true },
    printable: true,
  };

  const parsed = TemplateSchema.safeParse(spec);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid template" };
  }

  const { data, error } = await supabase
    .from("templates")
    .insert({
      tenant_id: staff.tenantId,
      name: input.name,
      category: input.category.trim().toLowerCase(),
      spec: parsed.data,
      shot_count: shotCount(parsed.data),
      printable: true,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };
  redirect(`/templates/${data.id}`);
}
