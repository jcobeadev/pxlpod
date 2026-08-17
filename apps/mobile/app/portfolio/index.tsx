import { useCallback, useMemo, useState } from "react";
import { Image, Modal, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePublishedPhotos, type AlbumPhotoRow } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

const H_PAD = 12;
const GAP = 8;
const COLS = 2;

/**
 * Portfolio gallery — every photo across the operator's published albums,
 * reached from the Home marquee's "See all". A two-column masonry (Unsplash
 * style): fixed column width, each photo's height from its own aspect ratio, so
 * nothing is cropped. Tapping a photo opens it full-screen.
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

  const colW = (width - H_PAD * 2 - GAP * (COLS - 1)) / COLS;

  // Balance photos into columns by running height (shortest column wins), each
  // photo sized to its own aspect ratio — the masonry look.
  const columns = useMemo(() => {
    const cols: { photo: AlbumPhotoRow; h: number }[][] = Array.from({ length: COLS }, () => []);
    const heights = new Array<number>(COLS).fill(0);
    for (const p of photos) {
      const aspect = p.width && p.height ? p.height / p.width : 1.4;
      const h = Math.round(colW * aspect);
      let t = 0;
      let min = heights[0]!;
      for (let i = 1; i < COLS; i++) {
        const hi = heights[i]!;
        if (hi < min) {
          min = hi;
          t = i;
        }
      }
      cols[t]!.push({ photo: p, h });
      heights[t] = heights[t]! + h + GAP;
    }
    return cols;
  }, [photos, colW]);

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
          <View style={{ flexDirection: "row", paddingHorizontal: H_PAD, gap: GAP }}>
            {columns.map((col, ci) => (
              <View key={ci} style={{ flex: 1, gap: GAP }}>
                {col.map(({ photo, h }) => (
                  <Pressable key={photo.id} onPress={() => setZoom(resolveFull(photo.path))}>
                    <Image
                      source={{ uri: resolveThumb(photo.path) }}
                      style={{ width: "100%", height: h, backgroundColor: colors.surface["3"] }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ))}
              </View>
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
