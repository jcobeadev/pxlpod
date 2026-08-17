import { Text as RNText, type TextProps as RNTextProps } from "react-native";

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

  return <RNText {...rest} style={[{ fontFamily: family, color: colors.ink }, style]} />;
}
