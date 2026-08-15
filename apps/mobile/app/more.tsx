import { Alert, Linking, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContent } from "@poplab/api";

// Mirrors app.json's version. expo-constants would read this at runtime, but
// it's only a transitive dep here and importing it would force a native rebuild.
const APP_VERSION = "1.0.0";

import { Text } from "../src/components/ui";
import { colors } from "../src/theme";
import { useLibrary, useStrips } from "../src/library/useLibrary";
import { usePoplabClient } from "./_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * The "More" section — About (29), the useful bits of Settings (30), and the
 * Privacy & my data controls (31). Privacy is not optional: the App Store
 * requires a data-handling explanation, and the Data Privacy Act requires a way
 * for someone to delete what's held about them. Here that's every strip on the
 * device, since nothing about the guest is held anywhere else.
 */
export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();

  const { strips } = useStrips();
  const remove = useLibrary((s) => s.remove);
  const content = useAppContent(client, TENANT_ID).data;

  const aboutText =
    (content?.about as { body?: string } | undefined)?.body ??
    "PxlPod is a high-angle pop-up photobooth. Shoot a strip on your phone, keep it, share it — and print it at the booth when we're live.";

  const deleteAll = () => {
    if (strips.length === 0) {
      Alert.alert("Nothing to delete", "You have no strips saved in the app.");
      return;
    }
    Alert.alert(
      `Delete all ${strips.length} strips?`,
      "Removes every strip from this app. Copies you saved to your photos or shared elsewhere are untouched.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            for (const s of strips) await remove(s.id);
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="display" style={{ fontSize: 26, textTransform: "uppercase" }}>More</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 32, paddingTop: 12 }}>
        <Section title="About PXLPOD">
          <Text style={{ fontSize: 14, lineHeight: 21, color: colors.ink }}>{aboutText}</Text>
        </Section>

        <Section title="Privacy & my data">
          <Bullet>Your strips and the photos in them stay on this phone. Nothing is uploaded to make a strip.</Bullet>
          <Bullet>Save to device writes a copy to your camera roll. Share hands the image to whichever app you pick.</Bullet>
          <Bullet>Sending, links and printing (coming soon) will upload a photo only after you tap them and agree — never before.</Bullet>
          <Pressable onPress={deleteAll} style={{ marginTop: 14, borderWidth: 1, borderColor: "#A33418", paddingVertical: 13, alignItems: "center" }}>
            <Text weight="bold" style={{ color: "#A33418", letterSpacing: 0.4 }}>Delete all my strips ({strips.length})</Text>
          </Pressable>
        </Section>

        <Section title="Settings">
          <Row label="Strips saved on this device" value={String(strips.length)} />
          <Row label="App version" value={APP_VERSION} />
        </Section>

        <Pressable onPress={() => void Linking.openURL("https://pxlpod.example/privacy")} style={{ marginTop: 6 }}>
          <Text style={{ fontSize: 12.5, color: colors.muted.DEFAULT, textDecorationLine: "underline" }}>Full privacy policy</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 26, gap: 10 }}>
      <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, marginBottom: 8 }}>
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.amber, marginTop: 7 }} />
      <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 20, color: colors.muted.DEFAULT }}>{children}</Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surface["4"] }}>
      <Text style={{ fontSize: 14, color: colors.muted.DEFAULT }}>{label}</Text>
      <Text weight="semibold" style={{ fontSize: 14 }}>{value}</Text>
    </View>
  );
}
