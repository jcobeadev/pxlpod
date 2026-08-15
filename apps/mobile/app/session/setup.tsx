import { Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Segmented, ToggleRow } from "../../src/components/session/controls";
import { useSession } from "../../src/session/store";

/** 07 Session setup. Every control writes straight to the session store. */
export default function SessionSetup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const settings = useSession((s) => s.settings);
  const update = useSession((s) => s.updateSettings);
  const template = useSession((s) => s.template);

  if (!template) {
    router.replace("/session");
    return null;
  }

  const start = () => router.push("/session/capture");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>‹</Text>
        </Pressable>
        <Pressable onPress={start} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 100 }}>
        <Text variant="display" style={{ fontSize: 32, textTransform: "uppercase", marginTop: 6, marginBottom: 22 }}>
          {"Session\nsetup"}
        </Text>

        <Field label="Countdown timer">
          <Segmented
            options={[{ label: "3s", value: 3 }, { label: "5s", value: 5 }, { label: "10s", value: 10 }]}
            value={settings.timer}
            onChange={(timer) => update({ timer })}
          />
        </Field>

        <Field label="Camera">
          <Segmented
            options={[{ label: "Front", value: "front" }, { label: "Rear", value: "back" }]}
            value={settings.facing}
            onChange={(facing) => update({ facing })}
          />
        </Field>

        <View style={{ marginTop: 8 }}>
          <ToggleRow label="Mirror preview" hint="Flip like a real mirror" value={settings.mirrorPreview} onChange={(mirrorPreview) => update({ mirrorPreview })} />
          <ToggleRow label="Screen fill-light" hint="Brightens the screen while shooting" value={settings.fillLight} onChange={(fillLight) => update({ fillLight })} />
          <ToggleRow label="Countdown sound" value={settings.sound} onChange={(sound) => update({ sound })} />
          <ToggleRow label="Framing grid" value={settings.grid} onChange={(grid) => update({ grid })} />
          <ToggleRow label="Review each shot" hint="Keep or retake after every photo" value={settings.reviewEachShot} onChange={(reviewEachShot) => update({ reviewEachShot })} />
        </View>
      </ScrollView>

      <View style={{ position: "absolute", left: 22, right: 22, bottom: insets.bottom + 16 }}>
        <Button label="Start session" onPress={start} />
      </View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, marginBottom: 22 }}>
      <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
