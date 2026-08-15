import { View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

const ROW_HEIGHT = 126;

/**
 * "Your recent strips" (04 Home). There is no local-session history source
 * to read from yet — only the empty state is built here, per the batch spec.
 * Scaled down from the full-screen empty pattern in "21b My photos empty"
 * (dashed frame + numbered slots) to fit inline as one row of the Home feed.
 */
export function RecentStripsRow() {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 22 }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Your recent strips
        </Text>
      </View>
      <View
        style={{
          marginHorizontal: 22,
          height: ROW_HEIGHT,
          borderWidth: 2,
          borderStyle: "dashed",
          borderColor: colors.surface["6"],
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 18,
        }}
      >
        <View style={{ flexDirection: "row", gap: 4 }}>
          {[1, 2, 3, 4].map((slot) => (
            <View
              key={slot}
              style={{
                width: 20,
                height: 78,
                backgroundColor: colors.surface["7"],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text weight="bold" style={{ fontSize: 11, color: colors.faint.DEFAULT }}>
                {slot}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text weight="bold" style={{ fontSize: 13 }}>
            No strips yet
          </Text>
          <Text style={{ fontSize: 12, lineHeight: 16, color: colors.muted.DEFAULT }}>
            Your first strip lands here after a session.
          </Text>
        </View>
      </View>
    </View>
  );
}
