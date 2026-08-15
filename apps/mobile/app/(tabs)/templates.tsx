import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import { useTemplates, type ValidatedTemplateRow } from "@poplab/api";
import { shotCount } from "@poplab/template-spec/schema";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { TemplateThumb } from "../../src/components/session/TemplateThumb";
import { overlayUriFor } from "../../src/session/overlay";
import { useSession } from "../../src/session/store";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * 19 Template gallery — everything this operator has published, and the reason
 * to open the app when you weren't already shooting. Tapping a template drops
 * straight into its preview with the session pre-seeded.
 */
export default function TemplatesTab() {
  const router = useRouter();
  const client = usePoplabClient();
  const chooseTemplate = useSession((s) => s.chooseTemplate);
  const { data, isPending, isError, refetch } = useTemplates(client, TENANT_ID);

  const open = (t: ValidatedTemplateRow) => {
    chooseTemplate(t);
    router.push("/session/preview");
  };

  const templates = data ?? [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: colors.muted.DEFAULT, marginLeft: 6, marginBottom: 12 }}>
        All templates
      </Text>

      {isPending ? (
        <Note>Loading templates…</Note>
      ) : isError ? (
        <Pressable onPress={() => void refetch()}><Note>Couldn&apos;t load — tap to retry.</Note></Pressable>
      ) : templates.length === 0 ? (
        <Note>No templates published yet.</Note>
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 20 }}>
          {templates.map((t) => {
            const variant = t.spec.variants.find((v) => v.isDefault) ?? t.spec.variants[0];
            const isDark = (variant?.label ?? "").toLowerCase().includes("black");
            return (
              <Pressable key={t.id} onPress={() => open(t)} style={{ width: "47%", gap: 8 }}>
                <TemplateThumb spec={t.spec} overlayUri={variant ? overlayUriFor(client, variant) : null} dark={isDark} />
                <View style={{ gap: 1 }}>
                  <Text weight="bold" style={{ fontSize: 14 }} numberOfLines={1}>{t.name}</Text>
                  <Text style={{ fontSize: 11.5, color: colors.muted.DEFAULT }}>{shotCount(t.spec)} shots · {t.spec.variants.length} colours</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ padding: 40, alignItems: "center" }}>
      <Text style={{ color: colors.muted.DEFAULT }}>{children}</Text>
    </View>
  );
}
