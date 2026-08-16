import Link from "next/link";
import { EventForm } from "../event-form";

export default function NewEventPage() {
  const now = new Date();
  const end = new Date(now.getTime() + 4 * 3600 * 1000);
  return (
    <div className="p-8">
      <Link href="/events" className="text-[12px] font-bold uppercase tracking-wide text-[#7a736a]">← Events</Link>
      <h1 className="font-display text-4xl uppercase mt-1 mb-6">New event</h1>
      <EventForm values={{ starts_at: now.toISOString(), ends_at: end.toISOString(), is_published: true }} />
    </div>
  );
}
