import { useRef, useState } from "react";
import { Image, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import type { AlbumRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { HatchPlaceholder } from "./HatchPlaceholder";

export interface PortfolioRowProps {
  albums: AlbumRow[];
  /** Resolves an album's `cover_path` (in the `albums` bucket) to a loadable URL. */
  resolveCover: (path: string) => string;
  onOpen: (albumId: string) => void;
  onSeeAll: () => void;
}

/**
 * "Portfolio" — a full-width swipeable carousel of the operator's published
 * albums (their proof of what a booth looks like), with a "See all" that opens
 * the full gallery. Hidden entirely when nothing is published. One card per
 * page so each cover gets the whole width; dots show position.
 */
export function PortfolioRow({ albums, resolveCover, onOpen, onSeeAll }: PortfolioRowProps) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pageRef = useRef(0);

  if (albums.length === 0) {
    return null;
  }

  const H_PAD = 22;
  const cardWidth = width - H_PAD * 2;
  const cardHeight = Math.round(cardWidth * 0.62);
  // Each page is a card plus the gap that follows it, so paging snaps cleanly.
  const GAP = 12;
  const pageWidth = cardWidth + GAP;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== pageRef.current) {
      pageRef.current = next;
      setPage(next);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ marginHorizontal: H_PAD, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Portfolio
        </Text>
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
          <Text weight="bold" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
            See all →
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: H_PAD }}
      >
        {albums.map((album) => (
          <Pressable
            key={album.id}
            onPress={() => onOpen(album.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open album ${album.title}`}
            style={{ width: cardWidth, marginRight: GAP }}
          >
            {album.cover_path ? (
              <Image source={{ uri: resolveCover(album.cover_path) }} style={{ width: cardWidth, height: cardHeight }} resizeMode="cover" />
            ) : (
              <HatchPlaceholder width={cardWidth} height={cardHeight} />
            )}
            {/* Title strip over the bottom of the cover. */}
            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "rgba(14,14,12,0.55)", paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text weight="bold" style={{ fontSize: 15, color: colors.surface.DEFAULT }} numberOfLines={1}>
                {album.title}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {albums.length > 1 ? (
        <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 2 }}>
          {albums.map((a, i) => (
            <View
              key={a.id}
              style={{
                width: i === page ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? colors.ink : colors.surface["3"],
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
