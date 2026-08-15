import { useEffect } from "react";
import { Stack } from "expo-router";

import { colors } from "../../src/theme";
import { useSession } from "../../src/session/store";

/**
 * The capture flow: 05 Choose a template → 13 Your photos.
 *
 * A headerless stack. Each screen owns its own top chrome (a "Step N of 5"
 * strip, a close button) because the design draws them all differently. The
 * session store is reset when this group unmounts, so backing out of the flow
 * and starting again always begins clean.
 */
export default function SessionLayout() {
  const reset = useSession((s) => s.reset);

  useEffect(() => reset, [reset]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.DEFAULT },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="preview" options={{ presentation: "transparentModal", animation: "fade" }} />
      <Stack.Screen name="setup" />
      {/* Capture runs edge-to-edge on a dark ground and manages its own flow. */}
      <Stack.Screen name="capture" options={{ gestureEnabled: false, contentStyle: { backgroundColor: "#000" } }} />
      <Stack.Screen name="assemble" options={{ gestureEnabled: false }} />
      <Stack.Screen name="effect" />
      <Stack.Screen name="finish" />
      <Stack.Screen name="photos" />
    </Stack>
  );
}
