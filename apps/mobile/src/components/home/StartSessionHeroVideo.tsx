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
        {/* The video IS the tile — the clip already carries the PXLPOD branding
            and a "tap here to start" shutter, so no text/shutter overlay is
            drawn on top (that was the overlap). The full sheet is scaled so one
            cell fills the tile, shifted to the current frame. */}
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
      </Pressable>

      <Text weight="medium" style={{ fontSize: 12, letterSpacing: 0.4, color: colors.muted.DEFAULT }}>
        {caption?.trim() || DEFAULT_CAPTION}
      </Text>
    </View>
  );
}
