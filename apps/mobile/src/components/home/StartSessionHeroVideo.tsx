import { useEffect, useRef, useState } from "react";
import { Image, Pressable, useWindowDimensions, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

// A 4x4 sprite sheet (16 frames) rendered from start-session.mp4. Playing it by
// stepping a single image through its cells means NO native video module — it
// runs on the current dev build without an EAS rebuild, purely to trial the UI.
// For real .mp4 playback we'd add expo-video (native → rebuild).
const SHEET = require("../../../assets/start-session-sheet.png");
const COLS = 4;
const ROWS = 4;
const FRAMES = COLS * ROWS;
const FRAME_MS = 150; // ~6.6 fps
const FRAME_RATIO = 288 / 512; // sheet cell is 512x288

const DEFAULT_CAPTION = "4 shots · countdown · ~40 seconds";

export interface StartSessionHeroVideoProps {
  onPress?: () => void;
  caption?: string;
}

/**
 * Video-style "Start session" hero: booth footage looping behind the label, an
 * alternative to the flat dark tile in StartSessionHero. Flip USE_VIDEO_HERO in
 * app/(tabs)/index.tsx to compare the two.
 */
export function StartSessionHeroVideo({ onPress, caption }: StartSessionHeroVideoProps) {
  const { width } = useWindowDimensions();
  const tileWidth = width - 44; // 22pt margin each side
  const tileHeight = Math.round(tileWidth * FRAME_RATIO);

  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % FRAMES;
      setFrame(frameRef.current);
    }, FRAME_MS);
    return () => clearInterval(id);
  }, []);

  const col = frame % COLS;
  const row = Math.floor(frame / COLS);

  return (
    <View style={{ marginHorizontal: 22, gap: 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Start session"
        style={{ width: tileWidth, height: tileHeight, backgroundColor: colors.ink, overflow: "hidden" }}
      >
        {/* The full sheet, scaled so one cell fills the tile, shifted to the
            current frame. */}
        <Image
          source={SHEET}
          style={{
            position: "absolute",
            width: tileWidth * COLS,
            height: tileHeight * ROWS,
            left: -col * tileWidth,
            top: -row * tileHeight,
          }}
          resizeMode="cover"
        />

        {/* Legibility scrim under the label. */}
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: tileHeight * 0.7, backgroundColor: "rgba(14,14,12,0.42)" }} />

        <View style={{ position: "absolute", left: 22, right: 22, bottom: 18, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <Text
            variant="display"
            style={{ fontSize: 32, lineHeight: 31, color: colors.surface.DEFAULT, textTransform: "uppercase" }}
          >
            {"Start\nsession"}
          </Text>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 3.5, borderColor: colors.ink }} />
          </View>
        </View>
      </Pressable>

      <Text weight="medium" style={{ fontSize: 12, letterSpacing: 0.4, color: colors.muted.DEFAULT }}>
        {caption?.trim() || DEFAULT_CAPTION}
      </Text>
    </View>
  );
}
