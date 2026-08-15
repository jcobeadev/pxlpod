import { Pressable, View } from "react-native";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName, Text } from "../../src/components/ui";
import { colors } from "../../src/theme";

// 03 Tab shell (design/PXLPOD App.dc.html) — header + content area + tab bar.
// 04 Home was read for confirmation only: its tab bar is identical to 03's,
// but Home's own header replaces the generic one below — that's next batch's
// job, this batch just needs the shared shell + placeholder tab bodies.

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: "Home", icon: "home" },
  templates: { label: "Templates", icon: "templates" },
  "my-photos": { label: "My Photos", icon: "myPhotos" },
  "find-us": { label: "Find Us", icon: "findUs" },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <ShellHeader />,
      }}
      tabBar={(props) => <ShellTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="templates" options={{ title: "Templates" }} />
      <Tabs.Screen name="my-photos" options={{ title: "My Photos" }} />
      <Tabs.Screen name="find-us" options={{ title: "Find Us" }} />
    </Tabs>
  );
}

function ShellHeader() {
  // The design canvas draws each screen at a flat 390x844 with no status bar, so
  // its 58px header height is the bar BELOW the inset, not the total. Without
  // adding insets.top the wordmark lands on top of the clock and the two round
  // buttons sit over the wifi and battery icons.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        height: 58 + insets.top,
        paddingTop: insets.top,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 22,
        borderBottomWidth: 1,
        // Design uses #EDEDE9 — nearest token is surface["2"] (#E8E8E5).
        borderBottomColor: colors.surface["2"],
        backgroundColor: colors.surface.DEFAULT,
      }}
    >
      <Text
        variant="display"
        style={{ fontSize: 20, letterSpacing: -0.2, textTransform: "uppercase" }}
      >
        PXLPOD
      </Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: colors.ink,
          }}
        />
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1,
            borderColor: colors.ink,
          }}
        />
      </View>
    </View>
  );
}

function ShellTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const bottomPadding = Math.max(10, insets.bottom);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48 + bottomPadding,
        paddingHorizontal: 8,
        paddingBottom: bottomPadding,
        borderTopWidth: 1,
        // Design uses #E4E4E1 — nearest token is surface["4"] (#E6E6E1).
        borderTopColor: colors.surface["4"],
        backgroundColor: colors.surface.DEFAULT,
      }}
    >
      {state.routes.map((route, index) => {
        const meta = TAB_META[route.name];
        if (!meta) return null;

        const focused = state.index === index;
        const title = descriptors[route.key]?.options.title;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={title ?? meta.label}
            style={{ flex: 1, alignItems: "center", gap: 6 }}
          >
            <Icon name={meta.icon} active={focused} size={22} />
            <Text
              weight={focused ? "bold" : "semibold"}
              style={{
                fontSize: 10,
                letterSpacing: focused ? 0.6 : 0,
                color: focused ? colors.ink : colors.muted["2"],
              }}
            >
              {meta.label}
            </Text>
            <View
              style={{
                width: 16,
                height: 3,
                backgroundColor: focused ? colors.amber : "transparent",
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
