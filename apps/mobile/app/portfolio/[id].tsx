import { useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlbumPhotos, useAlbums } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * Portfolio album detail — the published gallery for one past pop-up. A guest
 * lands here from the Home "Portfolio" row. Photos come from `album_photos`
 * (RLS confines the read to published albums), laid out in a two-column grid;
 * tapping one opens it full-screen. This is the operator's proof of work, so it
 * carries their name and a soft Book-us nudge at the end.
 */
export default function AlbumDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();

  const albumsQuery = useAlbums(client, TENANT_ID);
  const photosQuery = useAlbumPhotos(client, id);
  const [zoom, setZoom] = useState<string | null>(null);

  const album = (albumsQuery.data ?? []).find((a) => a.id === id) ?? null;
  const photos = photosQuery.data ?? [];

  const resolve = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );

  const gap = 3;
  const colWidth = (width - gap) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22, color: colors.surface.DEFAULT }}>‹</Text>
        </Pressable>
        <Text weight="bold" style={{ fontSize: 16, color: colors.surface.DEFAULT }} numberOfLines={1}>
          {album?.title ?? "Album"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {photosQuery.isPending ? (
          <Text style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 40 }}>Loading…</Text>
        ) : photos.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 40, paddingHorizontal: 24 }}>
            No photos in this album yet.
          </Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap, paddingHorizontal: 0 }}>
            {photos.map((p) => {
              const ratio = p.width && p.height ? p.height / p.width : 1.5;
              return (
                <Pressable key={p.id} onPress={() => setZoom(resolve(p.path))}>
                  <Image
                    source={{ uri: resolve(p.path) }}
                    style={{ width: colWidth, height: colWidth * ratio, backgroundColor: "#1c1c19" }}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12.5, textAlign: "center", marginTop: 28, paddingHorizontal: 32, lineHeight: 19 }}>
          Want a booth like this at your event? Tap Book us on the home screen.
        </Text>
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
