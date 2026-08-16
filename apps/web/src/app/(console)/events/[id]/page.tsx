import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { EventForm } from "../event-form";
import { DeleteEventButton } from "./delete-button";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!event) notFound();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/events" className="text-[12px] font-bold uppercase tracking-wide text-[#7a736a]">← Events</Link>
          <h1 className="font-display text-4xl uppercase mt-1">Edit event</h1>
        </div>
        <DeleteEventButton id={event.id} />
      </div>
      <EventForm values={event} />
    </div>
  );
}
