import { View } from "react-native";
import { Canvas, Circle, Group, Path, RoundedRect } from "@shopify/react-native-skia";

import { colors } from "../../theme/tokens";
import { Text } from "./Text";

export type IconName = "home" | "templates" | "myPhotos" | "findUs" | "camera" | "alert";

export interface IconProps {
  name: IconName;
  /** Only meaningful for the tab-bar glyphs (home/templates/myPhotos/findUs). */
  active?: boolean;
  size?: number;
}

// Tab-bar glyphs, drawn on a 24x24 grid and scaled to `size`.
//
// The design file (design/PXLPOD App.dc.html) draws every tab-bar icon as an
// abstract placeholder (filled/outlined square, outlined circle, outlined
// triangle) rather than real iconography, so there is no pixel spec to trace
// here — these are hand-drawn glyphs that read clearly at 22px and keep the
// filled-when-active / stroked-when-inactive language the placeholders used.
//
// react-native-svg is listed in the design brief as "already a dependency"
// but is not actually installed anywhere in this monorepo (only referenced
// as an *optional* peer dep of nativewind's css-interop) and has no native
// module linked into the dev client already running on the user's phone —
// adding it would need a native rebuild, which this batch is expressly
// forbidden from triggering. @shopify/react-native-skia IS already linked
// (it drives the compositor), so these glyphs are drawn with Skia instead.
const GLYPH_BOX = 24;

// House silhouette: roof apex -> right eave -> bottom-right -> bottom-left -> left eave.
const HOME_BODY = "M12 2 L22 11 L22 22 L2 22 L2 11 Z";
const HOME_DOOR = "M9.5 22 L9.5 15.5 L14.5 15.5 L14.5 22 Z";

// Classic map pin: rounded head over a point.
const PIN_BODY = "M12 22C12 22 20 14.8 20 9A8 8 0 1 0 4 9C4 14.8 12 22 12 22Z";

function HomeGlyph({ color, filled }: { color: string; filled: boolean }) {
  return (
    <>
      <Path
        path={HOME_BODY}
        color={color}
        style={filled ? "fill" : "stroke"}
        strokeWidth={2}
        strokeJoin="round"
      />
      <Path
        path={HOME_DOOR}
        color={filled ? colors.surface.DEFAULT : color}
        style={filled ? "fill" : "stroke"}
        strokeWidth={1.5}
      />
    </>
  );
}

function TemplatesGlyph({ color, filled }: { color: string; filled: boolean }) {
  const cells: Array<[number, number]> = [
    [2.5, 2.5],
    [13, 2.5],
    [2.5, 13],
    [13, 13],
  ];
  return (
    <>
      {cells.map(([x, y]) => (
        <RoundedRect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={8.5}
          height={8.5}
          r={2}
          color={color}
          style={filled ? "fill" : "stroke"}
          strokeWidth={2}
        />
      ))}
    </>
  );
}

function MyPhotosGlyph({ color, filled }: { color: string; filled: boolean }) {
  const holeColor = filled ? colors.surface.DEFAULT : color;
  return (
    <>
      <RoundedRect
        x={2}
        y={7}
        width={20}
        height={13}
        r={3}
        color={color}
        style={filled ? "fill" : "stroke"}
        strokeWidth={2}
      />
      <RoundedRect
        x={8}
        y={4}
        width={8}
        height={4}
        r={1.2}
        color={color}
        style={filled ? "fill" : "stroke"}
        strokeWidth={2}
      />
      <Circle
        cx={12}
        cy={13.5}
        r={4.2}
        color={holeColor}
        style={filled ? "fill" : "stroke"}
        strokeWidth={1.6}
      />
      {filled ? <Circle cx={12} cy={13.5} r={2} color={color} style="fill" /> : null}
    </>
  );
}

function FindUsGlyph({ color, filled }: { color: string; filled: boolean }) {
  const holeColor = filled ? colors.surface.DEFAULT : color;
  return (
    <>
      <Path
        path={PIN_BODY}
        color={color}
        style={filled ? "fill" : "stroke"}
        strokeWidth={1.8}
        strokeJoin="round"
      />
      <Circle
        cx={12}
        cy={9}
        r={3.1}
        color={holeColor}
        style={filled ? "fill" : "stroke"}
        strokeWidth={1.4}
      />
    </>
  );
}

function TabGlyph({
  name,
  active,
  size,
}: {
  name: "home" | "templates" | "myPhotos" | "findUs";
  active: boolean;
  size: number;
}) {
  const color = active ? colors.ink : (colors.muted["2"] ?? colors.muted.DEFAULT);
  const scale = size / GLYPH_BOX;

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale }]}>
        {name === "home" && <HomeGlyph color={color} filled={active} />}
        {name === "templates" && <TemplatesGlyph color={color} filled={active} />}
        {name === "myPhotos" && <MyPhotosGlyph color={color} filled={active} />}
        {name === "findUs" && <FindUsGlyph color={color} filled={active} />}
      </Group>
    </Canvas>
  );
}

export function Icon({ name, active = false, size = 22 }: IconProps) {
  switch (name) {
    case "home":
    case "templates":
    case "myPhotos":
    case "findUs":
      return <TabGlyph name={name} active={active} size={size} />;
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
