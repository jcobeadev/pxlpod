import { StyleSheet, Pressable, useWindowDimensions, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

// The actual clip, bundled with the app. expo-video is a native module, so this
// component only works on a build that includes it — Home lazy-loads it behind
// an ErrorBoundary that falls back to the sprite-sheet tile on older builds.
const SOURCE = require("../../../assets/start-session.mp4");
const FRAME_RATIO = 288 / 512; // 16:9 tile, matching the clip (1920x1080)
const DEFAULT_CAPTION = "4 shots · countdown · ~40 seconds";

export interface StartSessionHeroMp4Props {
  onPress?: () => void;
  caption?: string;
}

/**
 * Real looping-video "Start session" tile (expo-video). The clip carries the
 * PXLPOD branding and a "tap here to start" shutter, so nothing is overlaid; a
 * transparent Pressable on top makes the whole tile tappable.
 */
export default function StartSessionHeroMp4({ onPress, caption }: StartSessionHeroMp4Props) {
  const { width } = useWindowDimensions();
  const tileWidth = width - 44; // 22pt margin each side
  const tileHeight = Math.round(tileWidth * FRAME_RATIO);

  const player = useVideoPlayer(SOURCE, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={{ marginHorizontal: 22, gap: 12 }}>
      <View style={{ width: tileWidth, height: tileHeight, backgroundColor: colors.ink, overflow: "hidden" }}>
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="cover"
          style={{ width: tileWidth, height: tileHeight }}
        />
        {/* Transparent tap target over the video. */}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Start session"
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Text weight="medium" style={{ fontSize: 12, letterSpacing: 0.4, color: colors.muted.DEFAULT }}>
        {caption?.trim() || DEFAULT_CAPTION}
      </Text>
    </View>
  );
}
