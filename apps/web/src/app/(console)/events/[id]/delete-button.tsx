"use client";
import { deleteEvent } from "../actions";
export function DeleteEventButton({ id }: { id: string }) {
  return (
    <button
      onClick={() => { if (confirm("Delete this event?")) void deleteEvent(id); }}
      className="border border-[#a33418] text-[#a33418] font-bold uppercase tracking-wide text-[12px] px-4 py-2"
    >
      Delete
    </button>
  );
}
