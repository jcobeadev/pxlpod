import type { ViewStyle } from "react-native";
import { Canvas, Group, Rect, RoundedRect } from "@shopify/react-native-skia";

import { colors } from "../../theme/tokens";

export type HatchTone = "light" | "dark";

export interface HatchPlaceholderProps {
  width: number;
  height: number;
  tone?: HatchTone;
  /** Draws the swatch as a circle instead of a rect (the fish-eye template's window shape). */
  round?: boolean;
  style?: ViewStyle;
}

const STEP = 12;
const STRIPE_WIDTH = 6;

// design/PXLPOD App.dc.html stands in for every real photo/thumbnail/cover
// with `repeating-linear-gradient(45deg, colorA 0 6px, colorB 6px 12px)` —
// used for template thumbnails, "your recent strips", and event covers alike.
// None of that artwork exists yet (thumbnail_path/cover_path are null on
// every seeded row), so this reproduces the same 45° two-tone hatch as the
// stand-in, via Skia (already linked — see Icon.tsx for why not react-native-svg).
export function HatchPlaceholder({ width, height, tone = "light", round = false, style }: HatchPlaceholderProps) {
  const base = tone === "light" ? colors.surface["3"] : colors.hairline["2"];
  const stripe = tone === "light" ? colors.surface["2"] : colors.hairline.DEFAULT;

  const cx = width / 2;
  const cy = height / 2;
  const halfSpan = Math.sqrt(width * width + height * height) / 2 + STRIPE_WIDTH;
  const bandCount = Math.ceil((halfSpan * 2) / STEP) + 2;
  const bands = Array.from({ length: bandCount }, (_, i) => cx - halfSpan + i * STEP);

  return (
    <Canvas
      style={[{ width, height, borderRadius: round ? width / 2 : 0, overflow: "hidden" }, style]}
    >
      <RoundedRect x={0} y={0} width={width} height={height} r={round ? width / 2 : 0} color={base} />
      <Group transform={[{ rotate: Math.PI / 4 }]} origin={{ x: cx, y: cy }} clip={{ x: 0, y: 0, width, height }}>
        {bands.map((x) => (
          <Rect key={x} x={x} y={cy - halfSpan} width={STRIPE_WIDTH} height={halfSpan * 2} color={stripe} />
        ))}
      </Group>
    </Canvas>
  );
}
