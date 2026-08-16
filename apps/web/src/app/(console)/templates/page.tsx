import Link from "next/link";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { TemplateSchema, type Template, type Variant } from "@poplab/template-spec";
import { TemplateThumb } from "./template-thumb";

/** W-07 Template library. */
export default async function TemplatesPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("templates")
    .select("id, name, category, status, shot_count, spec, updated_at")
    .eq("tenant_id", staff.tenantId)
    .order("updated_at", { ascending: false });

  const templates = (rows ?? []).map((r) => {
    const parsed = TemplateSchema.safeParse(r.spec);
    return { row: r, spec: parsed.success ? parsed.data : null };
  });

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Templates</p>
          <h1 className="font-display text-4xl uppercase mt-1">Template library</h1>
        </div>
        <span className="text-[13px] text-[#7a736a]">{templates.length} templates</span>
      </div>

      {templates.length === 0 ? (
        <p className="text-[#7a736a]">No templates yet.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-5">
          {templates.map(({ row, spec }) => {
            const defaultVariant: Variant | undefined =
              spec?.variants.find((v) => v.isDefault) ?? spec?.variants[0];
            const dark = (defaultVariant?.label ?? "").toLowerCase().includes("black");
            return (
              <Link
                key={row.id}
                href={`/templates/${row.id}`}
                className="group bg-white border border-[#14140f] p-3 flex flex-col gap-3 hover:shadow-[4px_4px_0_#14140f] transition-shadow"
              >
                <div className="flex justify-center bg-[#f4f2ec] py-2">
                  {spec ? (
                    <TemplateThumb spec={spec as Template} overlay={defaultVariant?.overlay ?? null} dark={dark} width={150} />
                  ) : (
                    <div className="w-[150px] aspect-[2/3] grid place-items-center text-[11px] text-[#a33418]">invalid spec</div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold">{row.name}</p>
                    <StatusPill status={row.status} />
                  </div>
                  <p className="text-[12px] text-[#7a736a] mt-0.5">
                    {row.shot_count} shots · {spec?.variants.length ?? 0} colours · {row.category}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "bg-[#e4f0e8] text-[#2e7d52]",
    draft: "bg-[#e8e8e5] text-[#7a736a]",
    archived: "bg-[#f7e6e0] text-[#a33418]",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}
