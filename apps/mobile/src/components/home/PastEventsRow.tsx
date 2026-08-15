import { Image, ScrollView, View } from "react-native";
import type { EventRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { HatchPlaceholder } from "./HatchPlaceholder";

const CARD_WIDTH = 164;
const CARD_HEIGHT = 110;

export interface PastEventsRowProps {
  events: EventRow[];
  /** Resolves an event's `cover_path` (in the `albums` bucket) to a loadable URL. */
  resolveCover: (path: string) => string;
}

/**
 * "Past events" (04d Home scrolled). The design's cards carry a photo-count
 * badge ("124 photos") on the cover — there is no cheap way to get that
 * count here without an extra query per event (album_photos has no
 * per-album aggregate), so it's left off rather than fabricated. Hidden
 * entirely when there are no past events yet (the tenant's very first
 * pop-up hasn't happened), since an empty carousel under "Past events"
 * reads as more broken than absent.
 */
export function PastEventsRow({ events, resolveCover }: PastEventsRowProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 22 }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Past events
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}
      >
        {events.map((event) => {
          const caption = `${event.title} · ${new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            timeZone: event.timezone,
          }).format(new Date(event.starts_at))}`;

          return (
            <View key={event.id} style={{ width: CARD_WIDTH, gap: 8 }}>
              {event.cover_path ? (
                <Image
                  source={{ uri: resolveCover(event.cover_path) }}
                  style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                  resizeMode="cover"
                />
              ) : (
                <HatchPlaceholder width={CARD_WIDTH} height={CARD_HEIGHT} />
              )}
              <Text weight="bold" style={{ fontSize: 13, color: colors.ink }} numberOfLines={1}>
                {caption}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
