import { Platform, View, type DimensionValue } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";

// Design uses #EFEFEC for every skeleton block — nearest token is surface["2"] (#E8E8E5).
const SKELETON_COLOR = colors.surface["2"];

function Bar({ width, height }: { width: DimensionValue; height: DimensionValue }) {
  return <View style={{ width, height, backgroundColor: SKELETON_COLOR }} />;
}

/** 04b Home loading. */
export function HomeLoading() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 22, paddingTop: 8, gap: 20 }}>
      <Bar width="100%" height={48} />

      <View
        style={{
          height: 104,
          backgroundColor: colors.ink,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
        }}
      >
        <Text
          variant="display"
          style={{ fontSize: 30, lineHeight: 30, color: colors.surface.DEFAULT, textTransform: "uppercase" }}
        >
          {"Start\nsession"}
        </Text>
        <View style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: colors.amber }} />
      </View>

      <View style={{ gap: 10 }}>
        <Bar width={120} height={12} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Bar width={110} height={150} />
          <Bar width={110} height={150} />
          <Bar width={110} height={150} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Bar width={150} height={12} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <Bar width={84} height={126} />
          <Bar width={84} height={126} />
          <Bar width={84} height={126} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Bar width={140} height={12} />
        <Bar width="100%" height={110} />
      </View>

      <Text
        weight="bold"
        style={{
          fontSize: 11,
          letterSpacing: 1.1,
          textAlign: "center",
          color: colors.faint.DEFAULT,
          fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
        }}
      >
        LOADING EVENTS &amp; TEMPLATES…
      </Text>
    </View>
  );
}
