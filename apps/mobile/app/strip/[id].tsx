import { Alert, Image, Pressable, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Legacy subpath: the top-level saveToLibraryAsync is deprecated and throws in
// SDK 57. See app/session/delivery.tsx.
import * as MediaLibrary from "expo-media-library/legacy";
import Share from "react-native-share";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { useLibrary, useStrips } from "../../src/library/useLibrary";

/**
 * 22 Session detail — one saved strip, full size, with share, save-to-device
 * and delete. Re-render into another template (the design's fourth action) is a
 * later batch; it needs the original frames, which this build doesn't retain
 * past the session.
 */
export default function StripDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { strips } = useStrips();
  const remove = useLibrary((s) => s.remove);

  const strip = strips.find((s) => s.id === id);

  if (!strip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ground, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: insets.top }}>
        <Text style={{ color: colors.surface.DEFAULT }}>This strip is gone.</Text>
        <Pressable onPress={() => router.back()}><Text weight="bold" style={{ color: colors.amber }}>Back</Text></Pressable>
      </View>
    );
  }

  const onShare = async () => {
    try {
      await Share.open({ url: strip.uri, type: "image/jpeg", failOnCancel: false });
    } catch {
      /* dismissed */
    }
  };

  const onSave = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Photos access needed", "Allow photo access in Settings to save.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(strip.uri);
      Alert.alert("Saved", "Your strip is in your photos.");
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : String(e));
    }
  };

  const onDelete = () => {
    Alert.alert("Delete strip?", "This removes it from the app. Copies you already saved or shared stay.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await remove(strip.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.surface.DEFAULT }}>‹</Text>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>Delete</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 10 }}>
        <Image source={{ uri: strip.uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
      </View>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 22, paddingBottom: insets.bottom + 16 }}>
        <Pressable onPress={onShare} style={{ flex: 1, borderWidth: 1, borderColor: colors.surface.DEFAULT, paddingVertical: 14, alignItems: "center" }}>
          <Text weight="bold" style={{ color: colors.surface.DEFAULT, letterSpacing: 0.5 }}>Share</Text>
        </Pressable>
        <Pressable onPress={onSave} style={{ flex: 1, backgroundColor: colors.amber, paddingVertical: 14, alignItems: "center" }}>
          <Text weight="bold" style={{ color: colors.ink, letterSpacing: 0.5 }}>Save to device</Text>
        </Pressable>
      </View>
    </View>
  );
}
