import { Image, View, type DimensionValue } from "react-native";
import type { Template } from "@poplab/template-spec/schema";

import { colors } from "../../theme/tokens";

export interface TemplateThumbProps {
  spec: Template;
  /** Public URL of the variant's overlay artwork, or null while unresolved. */
  overlayUri: string | null;
  /** Whether this is a dark/black colourway. */
  dark?: boolean;
  width?: DimensionValue;
}

/**
 * A template thumbnail that stays legible on every colourway.
 *
 * The overlay PNGs punch their photo windows out as transparent holes. On a
 * white template that reads fine over a light ground, but a black template's
 * windows would vanish into a black card. So we paint a grey fill at each slot
 * FIRST, then lay the overlay on top — the holes reveal grey "photo goes here"
 * rectangles regardless of the artwork colour.
 *
 * The overlay is drawn `contain` in a box with the canvas's own aspect ratio,
 * so slot positions map to simple percentages of the box.
 */
export function TemplateThumb({ spec, overlayUri, dark = false, width = "100%" }: TemplateThumbProps) {
  const { canvas, slots } = spec;

  return (
    <View
      style={{
        width,
        aspectRatio: canvas.width / canvas.height,
        backgroundColor: dark ? colors.ground : "#ECE8DF",
        borderWidth: 1,
        borderColor: dark ? colors.ground : colors.surface["3"],
        overflow: "hidden",
      }}
    >
      {/* Grey photo-slot fills, behind the artwork. */}
      {slots.map((slot) => (
        <View
          key={slot.id}
          style={{
            position: "absolute",
            left: `${(slot.x / canvas.width) * 100}%`,
            top: `${(slot.y / canvas.height) * 100}%`,
            width: `${(slot.w / canvas.width) * 100}%`,
            height: `${(slot.h / canvas.height) * 100}%`,
            borderRadius: slot.shape === "circle" ? 999 : 2,
            backgroundColor: "#D8D4CB",
          }}
        />
      ))}

      {overlayUri ? (
        <Image source={{ uri: overlayUri }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
      ) : null}
    </View>
  );
}
