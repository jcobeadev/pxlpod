import { useCallback, useMemo, useState } from "react";
import { Image, Modal, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePublishedPhotos } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * Portfolio gallery — every photo across the operator's published albums,
 * reached from the Home marquee's "See all". A three-column grid; tapping a
 * photo opens it full-screen.
 */
export default function PortfolioIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();
  const { width } = useWindowDimensions();

  const photosQuery = usePublishedPhotos(client, TENANT_ID);
  const photos = photosQuery.data ?? [];
  const [zoom, setZoom] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await photosQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [photosQuery]);

  // Grid shows a small, fast transform; tapping opens the full-resolution image.
  const resolveThumb = useMemo(
    () => (path: string) =>
      client.storage.from("albums").getPublicUrl(path, { transform: { width: 400, quality: 60 } }).data.publicUrl,
    [client],
  );
  const resolveFull = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );

  const gap = 3;
  const cols = 3;
  const size = (width - gap * (cols - 1)) / cols;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text variant="display" style={{ fontSize: 24, textTransform: "uppercase" }}>Portfolio</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} />}
      >
        {photosQuery.isPending ? (
          <Text style={{ color: colors.muted.DEFAULT, textAlign: "center", marginTop: 40 }}>Loading…</Text>
        ) : photos.length === 0 ? (
          <Text style={{ color: colors.muted.DEFAULT, textAlign: "center", marginTop: 40 }}>No photos published yet.</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => setZoom(resolveFull(p.path))}>
                <Image source={{ uri: resolveThumb(p.path) }} style={{ width: size, height: size, backgroundColor: colors.surface["3"] }} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={zoom !== null} transparent animationType="fade" onRequestClose={() => setZoom(null)}>
        <Pressable
          onPress={() => setZoom(null)}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: 16 }}
        >
          {zoom ? <Image source={{ uri: zoom }} style={{ width: "100%", height: "80%" }} resizeMode="contain" /> : null}
          <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 16, fontSize: 13 }}>Tap to close</Text>
        </Pressable>
      </Modal>
    </View>
  );
}
