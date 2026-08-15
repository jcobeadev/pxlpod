import { Pressable, View } from "react-native";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { RecentStripsRow } from "./RecentStripsRow";
import { StartSessionHero } from "./StartSessionHero";

export interface HomeOfflineProps {
  onRetry: () => void;
}

/**
 * 04c Home offline. Reached when every core Home read (live event, templates,
 * upcoming/past events) fails — there's no NetInfo-style connectivity
 * dependency installed in this monorepo to distinguish "no internet" from
 * some other fetch failure, so any all-queries-failed state is treated as
 * offline, which is the only such screen the design provides. The "PXLPOD ·
 * Offline" strip the design draws above its own custom header is rendered
 * here as the top of the scrollable body instead, since the shared
 * `ShellHeader` in (tabs)/_layout.tsx is out of scope for this batch.
 */
export function HomeOffline({ onRetry }: HomeOfflineProps) {
  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          backgroundColor: colors.ink,
          paddingVertical: 10,
          paddingHorizontal: 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View style={{ width: 8, height: 8, backgroundColor: colors.amber }} />
        <Text
          weight="bold"
          style={{ fontSize: 11, letterSpacing: 1.32, textTransform: "uppercase", color: colors.surface.DEFAULT }}
        >
          Offline · showing saved content
        </Text>
      </View>

      <View style={{ paddingTop: 8, gap: 20 }}>
        <StartSessionHero />

        <Text style={{ marginHorizontal: 22, fontSize: 13, lineHeight: 19.5, color: colors.faint["2"] }}>
          Shooting works offline. Templates you&apos;ve used before are cached — sharing and printing resume when
          you&apos;re back on data.
        </Text>

        <RecentStripsRow />

        <View
          style={{ marginHorizontal: 22, borderWidth: 1, borderColor: colors.surface["4"], padding: 18, gap: 10 }}
        >
          <Text
            weight="bold"
            style={{ fontSize: 12, letterSpacing: 1.44, textTransform: "uppercase", color: colors.muted.DEFAULT }}
          >
            Unavailable offline
          </Text>
          <Text weight="medium" style={{ fontSize: 13, color: colors.faint.DEFAULT }}>
            Live pop-up banner · Upcoming events · New templates · Portfolio
          </Text>
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Retry"
            style={({ pressed }) => ({
              height: 44,
              borderWidth: 1,
              borderColor: colors.ink,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text weight="bold" style={{ fontSize: 12, letterSpacing: 1.44, textTransform: "uppercase" }}>
              Retry
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
