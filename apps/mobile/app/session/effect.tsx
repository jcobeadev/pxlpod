import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Segmented } from "../../src/components/session/controls";
import { FILTERS } from "../../src/compositor/filters";
import { useSession } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";

/** 11 Choose an effect — big preview up top, paper + filters docked below. */
export default function ChooseEffect() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const template = useSession((s) => s.template);
  const filterId = useSession((s) => s.filterId);
  const setFilter = useSession((s) => s.setFilter);
  const variant = useSession((s) => s.variant);
  const chooseVariant = useSession((s) => s.chooseVariant);
  const { uri, isComposing } = useComposite();

  if (!template) {
    router.replace("/session");
    return null;
  }

  const allowed = template.spec.capture.allowedFilters;
  const filters = allowed.length === 0 ? FILTERS : FILTERS.filter((f) => allowed.includes(f.id));
  const activeVariant = variant ?? template.spec.variants[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 22, paddingTop: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>‹</Text>
        </Pressable>
        <Text variant="display" style={{ fontSize: 22, textTransform: "uppercase" }}>Choose an effect</Text>
      </View>

      {/* Big preview — takes all the space between header and the docked controls. */}
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
      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 12, gap: 14 }}>
        {/* Paper colourway — aligned, equal-width segments. */}
        {template.spec.variants.length > 1 ? (
          <Segmented
            stretch
            options={template.spec.variants.map((v) => ({ label: `${v.label} paper`, value: v.id }))}
            value={activeVariant?.id ?? ""}
            onChange={(id) => {
              const v = template.spec.variants.find((x) => x.id === id);
              if (v) chooseVariant(v);
            }}
          />
        ) : null}

        {/* Filters row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
          {filters.map((f) => {
            const on = f.id === filterId;
            return (
              <Pressable key={f.id} onPress={() => setFilter(f.id)} style={{ alignItems: "center", gap: 6, width: 58 }}>
                <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: on ? colors.ink : colors.surface["2"], borderWidth: on ? 0 : 1, borderColor: colors.surface["3"], alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? colors.amber : colors.surface["3"] }} />
                </View>
                <Text weight={on ? "bold" : "regular"} style={{ fontSize: 11, color: on ? colors.ink : colors.muted.DEFAULT }} numberOfLines={1}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Button label="Continue" onPress={() => router.push("/session/finish")} />
      </View>
    </View>
  );
}
