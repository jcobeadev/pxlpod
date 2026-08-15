import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

export interface LiveBannerProps {
  eventTitle: string;
  onDismiss: () => void;
}

/** "Live now" banner (04 Home) — only rendered by the caller while a pop-up is running and not dismissed. */
export function LiveBanner({ eventTitle, onDismiss }: LiveBannerProps) {
  return (
    <View
      style={{
        marginHorizontal: 22,
        backgroundColor: colors.amber,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: colors.ink }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>
          Live now
        </Text>
        <Text weight="bold" style={{ fontSize: 14 }} numberOfLines={1}>
          {eventTitle}
        </Text>
      </View>
      <Pressable onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel="Dismiss">
        <Text weight="bold" style={{ fontSize: 16, opacity: 0.5 }}>
          ✕
        </Text>
      </Pressable>
    </View>
  );
}
