"use client";

import { useActionState } from "react";
import { redeemPass, type RedeemState } from "./actions";

/** W-14 Print station — enter a guest's code, record cash, redeem. */
export function RedeemForm() {
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemPass, {});
  return (
    <form action={action} className="bg-[#14140f] text-white p-6 flex flex-col gap-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#ffb81f]">Print station</p>
      <div className="flex gap-3 items-end flex-wrap">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Pass code</span>
          <input
            name="code"
            autoFocus
            autoComplete="off"
            className="bg-white text-[#14140f] font-display text-2xl tracking-[0.3em] uppercase px-4 py-2 w-56 outline-none"
            placeholder="ABC123"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Cash taken ₱</span>
          <input name="cash" type="number" min={0} step={5} className="bg-white text-[#14140f] px-3 py-2.5 w-28 outline-none" />
        </label>
        <button type="submit" disabled={pending} className="bg-[#ffb81f] text-[#14140f] font-bold uppercase tracking-wide px-6 py-3 disabled:opacity-50">
          {pending ? "…" : "Redeem"}
        </button>
      </div>
      {state.message ? (
        <p className={`text-[14px] font-semibold px-3 py-2 ${state.ok ? "bg-[#e4f0e8] text-[#2e7d52]" : "bg-[#f7e6e0] text-[#a33418]"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
