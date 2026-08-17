// Local font-family keys registered with `expo-font`'s `useFonts()` in
// app/_layout.tsx, and referenced directly by `src/components/ui/Text.tsx`.
//
// Type system (as of the store-prep pass):
//   - headings   -> Anton     (variant="display")
//   - subheadings-> Antonio   (variant="subheading")
//   - body text  -> Poppins   (variant="body" + weight)
//
// Each weight is registered as its own distinct family name rather than one
// family + a `fontWeight` style. React Native on Android does not resolve
// font weights for custom (non-system) fonts at all, and iOS only does it
// when every weight is registered under the exact same family name in the
// font's own metadata — brittle to rely on across a design-token pipeline.
// Explicit per-weight families work identically on both platforms.
export const fontFamily = {
  /** Anton — used for all display/headline text. */
  display: "Anton",
  /** Antonio — used for subheadings / section labels. */
  subheading: "Antonio",
  /** Poppins Regular (400). */
  regular: "Poppins-Regular",
  /** Poppins Medium (500). */
  medium: "Poppins-Medium",
  /** Poppins SemiBold (600). */
  semibold: "Poppins-SemiBold",
  /** Poppins Bold (700). */
  bold: "Poppins-Bold",
} as const;

export type FontFamilyKey = keyof typeof fontFamily;
/** Body weights only — excludes the display/subheading display faces. */
export type BodyWeight = "regular" | "medium" | "semibold" | "bold";
