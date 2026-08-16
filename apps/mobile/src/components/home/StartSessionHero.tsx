import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface StartSessionHeroProps {
  onPress?: () => void;
  /** Operator tagline shown under the button, edited in the console (Content →
   * Home hero line). Falls back to a functional description of the flow. */
  caption?: string;
}

const DEFAULT_CAPTION = "4 shots · countdown · ~40 seconds";

/**
 * "Start session" hero (04 Home). The session flow itself (05 Choose a
 * template onward) isn't built yet, so `onPress` is optional and this is
 * inert until a caller wires one up.
 *
 * NOTE: the container styles live in a plain object, not a
 * `({ pressed }) => [...]` function. On this stack (New Architecture, RN 0.86,
 * React 19) a Pressable whose `style` is a function was dropping its container
 * styles entirely — the dark box simply did not paint, leaving the bare amber
 * shutter floating on white. Press feedback is done with the `opacity` prop
 * instead, which is honoured. Every Pressable added here should follow suit.
 */
export function StartSessionHero({ onPress, caption }: StartSessionHeroProps) {
  return (
    <View style={{ marginHorizontal: 22, gap: 12 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Start session"
        style={{
          height: 116,
          backgroundColor: colors.ink,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 26,
          paddingRight: 22,
        }}
      >
        <Text
          variant="display"
          style={{
            fontSize: 32,
            lineHeight: 31,
            color: colors.surface.DEFAULT,
            textTransform: "uppercase",
          }}
        >
          {"Start\nsession"}
        </Text>

        {/* Camera-shutter mark, echoing the splash aperture. */}
        <View
          style={{
            width: 66,
            height: 66,
            borderRadius: 33,
            backgroundColor: colors.amber,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              borderWidth: 3.5,
              borderColor: colors.ink,
            }}
          />
        </View>
      </Pressable>

      <Text
        weight="medium"
        style={{ fontSize: 12, letterSpacing: 0.4, color: colors.muted.DEFAULT }}
      >
        {caption?.trim() || DEFAULT_CAPTION}
      </Text>
    </View>
  );
}
