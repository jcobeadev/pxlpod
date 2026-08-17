import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, Pressable, View } from "react-native";
import type { AlbumPhotoRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface PortfolioMarqueeProps {
  photos: AlbumPhotoRow[];
  /** Resolves an album photo `path` (in the `albums` bucket) to a loadable URL. */
  resolvePhoto: (path: string) => string;
  onSeeAll: () => void;
}

const ITEM_H = 176; // fixed height; width follows each photo's aspect ratio
const MIN_W = 90;
const MAX_W = 280;
const GAP = 10;
const SPEED = 42; // px per second

/**
 * "Portfolio" — an auto-scrolling marquee of real photos from the operator's
 * published albums. Each photo keeps its aspect ratio (fixed height, width from
 * the stored w/h) so nothing is cropped, like a film strip. "See all" opens the
 * full gallery. Hidden when there are no published photos. Pure RN Animated.
 */
export function PortfolioMarquee({ photos, resolvePhoto, onSeeAll }: PortfolioMarqueeProps) {
  const x = useRef(new Animated.Value(0)).current;

  // Precompute each photo's display width from its aspect ratio.
  const items = useMemo(
    () =>
      photos.map((p) => {
        const aspect = p.width && p.height ? p.width / p.height : 1;
        const width = Math.min(MAX_W, Math.max(MIN_W, Math.round(ITEM_H * aspect)));
        return { photo: p, width };
      }),
    [photos],
  );

  const laneWidth = useMemo(() => items.reduce((sum, it) => sum + it.width + GAP, 0), [items]);

  useEffect(() => {
    if (laneWidth <= 0) return;
    x.setValue(0);
    const anim = Animated.loop(
      Animated.timing(x, {
        toValue: -laneWidth,
        duration: (laneWidth / SPEED) * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [laneWidth, x]);

  if (photos.length === 0) return null;

  const lane = (keyPrefix: string) =>
    items.map((it, i) => (
      <Image
        key={`${keyPrefix}-${it.photo.id ?? i}`}
        source={{ uri: resolvePhoto(it.photo.path) }}
        style={{ width: it.width, height: ITEM_H, marginRight: GAP, backgroundColor: colors.surface["3"] }}
        resizeMode="cover"
      />
    ));

  return (
    <View style={{ gap: 10 }}>
      <View style={{ marginHorizontal: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="subheading" style={{ fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase" }}>
          Portfolio
        </Text>
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="See all portfolio photos">
          <Text weight="bold" style={{ fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
            See all →
          </Text>
        </Pressable>
      </View>

      {/* Tapping anywhere on the strip opens the gallery. overflow hidden clips
          the moving lanes to the row. */}
      <Pressable onPress={onSeeAll} style={{ height: ITEM_H, overflow: "hidden" }}>
        <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }], paddingLeft: 22 }}>
          {lane("a")}
          {lane("b")}
        </Animated.View>
      </Pressable>
    </View>
  );
}
