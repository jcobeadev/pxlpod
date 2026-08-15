import { Image, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { shotCount, type Variant } from "@poplab/template-spec/schema";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { overlayUriFor } from "../../src/session/overlay";
import { useSession } from "../../src/session/store";
import { usePoplabClient } from "../_layout";

/**
 * 06 Template preview — a bottom sheet over a scrim (presented as a transparent
 * modal by the session layout). Confirms the layout, shot count, ratio, whether
 * it prints tonight, and the colourway, then commits into setup.
 */
export default function TemplatePreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();

  const template = useSession((s) => s.template);
  const variant = useSession((s) => s.variant);
  const chooseVariant = useSession((s) => s.chooseVariant);

  if (!template) {
    router.replace("/session");
    return null;
  }

  const active = variant ?? template.spec.variants[0];
  const uri = active ? overlayUriFor(client, active) : null;
  const isDark = (active?.label ?? "").toLowerCase().includes("black");
  const ratio = template.spec.slots[0] ? template.spec.slots[0].w / template.spec.slots[0].h : 1;

  const rows: { label: string; value: string }[] = [
    { label: "Shots", value: String(shotCount(template.spec)) },
    { label: "Photo ratio", value: ratioLabel(ratio) },
    { label: "Printable", value: template.spec.printable ? "Yes · tonight" : "No" },
  ];

  return (
    <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,20,15,0.55)" }}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} accessibilityLabel="Dismiss" />

      <View style={{ backgroundColor: colors.surface.DEFAULT, paddingHorizontal: 22, paddingTop: 18, paddingBottom: insets.bottom + 20, gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 18 }}>
          <View style={{ width: 104, aspectRatio: 2 / 3, backgroundColor: isDark ? colors.ground : "#ECE8DF", borderWidth: 1, borderColor: isDark ? colors.ground : colors.surface["3"] }}>
            {uri ? <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" /> : null}
          </View>

          <View style={{ flex: 1, gap: 10, paddingTop: 4 }}>
            <Text variant="display" style={{ fontSize: 24, textTransform: "uppercase", lineHeight: 25 }}>
              {template.name}
            </Text>
            {rows.map((r) => (
              <View key={r.label} style={{ flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.surface["4"], paddingBottom: 6 }}>
                <Text style={{ fontSize: 13, color: colors.muted.DEFAULT }}>{r.label}</Text>
                <Text weight="semibold" style={{ fontSize: 13 }}>{r.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {template.spec.variants.length > 1 ? (
          <View style={{ gap: 8 }}>
            <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
              Colourway
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {template.spec.variants.map((v: Variant) => {
                const on = v.id === active?.id;
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => chooseVariant(v)}
                    style={{ paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: colors.ink, backgroundColor: on ? colors.ink : "transparent" }}
                  >
                    <Text weight="semibold" style={{ fontSize: 13, color: on ? colors.surface.DEFAULT : colors.ink }}>{v.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        <Button label="Use this template" onPress={() => router.push("/session/setup")} />
      </View>
    </View>
  );
}

function ratioLabel(r: number): string {
  // Nearest common photo ratio.
  const options: [string, number][] = [["4 : 3", 4 / 3], ["3 : 4", 3 / 4], ["1 : 1", 1], ["16 : 9", 16 / 9], ["9 : 16", 9 / 16]];
  return options.reduce((best, o) => (Math.abs(o[1] - r) < Math.abs(best[1] - r) ? o : best))[0];
}
