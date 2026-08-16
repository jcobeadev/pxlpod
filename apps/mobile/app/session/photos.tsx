import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Segmented } from "../../src/components/session/controls";
import { useSession, type OutputKind } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";

/** 13 Your photos — the last stop before delivery. */
export default function YourPhotos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const template = useSession((s) => s.template);
  const outputKind = useSession((s) => s.outputKind);
  const setOutputKind = useSession((s) => s.setOutputKind);
  const clearPhotos = useSession((s) => s.clearPhotos);
  const { uri, isComposing } = useComposite();

  // Retake means shoot the whole strip again — clear the frames first, or
  // capture sees a full set and bounces straight back to assembling.
  const onRetake = () => {
    clearPhotos();
    router.replace("/session/capture");
  };

  if (!template) {
    router.replace("/session");
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text variant="display" style={{ fontSize: 24, textTransform: "uppercase" }}>Your photos</Text>
        <Pressable onPress={onRetake} hitSlop={10}>
          <Text weight="bold" style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: colors.muted.DEFAULT }}>Retake</Text>
        </Pressable>
      </View>

      {/* Big preview */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
        <View style={{ flex: 1, aspectRatio: template.spec.canvas.width / template.spec.canvas.height, backgroundColor: colors.surface["2"], borderWidth: 1, borderColor: colors.surface["3"] }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: "100%", opacity: isComposing ? 0.6 : 1 }} resizeMode="contain" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.muted.DEFAULT, fontSize: 13 }}>{isComposing ? "Rendering…" : "No preview"}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Docked controls */}
      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 12, gap: 12 }}>
        <Segmented
          stretch
          options={[
            { label: "Photo", value: "photo" },
            { label: "GIF", value: "gif" },
            { label: "Boomerang", value: "boomerang" },
          ] as { label: string; value: OutputKind }[]}
          value={outputKind}
          onChange={setOutputKind}
        />
        {outputKind !== "photo" ? (
          <Text style={{ fontSize: 11.5, color: colors.muted.DEFAULT, textAlign: "center" }}>
            Motion export lands with the encoder — showing the still for now.
          </Text>
        ) : null}

        <Button label="Continue to sharing" onPress={() => router.push("/session/delivery")} />
        <Text style={{ fontSize: 12, color: colors.faint.DEFAULT, textAlign: "center" }}>
          Saved on this device · not uploaded
        </Text>
      </View>
    </View>
  );
}
