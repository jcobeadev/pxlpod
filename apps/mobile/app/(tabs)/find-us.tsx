import { useState } from "react";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useEvents, useLiveEvent, type EventRow } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Segmented } from "../../src/components/session/controls";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * 23 Events — where the booth will be, and where it's been. The live pop-up
 * pins to the top with a printing-available marker; everything else splits into
 * Upcoming and Past.
 */
export default function FindUsTab() {
  const client = usePoplabClient();
  const [when, setWhen] = useState<"upcoming" | "past">("upcoming");

  const liveEvent = useLiveEvent(client, TENANT_ID).data ?? null;
  const { data, isPending, isError, refetch } = useEvents(client, TENANT_ID, { when });

  // The live event also appears in "upcoming" (its window is still open); it's
  // shown in the pinned banner instead, so filter it from the list.
  const events = (data ?? []).filter((e) => e.id !== liveEvent?.id);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {liveEvent ? (
        <View style={{ backgroundColor: colors.amber, padding: 16, marginBottom: 16 }}>
          <Text weight="bold" style={{ fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase" }}>Live now</Text>
          <Text variant="display" style={{ fontSize: 20, marginTop: 2 }}>{liveEvent.title}</Text>
          <Text style={{ fontSize: 13, marginTop: 3 }}>{eventWhere(liveEvent)}</Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8, alignItems: "center" }}>
            {liveEvent.printing_enabled ? (
              <View style={{ backgroundColor: colors.ink, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text weight="bold" style={{ fontSize: 10, letterSpacing: 0.5, color: colors.surface.DEFAULT }}>PRINTING AVAILABLE</Text>
              </View>
            ) : null}
            <DirectionsButton event={liveEvent} onDark />
          </View>
        </View>
      ) : null}

      <View style={{ marginBottom: 16 }}>
        <Segmented
          options={[{ label: "Upcoming", value: "upcoming" }, { label: "Past", value: "past" }]}
          value={when}
          onChange={setWhen}
        />
      </View>

      {isPending ? (
        <Note>Loading…</Note>
      ) : isError ? (
        <Pressable onPress={() => void refetch()}><Note>Couldn&apos;t load — tap to retry.</Note></Pressable>
      ) : events.length === 0 ? (
        <Note>{when === "upcoming" ? "No pop-ups scheduled yet — check back soon." : "No past events to show."}</Note>
      ) : (
        <View style={{ gap: 14 }}>
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function EventCard({ event }: { event: EventRow }) {
  const start = new Date(event.starts_at);
  return (
    <View style={{ flexDirection: "row", gap: 16, borderBottomWidth: 1, borderBottomColor: colors.surface["4"], paddingBottom: 14 }}>
      <View style={{ width: 52, alignItems: "center" }}>
        <Text variant="display" style={{ fontSize: 26, lineHeight: 26 }}>{start.getDate()}</Text>
        <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
          {start.toLocaleDateString("en-US", { month: "short" })}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text weight="bold" style={{ fontSize: 16 }}>{event.title}</Text>
        <Text style={{ fontSize: 13, color: colors.muted.DEFAULT }}>{eventWhere(event)}</Text>
        <Text style={{ fontSize: 12.5, color: colors.muted.DEFAULT }}>{eventWhen(event)}</Text>
        <View style={{ flexDirection: "row", gap: 6, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
          {event.printing_enabled ? (
            <Badge label={event.print_price_cents > 0 ? `Prints ₱${(event.print_price_cents / 100).toFixed(0)}` : "Prints"} />
          ) : null}
          <Badge label={event.ticket_url ? "Ticketed" : "Free"} />
          <DirectionsButton event={event} />
        </View>
      </View>
    </View>
  );
}

/**
 * Opens the event's pin in Google Maps (or the OS default map app) externally —
 * no location-tracking API, so no ongoing cost. Prefers the exact lat/lng pin
 * the operator set; falls back to searching the venue/address text. Renders
 * nothing when the event has no location at all.
 */
function DirectionsButton({ event, onDark }: { event: EventRow; onDark?: boolean }) {
  const url = directionsUrl(event);
  if (!url) return null;
  const color = onDark ? colors.ink : colors.muted.DEFAULT;
  return (
    <Pressable
      onPress={() => void Linking.openURL(url)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Directions to ${event.title}`}
      style={{ borderWidth: 1, borderColor: onDark ? colors.ink : colors.surface["3"], paddingHorizontal: 8, paddingVertical: 2 }}
    >
      <Text weight="bold" style={{ fontSize: 10, letterSpacing: 0.4, color }}>Directions ↗</Text>
    </Pressable>
  );
}

function directionsUrl(event: {
  lat: number | null;
  lng: number | null;
  address: string | null;
  venue_name: string | null;
  city: string | null;
}): string | null {
  if (event.lat != null && event.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`;
  }
  const query = [event.venue_name, event.address, event.city].filter(Boolean).join(", ");
  if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return null;
}

function Badge({ label }: { label: string }) {
  return (
    <View style={{ borderWidth: 1, borderColor: colors.surface["3"], paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text weight="bold" style={{ fontSize: 10, letterSpacing: 0.4, color: colors.muted.DEFAULT }}>{label}</Text>
    </View>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <View style={{ padding: 40, alignItems: "center" }}><Text style={{ color: colors.muted.DEFAULT }}>{children}</Text></View>;
}

function eventWhere(event: { venue_name: string | null; city: string | null }): string {
  return [event.venue_name, event.city].filter(Boolean).join(" · ") || "Venue to be announced";
}

/**
 * When the event runs, showing the end date too. Same-day events read as a time
 * range ("6–10 PM"); multi-day events spell out both dates so an overnight or
 * weekend pop-up is unambiguous.
 */
function eventWhen(event: { starts_at: string; ends_at: string }): string {
  const start = new Date(event.starts_at);
  const end = new Date(event.ends_at);
  const time = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const date = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${date(start)} · ${time(start)} – ${time(end)}`
    : `${date(start)} ${time(start)} – ${date(end)} ${time(end)}`;
}
