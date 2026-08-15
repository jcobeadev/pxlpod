import { Image, Pressable, ScrollView, View } from "react-native";
import type { ValidatedTemplateRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { HatchPlaceholder } from "./HatchPlaceholder";

const CARD_WIDTH = 110;
const CARD_HEIGHT = 150;

export interface TemplatesRowProps {
  templates: ValidatedTemplateRow[];
  /** Resolves a template's `thumbnail_path` (in the `overlays` bucket) to a loadable URL. */
  resolveThumbnail: (path: string) => string;
  onSeeAll?: () => void;
  onSelect?: (template: ValidatedTemplateRow) => void;
}

/**
 * "Newly added" (04 Home). Every seeded template currently has a null
 * `thumbnail_path`, so the illustrative art the design draws per template
 * (a stacked strip / a 2x2 grid / two fish-eye circles) is reproduced with
 * `HatchPlaceholder` keyed off `category`, matching the mock's three example
 * cards — a real `thumbnail_path` always wins over the placeholder.
 */
export function TemplatesRow({ templates, resolveThumbnail, onSeeAll, onSelect }: TemplatesRowProps) {
  if (templates.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 22, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Newly added
        </Text>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text
            weight="semibold"
            style={{ fontSize: 11, letterSpacing: 1.1, textTransform: "uppercase", color: colors.muted.DEFAULT }}
          >
            See all
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}
      >
        {templates.map((template) => (
          <Pressable key={template.id} onPress={() => onSelect?.(template)} style={{ width: CARD_WIDTH, gap: 6 }}>
            <TemplateThumb template={template} resolveThumbnail={resolveThumbnail} />
            <Text weight="bold" style={{ fontSize: 11 }} numberOfLines={1}>
              {template.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function TemplateThumb({
  template,
  resolveThumbnail,
}: {
  template: ValidatedTemplateRow;
  resolveThumbnail: (path: string) => string;
}) {
  if (template.thumbnail_path) {
    return (
      <Image
        source={{ uri: resolveThumbnail(template.thumbnail_path) }}
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          borderWidth: 1,
          borderColor: colors.surface["3"],
        }}
        resizeMode="cover"
      />
    );
  }

  const dark = template.category === "combo";

  if (template.category === "fisheye") {
    return (
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: colors.surface.DEFAULT,
          borderWidth: 1,
          borderColor: colors.surface["3"],
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <HatchPlaceholder width={56} height={56} round />
        <HatchPlaceholder width={56} height={56} round />
      </View>
    );
  }

  if (template.category === "strip") {
    // Two columns of two — a small nod to "printed twice, cut down the middle".
    return (
      <View
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor: colors.surface.DEFAULT,
          borderWidth: 1,
          borderColor: colors.surface["3"],
          padding: 7,
          flexDirection: "row",
          gap: 5,
        }}
      >
        {[0, 1].map((col) => (
          <View key={col} style={{ flex: 1, gap: 5 }}>
            <HatchPlaceholder width={40} height={64} />
            <HatchPlaceholder width={40} height={64} />
          </View>
        ))}
      </View>
    );
  }

  // classic / anything else: a single stacked strip.
  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: dark ? colors.ground : colors.surface.DEFAULT,
        borderWidth: dark ? 0 : 1,
        borderColor: colors.surface["3"],
        padding: 7,
        gap: 5,
      }}
    >
      {[0, 1, 2].map((row) => (
        <HatchPlaceholder key={row} width={94} height={38} tone={dark ? "dark" : "light"} />
      ))}
      <Text
        weight="semibold"
        style={{ fontSize: 6, letterSpacing: 1.2, textAlign: "center", color: dark ? colors.surface.DEFAULT : colors.ink }}
      >
        PXLPOD
      </Text>
    </View>
  );
}
