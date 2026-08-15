import { View } from "react-native";

import { Text } from "./ui";
import { colors } from "../theme";

/**
 * Centred placeholder body for a tab screen that hasn't been built yet.
 * Each of the four tabs gets its real screen in a later batch — this batch
 * only needs the shell (header + tab bar) they live inside.
 */
export function TabPlaceholder({ label }: { label: string }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface.DEFAULT,
      }}
    >
      <Text variant="body" weight="semibold" style={{ fontSize: 14, color: colors.muted.DEFAULT }}>
        {label}
      </Text>
    </View>
  );
}
