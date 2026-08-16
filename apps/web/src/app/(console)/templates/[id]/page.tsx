import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { TemplateSchema } from "@poplab/template-spec";
import { TemplateEditor } from "./editor";

export default async function TemplateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("templates")
    .select("id, name, status, spec")
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!row) notFound();

  const parsed = TemplateSchema.safeParse(row.spec);

  return (
    <div className="p-8">
      <Link href="/templates" className="text-[12px] font-bold uppercase tracking-wide text-[#7a736a]">← Templates</Link>
      <h1 className="font-display text-4xl uppercase mt-2 mb-6">{row.name}</h1>
      {parsed.success ? (
        <TemplateEditor
          templateId={row.id}
          initialSpec={parsed.data}
          initialName={row.name}
          initialStatus={row.status as "draft" | "published" | "archived"}
        />
      ) : (
        <p className="text-[#a33418]">This template&apos;s spec is invalid and can&apos;t be edited: {parsed.error.issues[0]?.message}</p>
      )}
    </div>
  );
}
