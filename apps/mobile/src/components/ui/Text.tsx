import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors } from "../../theme/tokens";
import { fontFamily, type BodyWeight } from "../../theme/fonts";

export type TextVariant = "display" | "subheading" | "body";

export interface TextProps extends RNTextProps {
  /**
   * `display` renders Anton (headlines). `subheading` renders Antonio (section
   * labels / secondary headers). `body` renders Poppins at the given `weight`.
   * Defaults to `body`.
   */
  variant?: TextVariant;
  /** Only applies to `variant="body"` — Anton/Antonio have a single weight. */
  weight?: BodyWeight;
}

// Anton (display) has very tall caps. When a caller sets `lineHeight` ≈
// `fontSize` — which the original layout did, tuned for Archivo Black — the caps
// clip at the top ("START" → "STARI"). Force a line box tall enough to clear
// them, overriding any tight per-call lineHeight but keeping a taller one.
const DISPLAY_LINE_HEIGHT_RATIO = 1.32;

/**
 * Base text primitive. Defaults to ink-on-transparent; screens override
 * `color` via `style` (pulling the value from `theme`, never a raw hex) for
 * cases like white text on the dark splash screen.
 */
export function Text({ variant = "body", weight = "regular", style, ...rest }: TextProps) {
  const family =
    variant === "display"
      ? fontFamily.display
      : variant === "subheading"
        ? fontFamily.subheading
        : fontFamily[weight];

  if (variant === "display") {
    const flat = StyleSheet.flatten(style) as { fontSize?: number; lineHeight?: number } | undefined;
    const fontSize = flat?.fontSize ?? 17;
    const lineHeight = Math.max(Math.ceil(fontSize * DISPLAY_LINE_HEIGHT_RATIO), flat?.lineHeight ?? 0);
    return <RNText {...rest} style={[{ fontFamily: family, color: colors.ink }, style, { lineHeight }]} />;
  }

  return <RNText {...rest} style={[{ fontFamily: family, color: colors.ink }, style]} />;
}
