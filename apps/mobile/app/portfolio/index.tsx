import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, Pressable, RefreshControl, ScrollView, useWindowDimensions, View } from "react-native";
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

/** One full-screen page in the swipe viewer, with a spinner until it loads. */
function ViewerImage({ uri, width, height, onClose }: { uri: string; width: number; height: number; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  return (
    <Pressable onPress={onClose} style={{ width, height, alignItems: "center", justifyContent: "center" }}>
      <Image
        source={{ uri }}
        style={{ width, height: height * 0.85 }}
        resizeMode="contain"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading ? <ActivityIndicator size="large" color="#fff" style={{ position: "absolute" }} /> : null}
    </Pressable>
  );
}

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
  const { width, height } = useWindowDimensions();

  const photosQuery = usePublishedPhotos(client, TENANT_ID);
  const photos = photosQuery.data ?? [];
  // Index into `photos` of the photo open in the full-screen viewer (or null).
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
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
  // resize:"contain" preserves the whole image + aspect ratio (and EXIF).
  const resolveThumb = useMemo(
    () => (path: string) =>
      client.storage
        .from("albums")
        .getPublicUrl(path, { transform: { width: 800, height: 800, resize: "contain", quality: 60 } }).data.publicUrl,
    [client],
  );
  const resolveFull = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );

  // Warm the cache: prefetch the full-resolution photos in the background so the
  // viewer opens instantly and re-opens are fast. Image.prefetch checks the
  // cache first, so repeat visits don't re-download.
  useEffect(() => {
    for (const p of photos) void Image.prefetch(resolveFull(p.path)).catch(() => {});
  }, [photos, resolveFull]);

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
                  <Pressable key={photo.id} onPress={() => setViewerIndex(photos.findIndex((x) => x.id === photo.id))}>
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

      <Modal visible={viewerIndex !== null} transparent animationType="fade" onRequestClose={() => setViewerIndex(null)}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={viewerIndex ?? 0}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <ViewerImage uri={resolveFull(item.path)} width={width} height={height} onClose={() => setViewerIndex(null)} />
            )}
          />
          <Pressable
            onPress={() => setViewerIndex(null)}
            style={{ position: "absolute", top: insets.top + 8, right: 18 }}
            hitSlop={12}
          >
            <Text style={{ color: "#fff", fontSize: 22 }}>✕</Text>
          </Pressable>
          <Text style={{ position: "absolute", bottom: insets.bottom + 20, alignSelf: "center", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            Swipe ‹ › · tap to close
          </Text>
        </View>
      </Modal>
    </View>
  );
}
