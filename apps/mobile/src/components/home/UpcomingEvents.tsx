import { View } from "react-native";
import type { EventRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface UpcomingEventsProps {
  events: EventRow[];
  max?: number;
}

function dateParts(iso: string, timeZone: string) {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone }).format(date).toUpperCase();
  return { day, month };
}

function hourParts(iso: string, timeZone: string): { hour: string; meridiem: string } {
  const formatted = new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: true, timeZone }).format(
    new Date(iso),
  );
  const match = /(\d+)\D*(AM|PM)/i.exec(formatted);
  const hour = match?.[1];
  const meridiem = match?.[2];
  return hour && meridiem ? { hour, meridiem: meridiem.toUpperCase() } : { hour: formatted, meridiem: "" };
}

/** "4–10 PM" when both ends share a meridiem (matches 04d Home scrolled), else "4 AM–10 PM". */
function formatTimeRange(startsAt: string, endsAt: string, timeZone: string): string {
  const start = hourParts(startsAt, timeZone);
  const end = hourParts(endsAt, timeZone);
  if (start.meridiem === end.meridiem) {
    return `${start.hour}–${end.hour} ${end.meridiem}`;
  }
  return `${start.hour} ${start.meridiem}–${end.hour} ${end.meridiem}`;
}

/** "Where we'll be next" (04d Home scrolled) — the next 2–3 upcoming events. */
export function UpcomingEvents({ events, max = 3 }: UpcomingEventsProps) {
  const upcoming = events.slice(0, max);

  return (
    <View style={{ marginHorizontal: 22, gap: 12 }}>
      <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
        Where we&apos;ll be next
      </Text>
      {upcoming.length === 0 ? (
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.muted.DEFAULT, paddingVertical: 12 }}>
          Nothing on the calendar yet — check back soon.
        </Text>
      ) : (
        <View>
          {upcoming.map((event, index) => {
            const { day, month } = dateParts(event.starts_at, event.timezone);
            const location = [event.city, formatTimeRange(event.starts_at, event.ends_at, event.timezone)]
              .filter(Boolean)
              .join(" · ");
            return (
              <View
                key={event.id}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderColor: colors.surface["4"],
                  borderBottomWidth: index === upcoming.length - 1 ? 1 : 0,
                }}
              >
                <View style={{ width: 46, alignItems: "center" }}>
                  <Text variant="display" style={{ fontSize: 20, lineHeight: 20 }}>
                    {day}
                  </Text>
                  <Text weight="bold" style={{ fontSize: 9, letterSpacing: 1.26 }}>
                    {month}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="bold" style={{ fontSize: 14 }} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.muted.DEFAULT }} numberOfLines={1}>
                    {location}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
