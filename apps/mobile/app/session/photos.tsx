import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Segmented } from "../../src/components/session/controls";
import { useSession, type OutputKind } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";

/** 13 Your photos — the last stop before sharing (delivery isn't built yet). */
export default function YourPhotos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const template = useSession((s) => s.template);
  const outputKind = useSession((s) => s.outputKind);
  const setOutputKind = useSession((s) => s.setOutputKind);
  const { uri, isComposing } = useComposite();

  if (!template) {
    router.replace("/session");
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="display" style={{ fontSize: 30, textTransform: "uppercase" }}>Your photos</Text>
        <Pressable onPress={() => router.replace("/session/capture")} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Retake</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12 }}>
        <View style={{ height: "84%", aspectRatio: 2 / 3, backgroundColor: colors.surface["2"], borderWidth: 1, borderColor: colors.surface["3"] }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: "100%", opacity: isComposing ? 0.6 : 1 }} resizeMode="contain" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.muted.DEFAULT, fontSize: 13 }}>{isComposing ? "Rendering…" : "No preview"}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ alignItems: "center", paddingBottom: 10 }}>
        <Segmented
          options={[{ label: "Photo", value: "photo" }, { label: "GIF", value: "gif" }, { label: "Boomerang", value: "boomerang" }] as { label: string; value: OutputKind }[]}
          value={outputKind}
          onChange={setOutputKind}
        />
        {outputKind !== "photo" ? (
          <Text style={{ fontSize: 11.5, color: colors.muted.DEFAULT, marginTop: 8 }}>Motion export lands with the encoder — showing the still for now.</Text>
        ) : null}
      </View>

      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 12, gap: 8 }}>
        <Button
          label="Continue to sharing"
          onPress={() => {
            // TODO: delivery flow (14 Delivery hub) — not built yet.
          }}
        />
        <Text style={{ fontSize: 12, color: colors.faint.DEFAULT, textAlign: "center" }}>
          Saved on this device · not uploaded
        </Text>
      </View>
    </View>
  );
}
