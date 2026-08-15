import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Asset } from "expo-asset";
import { File, Paths } from "expo-file-system";

import { Screen, Text } from "../src/components/ui";
import { colors } from "../src/theme";
import { compose } from "../src/compositor/compose";
import { FILTERS } from "../src/compositor/filters";
import { SPIKE_CASES, loadSpikeTemplate, type SpikeCaseId } from "../src/compositor/spikeFixtures";

/**
 * Spike 2 — the Skia compositor on real hardware.
 *
 * Not a product screen. It exists to answer three questions the laptop cannot:
 * does a 1200x1800 composite render correctly on a device, how long does it
 * take, and does a 2400x3600 digital export survive without an out-of-memory
 * kill. Delete this route once the real capture flow lands.
 */

interface Run {
  label: string;
  ms: number;
  kb: number;
  dimensions: string;
  uri: string;
}

export default function SpikeScreen() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<string>("original");

  const run = useCallback(
    async (caseId: SpikeCaseId, target: "print" | "digital") => {
      setBusy(true);
      setError(null);
      try {
        const spec = SPIKE_CASES[caseId];

        // Resolve bundled assets to local file URIs. In SDK 57 localUri is null
        // until the asset has been downloaded, hence loadAsync over fromModule.
        const photoAssets = await Asset.loadAsync(spec.photos);
        const [overlayAsset] = await Asset.loadAsync(spec.overlay);

        const photos = photoAssets.map((a) => ({
          uri: a.localUri ?? a.uri,
          width: a.width ?? 1126,
          height: a.height ?? 1500,
          // Test frames came off a rear camera, so no selfie flip.
          flipHorizontal: false,
        }));

        const { template, variant } = loadSpikeTemplate(caseId);

        const started = Date.now();
        const result = await compose({
          template,
          variant,
          photos,
          overlayUri: overlayAsset?.localUri ?? overlayAsset?.uri ?? "",
          target,
          filterId,
          tokens: { event_name: "Downtown Night Market", year: "2026" },
        });
        const ms = Date.now() - started;

        const file = new File(Paths.cache, `spike-${caseId}-${target}-${Date.now()}.jpg`);
        file.create();
        file.write(result.bytes);

        setRuns((prev) => [
          {
            label: `${spec.label} · ${target}${filterId !== "original" ? ` · ${filterId}` : ""}`,
            ms,
            kb: Math.round(result.bytes.length / 1024),
            dimensions: `${result.width}x${result.height}`,
            uri: file.uri,
          },
          ...prev,
        ]);
      } catch (e) {
        setError(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
      } finally {
        setBusy(false);
      }
    },
    [filterId],
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Text variant="display" style={{ fontSize: 24, textTransform: "uppercase" }}>
            Compositor spike
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted["2"] }}>
            Renders the real PXLPOD templates through Skia on this device.
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Filter
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setFilterId(f.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: filterId === f.id ? colors.ink : colors.hairline.DEFAULT,
                  backgroundColor: filterId === f.id ? colors.ink : "transparent",
                }}
              >
                <Text style={{ fontSize: 12, color: filterId === f.id ? colors.surface.DEFAULT : colors.ink }}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <Text weight="bold" style={{ fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase" }}>
            Render
          </Text>
          {(Object.keys(SPIKE_CASES) as SpikeCaseId[]).map((id) => (
            <View key={id} style={{ flexDirection: "row", gap: 8 }}>
              {(["print", "digital"] as const).map((target) => (
                <Pressable
                  key={target}
                  disabled={busy}
                  onPress={() => run(id, target)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    alignItems: "center",
                    backgroundColor: busy ? colors.muted["2"] : colors.ink,
                  }}
                >
                  <Text style={{ color: colors.surface.DEFAULT, fontSize: 12 }}>
                    {SPIKE_CASES[id].label} · {target}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {busy ? <Text style={{ color: colors.amber }}>Rendering…</Text> : null}

        {error ? (
          <View style={{ borderWidth: 1, borderColor: "#A33418", padding: 12 }}>
            <Text style={{ color: "#A33418", fontSize: 12 }}>{error}</Text>
          </View>
        ) : null}

        {runs.map((r, i) => (
          <View key={`${r.uri}-${i}`} style={{ gap: 8, borderTopWidth: 1, borderTopColor: colors.hairline.DEFAULT, paddingTop: 14 }}>
            <Text weight="bold" style={{ fontSize: 13 }}>{r.label}</Text>
            <Text style={{ fontSize: 12, color: colors.muted["2"] }}>
              {r.ms} ms · {r.dimensions} · {r.kb} KB
            </Text>
            <Image
              source={{ uri: r.uri }}
              style={{ width: "100%", aspectRatio: 2 / 3, backgroundColor: colors.surface["2"] }}
              resizeMode="contain"
            />
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
