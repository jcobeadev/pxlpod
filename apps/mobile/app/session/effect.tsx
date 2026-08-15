import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { FILTERS } from "../../src/compositor/filters";
import { useSession } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";

/** 11 Choose an effect. */
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20 }}>‹</Text>
        </Pressable>
        <Text variant="display" style={{ fontSize: 30, textTransform: "uppercase", marginTop: 6 }}>
          Choose an effect
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 16 }}>
        <View style={{ height: "88%", aspectRatio: 2 / 3, backgroundColor: colors.surface["2"], borderWidth: 1, borderColor: colors.surface["3"] }}>
          {uri ? (
            <Image source={{ uri }} style={{ width: "100%", height: "100%", opacity: isComposing ? 0.6 : 1 }} resizeMode="contain" />
          ) : (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.muted.DEFAULT, fontSize: 13 }}>{isComposing ? "Rendering…" : "No preview"}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 22, paddingVertical: 10 }}>
        {filters.map((f) => {
          const on = f.id === filterId;
          return (
            <Pressable key={f.id} onPress={() => setFilter(f.id)} style={{ alignItems: "center", gap: 6 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: on ? colors.ink : colors.surface["2"], borderWidth: on ? 0 : 1, borderColor: colors.surface["3"], alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? colors.amber : colors.surface["3"] }} />
              </View>
              <Text weight={on ? "bold" : "regular"} style={{ fontSize: 11, color: on ? colors.ink : colors.muted.DEFAULT }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {template.spec.variants.length > 1 ? (
        <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 22, paddingBottom: 8 }}>
          {template.spec.variants.map((v) => {
            const on = v.id === (variant ?? template.spec.variants[0])?.id;
            return (
              <Pressable key={v.id} onPress={() => chooseVariant(v)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: colors.ink, backgroundColor: on ? colors.ink : "transparent" }}>
                <Text weight="semibold" style={{ fontSize: 12, color: on ? colors.surface.DEFAULT : colors.ink }}>{v.label} paper</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 16, paddingTop: 6 }}>
        <Button label="Continue" onPress={() => router.push("/session/finish")} />
      </View>
    </View>
  );
}
