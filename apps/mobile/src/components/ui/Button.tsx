import { Pressable, type StyleProp, type ViewStyle, type PressableProps } from "react-native";

import { colors } from "../../theme/tokens";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

const HEIGHT: Record<ButtonVariant, number> = {
  primary: 58,
  secondary: 52,
  ghost: 52,
};

/**
 * Matches the three button treatments used across 02 / 02b (design/PXLPOD
 * App.dc.html):
 *  - primary: solid ink fill, white uppercase bold label ("Allow camera")
 *  - secondary: 1px ink outline, ink uppercase bold label ("Browse without camera")
 *  - ghost: no fill/border, muted semibold label, sentence case ("Not now")
 */
export function Button({ label, variant = "primary", disabled, style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      // Plain array, NOT `({ pressed }) => [...]`. NativeWind's style interop on
      // core components drops a function `style` on this stack — the container
      // styles never paint (see StartSessionHero). Press feedback via the
      // pressed arg is sacrificed to keep every button actually rendering; a
      // dedicated pressed treatment can return later without a function style.
      style={[
        {
          height: HEIGHT[variant],
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : 1,
        },
        variant === "primary" && { backgroundColor: colors.ink },
        variant === "secondary" && { borderWidth: 1, borderColor: colors.ink },
        style,
      ]}
      {...rest}
    >
      <Text
        variant="body"
        weight={variant === "ghost" ? "semibold" : "bold"}
        style={{
          fontSize: variant === "primary" ? 15 : variant === "secondary" ? 13 : 14,
          letterSpacing: variant === "primary" ? 2.1 : variant === "secondary" ? 1.56 : 0,
          textTransform: variant === "ghost" ? "none" : "uppercase",
          color:
            variant === "primary"
              ? colors.surface.DEFAULT
              : variant === "ghost"
                ? colors.muted.DEFAULT
                : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
