import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface BookUsCtaProps {
  onPress?: () => void;
}

/**
 * "Book PXLPOD for your event" (04d Home scrolled). "28 Book us" isn't built
 * yet, so `onPress` is optional and the card is inert for now.
 *
 * Plain object style, not `({ pressed }) => (...)`: a function style was
 * dropping the container's margin, border and padding on this stack, so the
 * heading ran to the screen edge and the arrow tile sat in the corner. See the
 * note in StartSessionHero.
 */
export function BookUsCta({ onPress }: BookUsCtaProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Book PXLPOD for your event"
      style={{
        marginHorizontal: 22,
        backgroundColor: colors.ink,
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View style={{ flex: 1, gap: 6 }}>
        <Text
          variant="display"
          style={{
            fontSize: 19,
            lineHeight: 21,
            color: colors.surface.DEFAULT,
            textTransform: "uppercase",
          }}
        >
          {"Book PXLPOD\nfor your event"}
        </Text>
        <Text style={{ fontSize: 12.5, color: colors.faint.DEFAULT }}>
          Weddings, debuts, pop-ups
        </Text>
      </View>

      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.amber,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text weight="bold" style={{ fontSize: 20, color: colors.ink, lineHeight: 22 }}>
          →
        </Text>
      </View>
    </Pressable>
  );
}
