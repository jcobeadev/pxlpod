import { useEffect, useRef } from "react";
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

const ITEM_W = 132;
const ITEM_H = 176;
const GAP = 10;
const SPEED = 42; // px per second

/**
 * "Portfolio" — an auto-scrolling marquee of real photos from the operator's
 * published albums (their past pop-ups). It drifts continuously so the home
 * screen feels alive; "See all" opens the full gallery. Hidden when there are
 * no published photos. Pure RN Animated (native driver) — no extra dependency.
 */
export function PortfolioMarquee({ photos, resolvePhoto, onSeeAll }: PortfolioMarqueeProps) {
  const x = useRef(new Animated.Value(0)).current;

  // One "lane" is the full set laid end to end; we render it twice and slide by
  // exactly one lane width, then loop, so the seam is invisible.
  const laneWidth = photos.length * (ITEM_W + GAP);

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
    photos.map((p, i) => (
      <Image
        key={`${keyPrefix}-${p.id ?? i}`}
        source={{ uri: resolvePhoto(p.path) }}
        style={{ width: ITEM_W, height: ITEM_H, marginRight: GAP, backgroundColor: colors.surface["3"] }}
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
