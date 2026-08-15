import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors } from "../../theme/tokens";

export interface ScreenProps {
  children: ReactNode;
  /** Safe-area edges to inset. Defaults to all four. */
  edges?: readonly Edge[];
  /** Background colour — pass a value from `theme`, e.g. `colors.ground`. */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_EDGES: readonly Edge[] = ["top", "bottom", "left", "right"];

/** Full-bleed safe-area wrapper every top-level screen renders into. */
export function Screen({
  children,
  edges = DEFAULT_EDGES,
  backgroundColor = colors.surface.DEFAULT,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges as Edge[]} style={[{ flex: 1, backgroundColor }, style]}>
      {children}
    </SafeAreaView>
  );
}
