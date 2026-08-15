import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";

import { Screen, Text, Button } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { useSession } from "../../src/session/store";
import { useComposite } from "../../src/session/useComposite";

/**
 * 10 Assembling. The gate between capture and the effect picker: it runs the
 * first real compose (via useComposite) and shows the "Building your strip…"
 * beat, then hands off to 11 Choose an effect once the preview is ready.
 *
 * The privacy line the design insists on is here verbatim — the strip is built
 * on the device and nothing is uploaded to do it.
 */
export default function AssembleScreen() {
  const router = useRouter();
  const template = useSession((s) => s.template);
  const photos = useSession((s) => s.photos);
  const shotCount = useSession((s) => s.shotCount());
  const { uri, isComposing, error } = useComposite();

  // A floor on how long the building state shows, so a fast compose doesn't
  // flash past — the beat reads as "we made something", not a stutter.
  const [minElapsed, setMinElapsed] = useState(false);
  const routed = useRef(false);

  useEffect(() => {
    if (!template || photos.length < shotCount) {
      router.replace("/session");
    }
  }, [template, photos.length, shotCount, router]);

  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (routed.current) return;
    if (uri && !isComposing && minElapsed) {
      routed.current = true;
      router.replace("/session/effect");
    }
  }, [uri, isComposing, minElapsed, router]);

  return (
    <Screen backgroundColor={colors.surface.DEFAULT}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 22 }}>
        {error ? (
          <>
            <Text variant="display" style={{ fontSize: 22, textAlign: "center" }}>
              Couldn&apos;t build your strip
            </Text>
            <Text style={{ color: colors.muted.DEFAULT, fontSize: 13, textAlign: "center" }}>{error}</Text>
            <Button label="Retake" variant="secondary" onPress={() => router.replace("/session/capture")} />
          </>
        ) : (
          <>
            {/* Indeterminate amber sweep. */}
            <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 5, borderColor: colors.surface["3"], borderTopColor: colors.amber }} />
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text variant="display" style={{ fontSize: 22 }}>
                Building your strip…
              </Text>
              <Text weight="bold" style={{ fontSize: 10.5, letterSpacing: 1.6, color: colors.muted.DEFAULT }}>
                {shotCount} WINDOWS · ALL ON THIS DEVICE
              </Text>
            </View>
            <Text style={{ fontSize: 12.5, color: colors.faint.DEFAULT, textAlign: "center" }}>
              Nothing is uploaded while we build.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}
