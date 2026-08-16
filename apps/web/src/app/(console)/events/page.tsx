import Link from "next/link";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

/** W-16 Events table. */
export default async function EventsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, ends_at, venue_name, city, is_published, printing_enabled, print_price_cents")
    .eq("tenant_id", staff.tenantId)
    .order("starts_at", { ascending: false });

  const now = Date.now();

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Events</p>
          <h1 className="font-display text-4xl uppercase mt-1">Pop-ups</h1>
        </div>
        <Link href="/events/new" className="bg-[#14140f] text-white font-bold uppercase tracking-wide text-[13px] px-4 py-2.5">
          + New event
        </Link>
      </div>

      <div className="bg-white border border-[#14140f]">
        {(events ?? []).length === 0 ? (
          <p className="px-5 py-10 text-center text-[#7a736a]">No events yet. Create your first pop-up.</p>
        ) : (
          <ul>
            {(events ?? []).map((e) => {
              const start = new Date(e.starts_at);
              const isLive = now >= new Date(e.starts_at).getTime() && now <= new Date(e.ends_at).getTime();
              return (
                <li key={e.id} className="border-b border-[#e3e0d7] last:border-0">
                  <Link href={`/events/${e.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-[#faf9f5]">
                    <div className="w-12 text-center">
                      <div className="font-display text-2xl leading-none">{start.getDate()}</div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-[#7a736a]">
                        {start.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{e.title}</p>
                      <p className="text-[13px] text-[#7a736a]">
                        {[e.venue_name, e.city].filter(Boolean).join(" · ") || "No venue set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLive ? <Pill className="bg-[#ffb81f] text-[#14140f]">Live</Pill> : null}
                      {e.printing_enabled ? <Pill className="bg-[#14140f] text-white">Prints ₱{(e.print_price_cents / 100).toFixed(0)}</Pill> : null}
                      <Pill className={e.is_published ? "bg-[#e4f0e8] text-[#2e7d52]" : "bg-[#e8e8e5] text-[#7a736a]"}>
                        {e.is_published ? "Published" : "Draft"}
                      </Pill>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${className}`}>{children}</span>;
}
