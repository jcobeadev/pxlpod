import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { publicUrl } from "../../../lib/storage";
import { RedeemForm } from "./redeem-form";

/** W-12 Print queue + W-14 Print station. */
export default async function PrintPage() {
  const staff = await requireStaff();
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from("print_jobs")
    .select("id, code, status, price_cents, cash_cents, issued_at, expires_at, redeemed_at, render_path, events(title)")
    .eq("tenant_id", staff.tenantId)
    .order("issued_at", { ascending: false })
    .limit(50);

  const rows = jobs ?? [];
  const issued = rows.filter((r) => r.status === "issued").length;
  const redeemed = rows.filter((r) => r.status === "redeemed");
  const revenue = redeemed.reduce((sum, r) => sum + (r.cash_cents ?? 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Printing</p>
          <h1 className="font-display text-4xl uppercase mt-1">Print station</h1>
        </div>
        <div className="text-right text-[13px] text-[#7a736a]">
          <div>{issued} waiting · {redeemed.length} printed</div>
          <div className="font-bold text-[#14140f]">₱{(revenue / 100).toFixed(0)} taken</div>
        </div>
      </div>

      <div className="mb-8">
        <RedeemForm />
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-bold uppercase text-sm tracking-wide">Passes</h2>
        <span className="text-[12px] text-[#7a736a]">Click a strip to open it full size, then print (⌘P) to your DNP RX1HS.</span>
      </div>
      <div className="bg-white border border-[#14140f]">
        {rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-[#7a736a]">No print passes yet. They appear when a guest taps &ldquo;Print at this pop-up&rdquo;.</p>
        ) : (
          <ul>
            {rows.map((j) => {
              const live = j.status === "issued" && new Date(j.expires_at).getTime() > Date.now();
              const event = (j.events as unknown as { title: string } | null)?.title;
              return (
                <li key={j.id} className="flex items-center gap-4 px-5 py-3 border-b border-[#e3e0d7] last:border-0">
                  {j.render_path ? (
                    <a href={publicUrl("shares", j.render_path)} target="_blank" rel="noopener noreferrer" title="Open full size to print">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={publicUrl("shares", j.render_path)} alt="" className="w-10 h-14 object-cover bg-[#e8e8e5] border border-[#d8d4ca] hover:border-[#14140f]" />
                    </a>
                  ) : (
                    <div className="w-10 h-14 bg-[#e8e8e5]" />
                  )}
                  <div className="font-display text-xl tracking-[0.15em] w-28">{j.code}</div>
                  <div className="flex-1 text-[13px] text-[#7a736a]">
                    {event ?? "—"} · ₱{(j.price_cents / 100).toFixed(0)}
                    {j.redeemed_at ? ` · printed ${new Date(j.redeemed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </div>
                  <StatusPill status={live ? "issued" : j.status === "issued" ? "expired" : j.status} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: "bg-[#ffb81f] text-[#14140f]",
    redeemed: "bg-[#e4f0e8] text-[#2e7d52]",
    expired: "bg-[#e8e8e5] text-[#7a736a]",
    deleted: "bg-[#f7e6e0] text-[#a33418]",
  };
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${map[status] ?? map.expired}`}>{status}</span>;
}
