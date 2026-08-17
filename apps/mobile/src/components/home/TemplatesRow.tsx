import { Image, Pressable, ScrollView, View } from "react-native";
import type { ValidatedTemplateRow } from "@poplab/api";
import { shotCount } from "@poplab/template-spec/schema";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { HatchPlaceholder } from "./HatchPlaceholder";

const CARD_WIDTH = 118;
// Overlays are 1200x1800 (2:3). Match that so the whole frame shows without
// cropping the branding at the edges.
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.5);

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
        <Text variant="subheading" style={{ fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase" }}>
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
          <Pressable key={template.id} onPress={() => onSelect?.(template)} style={{ width: CARD_WIDTH, gap: 7 }}>
            <TemplateThumb template={template} resolveThumbnail={resolveThumbnail} />
            <View style={{ gap: 1 }}>
              <Text weight="bold" style={{ fontSize: 12 }} numberOfLines={1}>
                {template.name}
              </Text>
              <Text style={{ fontSize: 10.5, color: colors.muted.DEFAULT }} numberOfLines={1}>
                {shotCount(template.spec)} shots
                {template.spec.variants.length > 1 ? ` · ${template.spec.variants.length} colours` : ""}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * The card image.
 *
 * Renders the template's actual overlay artwork — the branded frame the guest
 * ends up holding — over a soft ground. The overlay PNG is opaque where the
 * branding is and transparent where the photos go, so the ground shows through
 * the windows and the card reads as a real blank strip rather than a grey
 * stand-in. An explicit `thumbnail_path` (a fully-composed preview with photos)
 * always wins when one exists; the hatch is only the last resort when a
 * template somehow has neither.
 */
function TemplateThumb({
  template,
  resolveThumbnail,
}: {
  template: ValidatedTemplateRow;
  resolveThumbnail: (path: string) => string;
}) {
  const defaultVariant =
    template.spec.variants.find((variant) => variant.isDefault) ?? template.spec.variants[0];
  const artworkPath = template.thumbnail_path ?? defaultVariant?.overlay ?? null;

  // A black colourway sits on a dark ground so its white frame reads; a white
  // one sits on a warm off-white so its windows have a little life. The label
  // is the reliable signal here — "Black", "White" — falling back to the paper
  // background the spec declares.
  const isDark =
    (defaultVariant?.label ?? "").toLowerCase().includes("black") ||
    template.spec.canvas.background.toLowerCase() < "#888888";
  const ground = isDark ? colors.ground : "#ECE8DF";

  return (
    <View
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundColor: ground,
        borderWidth: 1,
        borderColor: isDark ? colors.ground : colors.surface["3"],
        overflow: "hidden",
      }}
    >
      {artworkPath ? (
        <Image
          source={{ uri: resolveThumbnail(artworkPath) }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      ) : (
        <HatchPlaceholder width={CARD_WIDTH} height={CARD_HEIGHT} tone={isDark ? "dark" : "light"} />
      )}
    </View>
  );
}
