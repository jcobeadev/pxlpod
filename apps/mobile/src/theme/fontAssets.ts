// Font files bundled into the app (apps/mobile/assets/fonts/**) keyed by the
// same local family names declared in ./fonts.ts. Passed straight into
// `useFonts()` from app/_layout.tsx.
//
// Bundled instead of loaded from the Google Fonts CDN (as the design file
// links them) so cold start never flashes fallback type and the booth works
// fully offline at a venue.
import { fontFamily } from "./fonts";

export const fontAssets = {
  [fontFamily.regular]: require("../../assets/fonts/Poppins-Regular.ttf"),
  [fontFamily.medium]: require("../../assets/fonts/Poppins-Medium.ttf"),
  [fontFamily.semibold]: require("../../assets/fonts/Poppins-SemiBold.ttf"),
  [fontFamily.bold]: require("../../assets/fonts/Poppins-Bold.ttf"),
  [fontFamily.display]: require("../../assets/fonts/Anton-Regular.ttf"),
  [fontFamily.subheading]: require("../../assets/fonts/Antonio-SemiBold.ttf"),
} as const;
