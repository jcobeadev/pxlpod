"use client";

import { useTransition } from "react";
import { setInquiryStatus, type InquiryStatus } from "./actions";

const STATUSES: InquiryStatus[] = ["new", "contacted", "quoted", "booked", "completed", "lost"];

const COLOR: Record<InquiryStatus, string> = {
  new: "bg-[#ffb81f] text-[#14140f]",
  contacted: "bg-[#e8e8e5] text-[#14140f]",
  quoted: "bg-[#e8e8e5] text-[#14140f]",
  booked: "bg-[#e4f0e8] text-[#2e7d52]",
  completed: "bg-[#14140f] text-white",
  lost: "bg-[#f7e6e0] text-[#a33418]",
};

export function StatusSelect({ id, status }: { id: string; status: InquiryStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) => start(() => void setInquiryStatus(id, e.target.value as InquiryStatus))}
      className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1.5 border border-[#14140f] cursor-pointer ${COLOR[status]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-white text-[#14140f]">
          {s}
        </option>
      ))}
    </select>
  );
}
