import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface StartSessionHeroProps {
  onPress?: () => void;
}

/**
 * "Start session" hero (04 Home). The session flow itself (05 Choose a
 * template onward) isn't built yet, so `onPress` is optional and this is
 * inert until a caller wires one up — pressing it does nothing rather than
 * routing to a screen that doesn't exist.
 */
export function StartSessionHero({ onPress }: StartSessionHeroProps) {
  return (
    <View style={{ marginHorizontal: 22, gap: 10 }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Start session"
        style={({ pressed }) => [
          {
            height: 104,
            backgroundColor: colors.ink,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 24,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Text
          variant="display"
          style={{ fontSize: 30, lineHeight: 30, color: colors.surface.DEFAULT, textTransform: "uppercase" }}
        >
          {"Start\nsession"}
        </Text>
        <View
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            backgroundColor: colors.amber,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: 3,
              borderColor: colors.ink,
            }}
          />
        </View>
      </Pressable>
      <Text weight="medium" style={{ fontSize: 12, letterSpacing: 0.48, color: colors.muted.DEFAULT }}>
        4 shots · countdown · ~40 seconds
      </Text>
    </View>
  );
}
