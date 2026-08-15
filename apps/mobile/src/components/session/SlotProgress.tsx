import { View } from "react-native";
import type { Template } from "@poplab/template-spec/schema";

import { colors } from "../../theme/tokens";

export interface SlotProgressProps {
  template: Template;
  /** How many shots have been captured so far. */
  filled: number;
  /** Width of the mini-map in px; height follows the canvas aspect. */
  width?: number;
}

/**
 * The corner mini-map on the capture screen (08): a scaled-down diagram of the
 * template with each window shown filled (amber) once its photo is taken and
 * outlined while still pending — so the guest can see the strip building up, the
 * way the reference video does.
 *
 * A window is "filled" when its photoIndex is below the captured count. Several
 * windows can share a photoIndex (a double strip), so they light up together.
 */
export function SlotProgress({ template, filled, width = 74 }: SlotProgressProps) {
  const { canvas, slots } = template;
  const scale = width / canvas.width;
  const height = canvas.height * scale;

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      {slots.map((slot) => {
        const isFilled = slot.photoIndex < filled;
        const isNext = slot.photoIndex === filled;
        return (
          <View
            key={slot.id}
            style={{
              position: "absolute",
              left: slot.x * scale,
              top: slot.y * scale,
              width: slot.w * scale,
              height: slot.h * scale,
              borderRadius: slot.shape === "circle" ? (slot.w * scale) / 2 : 1.5,
              backgroundColor: isFilled ? colors.amber : "rgba(255,255,255,0.10)",
              borderWidth: isNext ? 1.5 : 0,
              borderColor: colors.amber,
            }}
          />
        );
      })}
    </View>
  );
}
