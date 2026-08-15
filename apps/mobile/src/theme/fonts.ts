// Local font-family keys registered with `expo-font`'s `useFonts()` in
// app/_layout.tsx, and referenced directly by `src/components/ui/Text.tsx`.
//
// Each weight is registered as its own distinct family name rather than one
// family + a `fontWeight` style. React Native on Android does not resolve
// font weights for custom (non-system) fonts at all, and iOS only does it
// when every weight is registered under the exact same family name in the
// font's own metadata — brittle to rely on across a design-token pipeline.
// Explicit per-weight families work identically on both platforms.
export const fontFamily = {
  /** Archivo Black — used for all display/headline text. */
  display: "Archivo-Black",
  /** Archivo Regular (400). */
  regular: "Archivo-Regular",
  /** Archivo Medium (500). */
  medium: "Archivo-Medium",
  /** Archivo SemiBold (600). */
  semibold: "Archivo-SemiBold",
  /** Archivo Bold (700). */
  bold: "Archivo-Bold",
} as const;

export type FontFamilyKey = keyof typeof fontFamily;
export type BodyWeight = Exclude<FontFamilyKey, "display">;
