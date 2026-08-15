import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface BookUsCtaProps {
  onPress?: () => void;
}

/**
 * "Book PXLPOD for your event" (04d Home scrolled). "28 Book us" isn't built
 * yet, so `onPress` is optional — the card is inert until a caller wires up
 * real navigation.
 */
export function BookUsCta({ onPress }: BookUsCtaProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Book PXLPOD for your event"
      style={({ pressed }) => ({
        marginHorizontal: 22,
        borderWidth: 1.5,
        borderColor: colors.ink,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="display" style={{ fontSize: 17, lineHeight: 19, textTransform: "uppercase" }}>
          {"Book PXLPOD\nfor your event"}
        </Text>
        <Text style={{ fontSize: 12, color: colors.muted.DEFAULT }}>Weddings, debuts, pop-ups</Text>
      </View>
      <View
        style={{
          width: 40,
          height: 40,
          backgroundColor: colors.amber,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text weight="bold" style={{ fontSize: 18 }}>
          →
        </Text>
      </View>
    </Pressable>
  );
}
