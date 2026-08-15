import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useCameraPermission } from "react-native-vision-camera";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Screen, Text } from "../src/components/ui";
import { colors } from "../src/theme";

// 01 Splash (design/PXLPOD App.dc.html)
export default function Splash() {
  const router = useRouter();
  const { hasPermission } = useCameraPermission();
  const [reduceMotion, setReduceMotion] = useState(false);

  const rotation = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [reduceMotion, rotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleStart = () => {
    router.replace(hasPermission ? "/(tabs)" : "/permissions");
  };

  return (
    <Screen backgroundColor={colors.ground}>
      <Pressable
        onPress={handleStart}
        accessibilityRole="button"
        accessibilityLabel="Tap here to start"
        style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 44 }}
      >
        <View style={{ alignItems: "center" }}>
          <Text
            variant="display"
            style={{
              fontSize: 72,
              lineHeight: 62,
              letterSpacing: -1.44,
              color: colors.surface.DEFAULT,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {"PXL\nPOD"}
          </Text>
          {/* Design uses #8C8C84 — nearest token is muted["2"] (#8A8A85). */}
          <Text
            weight="medium"
            style={{
              fontSize: 9,
              letterSpacing: 4.5,
              color: colors.muted["2"],
              marginTop: 6,
            }}
          >
            PHOTOBOOTH
          </Text>
        </View>

        {/* Design uses #2A2A26 for this ring — nearest token is hairline["2"] (#2C2C27). */}
        <View
          style={{
            width: 132,
            height: 132,
            borderRadius: 66,
            borderWidth: 2,
            borderColor: colors.hairline["2"],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -2,
                bottom: -2,
                left: -2,
                right: -2,
                borderRadius: 68,
                borderWidth: 2,
                borderColor: "transparent",
                borderTopColor: colors.amber,
                borderRightColor: colors.amber,
              },
              ringStyle,
            ]}
          />
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.amber,
            }}
          />
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            weight="bold"
            style={{
              fontSize: 15,
              letterSpacing: 2.7,
              textTransform: "uppercase",
              color: colors.surface.DEFAULT,
            }}
          >
            tap here to start
          </Text>
          <View style={{ width: 38, height: 2, backgroundColor: colors.amber }} />
        </View>
      </Pressable>

      {/*
        Design uses #5C5C55 here, which isn't in @poplab/tokens — closest
        available token is faint["2"] (#4A4A44). Flagged in the batch report.
      */}
      <Text
        weight="medium"
        style={{
          paddingBottom: 34,
          textAlign: "center",
          fontSize: 10,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          color: colors.faint["2"],
        }}
      >
        Keep the moment alive
      </Text>
    </Screen>
  );
}
