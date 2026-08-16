import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { StatusSelect } from "./status-select";
import type { InquiryStatus } from "./actions";

/** W-19 Inquiries pipeline. Booking requests from the app, staff-only. */
export default async function InquiriesPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .eq("tenant_id", staff.tenantId)
    .order("created_at", { ascending: false });

  const rows = inquiries ?? [];
  const open = rows.filter((r) => !["completed", "lost"].includes(r.status)).length;

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Inquiries</p>
          <h1 className="font-display text-4xl uppercase mt-1">Bookings</h1>
        </div>
        <span className="text-[13px] text-[#7a736a]">{open} open · {rows.length} total</span>
      </div>

      {rows.length === 0 ? (
        <p className="text-[#7a736a]">No booking inquiries yet. They arrive here when someone submits the app&apos;s &ldquo;Book us&rdquo; form.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((q) => (
            <div key={q.id} className="bg-white border border-[#14140f] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[17px]">{q.name}</p>
                    <span className="text-[11px] text-[#7a736a] font-mono">#{q.reference}</span>
                  </div>
                  <p className="text-[13px] text-[#7a736a]">
                    {[q.event_type, q.location, q.guest_count ? `${q.guest_count} guests` : null, q.hours ? `${q.hours}h` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StatusSelect id={q.id} status={q.status as InquiryStatus} />
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[13px]">
                {q.email ? <a href={`mailto:${q.email}`} className="text-[#8a570d] underline">{q.email}</a> : null}
                {q.phone ? <a href={`tel:${q.phone}`} className="text-[#8a570d] underline">{q.phone}</a> : null}
                {q.preferred_date ? (
                  <span className="text-[#7a736a]">
                    Prefers {new Date(q.preferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                ) : null}
                <span className="text-[#7a736a]">
                  Received {new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>

              {q.notes ? <p className="mt-3 text-[14px] bg-[#faf9f5] border border-[#e3e0d7] px-3 py-2">{q.notes}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
