import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { colors } from "../../theme/tokens";
import { fontFamily, type BodyWeight } from "../../theme/fonts";

export type TextVariant = "display" | "body";

export interface TextProps extends RNTextProps {
  /**
   * `display` renders Archivo Black (headlines). `body` renders Archivo at
   * the given `weight`. Defaults to `body`.
   */
  variant?: TextVariant;
  /** Ignored when `variant="display"` — Archivo Black has no other weights. */
  weight?: BodyWeight;
}

/**
 * Base text primitive. Defaults to ink-on-transparent; screens override
 * `color` via `style` (pulling the value from `theme`, never a raw hex) for
 * cases like white text on the dark splash screen.
 */
export function Text({ variant = "body", weight = "regular", style, ...rest }: TextProps) {
  const family = variant === "display" ? fontFamily.display : fontFamily[weight];

  return <RNText {...rest} style={[{ fontFamily: family, color: colors.ink }, style]} />;
}
