import { View } from "react-native";

import { colors } from "../../theme/tokens";
import { Text } from "./Text";

export type IconName = "home" | "templates" | "myPhotos" | "findUs" | "camera" | "alert";

export interface IconProps {
  name: IconName;
  /** Only meaningful for the tab-bar glyphs (home/templates/myPhotos/findUs). */
  active?: boolean;
  size?: number;
}

/**
 * The design file (design/PXLPOD App.dc.html) renders every tab-bar glyph as
 * an abstract placeholder shape rather than real iconography — a filled vs.
 * outlined square for Home/Templates, an outlined circle for My Photos, an
 * outlined triangle for Find Us. That is reproduced faithfully here: "home"
 * and "templates" are literally the same square shape, only their
 * active/inactive treatment differs, exactly as in 03 Tab shell / 04 Home.
 * A later batch should swap these for real iconography.
 */
export function Icon({ name, active = false, size = 22 }: IconProps) {
  const stroke = active ? colors.ink : colors.faint.DEFAULT;

  switch (name) {
    case "home":
    case "templates":
      return (
        <View
          style={{
            width: size,
            height: size,
            backgroundColor: active ? colors.ink : "transparent",
            borderWidth: active ? 0 : 2,
            borderColor: stroke,
          }}
        />
      );
    case "myPhotos":
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? colors.ink : "transparent",
            borderWidth: active ? 0 : 2,
            borderColor: stroke,
          }}
        />
      );
    case "findUs": {
      const half = size / 2;
      return (
        <View
          style={{
            width: 0,
            height: 0,
            borderLeftWidth: half,
            borderRightWidth: half,
            borderBottomWidth: size * 0.86,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderBottomColor: stroke,
          }}
        />
      );
    }
    case "camera":
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.ink,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: size * 0.38,
              height: size * 0.38,
              borderRadius: (size * 0.38) / 2,
              borderWidth: 3,
              borderColor: colors.amber,
            }}
          />
        </View>
      );
    case "alert":
      return (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.amber,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text variant="display" style={{ fontSize: size * 0.49, lineHeight: size * 0.49 }}>
            !
          </Text>
        </View>
      );
  }
}
