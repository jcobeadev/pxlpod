import { Image, type ImageStyle, type StyleProp } from "react-native";

// The PXLPOD camera-shutter/aperture mark, used wherever the app shows a camera
// icon (the home header button, the Start-session tile, the camera-permission
// primer). Ships as a black-on-transparent PNG, so it sits cleanly on white or
// amber; pass `tint` (e.g. white) for dark backgrounds.
const SRC = require("../../../assets/pxlpod-camera-icon.png");

export function ShutterMark({
  size = 24,
  tint,
  style,
}: {
  size?: number;
  tint?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={SRC}
      style={[{ width: size, height: size }, tint ? { tintColor: tint } : null, style]}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
