import Link from "next/link";
import { requireStaff } from "../../lib/auth";
import { createClient } from "../../lib/supabase/server";

/** W-04 Dashboard — the numbers an operator opens the console to see. */
export default async function Dashboard() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const [{ count: templateCount }, { count: publishedCount }, { data: events }, { data: liveEvents }] =
    await Promise.all([
      supabase.from("templates").select("*", { count: "exact", head: true }).eq("tenant_id", staff.tenantId),
      supabase
        .from("templates")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", staff.tenantId)
        .eq("status", "published"),
      supabase
        .from("events")
        .select("id, title, starts_at, ends_at, city, is_published")
        .eq("tenant_id", staff.tenantId)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(5),
      supabase.rpc("live_events", { target_tenant: staff.tenantId }),
    ]);

  const live = liveEvents?.[0] ?? null;

  return (
    <div className="p-8 max-w-4xl">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Dashboard</p>
      <h1 className="font-display text-4xl uppercase mt-1 mb-6">{staff.tenantName}</h1>

      {live ? (
        <div className="bg-[#ffb81f] px-5 py-4 mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest">Live now</p>
          <p className="font-display text-xl uppercase">{live.title}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 mb-8">
        <Stat label="Templates" value={templateCount ?? 0} />
        <Stat label="Published" value={publishedCount ?? 0} />
        <Stat label="Upcoming events" value={events?.length ?? 0} />
      </div>

      <section className="bg-white border border-[#14140f]">
        <header className="flex items-center justify-between px-5 py-3 border-b border-[#d8d4ca]">
          <h2 className="font-bold uppercase text-sm tracking-wide">Upcoming events</h2>
          <Link href="/events" className="text-[12px] font-bold uppercase tracking-wide text-[#8a570d]">
            Manage →
          </Link>
        </header>
        {events && events.length > 0 ? (
          <ul>
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-5 py-3 border-b border-[#e3e0d7] last:border-0">
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-[13px] text-[#7a736a]">
                    {new Date(e.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {e.city ? ` · ${e.city}` : ""}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${
                    e.is_published ? "bg-[#e4f0e8] text-[#2e7d52]" : "bg-[#e8e8e5] text-[#7a736a]"
                  }`}
                >
                  {e.is_published ? "Published" : "Draft"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-[#7a736a]">No upcoming events.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-[#14140f] p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">{label}</p>
      <p className="font-display text-3xl mt-1">{value}</p>
    </div>
  );
}
