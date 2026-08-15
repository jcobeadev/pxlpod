import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { useStrips } from "../../src/library/useLibrary";

/**
 * 21 My photos — the grid of strips this device has made, read from the local
 * library. Empty until the first session finishes (21b).
 */
export default function MyPhotosTab() {
  const router = useRouter();
  const { strips, loaded } = useStrips();

  if (loaded && strips.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 5 }}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={{ width: 34, height: 120, backgroundColor: colors.surface["2"], alignItems: "center", justifyContent: "center" }}>
              <Text weight="bold" style={{ color: colors.faint.DEFAULT }}>{n}</Text>
            </View>
          ))}
        </View>
        <View style={{ alignItems: "center", gap: 5 }}>
          <Text variant="display" style={{ fontSize: 22 }}>No strips yet</Text>
          <Text style={{ fontSize: 13, color: colors.muted.DEFAULT, textAlign: "center" }}>
            Tap Start session on Home — your strips land here.
          </Text>
        </View>
        <Pressable onPress={() => router.push("/session")} style={{ backgroundColor: colors.ink, paddingHorizontal: 22, paddingVertical: 13 }}>
          <Text weight="bold" style={{ color: colors.surface.DEFAULT, letterSpacing: 0.5 }}>Start a session</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {strips.map((strip) => (
          <Pressable key={strip.id} onPress={() => router.push(`/strip/${strip.id}`)} style={{ width: "31.5%", aspectRatio: 2 / 3 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface["2"], borderWidth: 1, borderColor: colors.surface["3"] }}>
              <Image source={{ uri: strip.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
