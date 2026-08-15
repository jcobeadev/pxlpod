import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTemplates, type ValidatedTemplateRow } from "@poplab/api";
import { shotCount } from "@poplab/template-spec/schema";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { Chip } from "../../src/components/session/controls";
import { TemplateThumb } from "../../src/components/session/TemplateThumb";
import { overlayUriFor } from "../../src/session/overlay";
import { useSession } from "../../src/session/store";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Strips", value: "strip" },
  { label: "Combos", value: "combo" },
  { label: "Fish-eye", value: "fisheye" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

/** 05 Choose a template. */
export default function ChooseTemplate() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();
  const chooseTemplate = useSession((s) => s.chooseTemplate);

  const [filter, setFilter] = useState<FilterValue>("all");
  const { data, isPending, isError, refetch } = useTemplates(client, TENANT_ID);

  const templates = useMemo(
    () => (data ?? []).filter((t) => filter === "all" || t.category === filter),
    [data, filter],
  );

  const onPick = (t: ValidatedTemplateRow) => {
    chooseTemplate(t);
    router.push("/session/preview");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 22, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: colors.muted.DEFAULT }}>
          Step 1 of 5
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 20, color: colors.ink }}>✕</Text>
        </Pressable>
      </View>

      <Text variant="display" style={{ fontSize: 32, textTransform: "uppercase", paddingHorizontal: 22, marginBottom: 14 }}>
        {"Choose a\ntemplate"}
      </Text>

      {/* Fixed-height wrapper: a bare horizontal ScrollView in a flex column
          stretches to fill the screen and drags the chips into tall pills. */}
      <View style={{ height: 44, marginBottom: 14 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 22, alignItems: "center" }}>
          {FILTERS.map((f) => (
            <Chip key={f.value} label={f.label} active={filter === f.value} onPress={() => setFilter(f.value)} />
          ))}
        </ScrollView>
      </View>

      {isPending ? (
        <Centered><Text style={{ color: colors.muted.DEFAULT }}>Loading templates…</Text></Centered>
      ) : isError ? (
        <Centered>
          <Text style={{ color: colors.muted.DEFAULT, marginBottom: 12 }}>Couldn&apos;t load templates.</Text>
          <Pressable onPress={() => void refetch()} style={{ borderWidth: 1, borderColor: colors.ink, paddingHorizontal: 18, paddingVertical: 10 }}>
            <Text weight="bold" style={{ fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>Retry</Text>
          </Pressable>
        </Centered>
      ) : templates.length === 0 ? (
        <Centered><Text style={{ color: colors.muted.DEFAULT }}>Nothing in this category yet.</Text></Centered>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 24 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 20 }}>
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} client={client} onPress={() => onPick(t)} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>{children}</View>;
}

function TemplateCard({
  template,
  client,
  onPress,
}: {
  template: ValidatedTemplateRow;
  client: ReturnType<typeof usePoplabClient>;
  onPress: () => void;
}) {
  const variant = template.spec.variants.find((v) => v.isDefault) ?? template.spec.variants[0];
  const isDark = (variant?.label ?? "").toLowerCase().includes("black");
  const uri = variant ? overlayUriFor(client, variant) : null;

  return (
    <Pressable onPress={onPress} style={{ width: "47%", gap: 8 }}>
      <TemplateThumb spec={template.spec} overlayUri={uri} dark={isDark} />
      <View style={{ gap: 1 }}>
        <Text weight="bold" style={{ fontSize: 14 }} numberOfLines={1}>{template.name}</Text>
        <Text style={{ fontSize: 11.5, color: colors.muted.DEFAULT }} numberOfLines={1}>
          {shotCount(template.spec)} shots · {template.spec.variants.length} colours
        </Text>
      </View>
    </Pressable>
  );
}
