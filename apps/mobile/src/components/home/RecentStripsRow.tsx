import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { useStrips } from "../../library/useLibrary";

const ROW_HEIGHT = 126;

/**
 * "Your recent strips" (04 Home). Reads the on-device library: once a session
 * finishes and its strip is committed, the newest few appear here as a
 * horizontal row; before that, the dashed empty state from "21b My photos".
 */
export function RecentStripsRow() {
  const router = useRouter();
  const { strips } = useStrips();
  const recent = strips.slice(0, 6);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Your recent strips
        </Text>
        {recent.length > 0 ? (
          <Pressable onPress={() => router.push("/my-photos")} hitSlop={8}>
            <Text weight="bold" style={{ fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {recent.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}>
          {recent.map((strip) => (
            <Pressable key={strip.id} onPress={() => router.push(`/strip/${strip.id}`)}>
              <View style={{ width: ROW_HEIGHT * (2 / 3), height: ROW_HEIGHT, backgroundColor: colors.surface["2"], borderWidth: 1, borderColor: colors.surface["3"] }}>
                <Image source={{ uri: strip.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
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
      )}
    </View>
  );
}
