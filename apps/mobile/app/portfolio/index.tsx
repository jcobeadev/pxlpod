import { useMemo } from "react";
import { Image, Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlbums } from "@poplab/api";

import { Text } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { HatchPlaceholder } from "../../src/components/home/HatchPlaceholder";
import { usePoplabClient } from "../_layout";

const TENANT_ID = process.env.EXPO_PUBLIC_TENANT_ID ?? "";

/**
 * Portfolio gallery — every published album, reached from the Home carousel's
 * "See all". A two-column grid of album covers; tap opens the album's photos.
 */
export default function PortfolioIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const client = usePoplabClient();
  const { width } = useWindowDimensions();

  const albumsQuery = useAlbums(client, TENANT_ID);
  const albums = (albumsQuery.data ?? []).filter((a) => a.is_published);

  const resolveCover = useMemo(
    () => (path: string) => client.storage.from("albums").getPublicUrl(path).data.publicUrl,
    [client],
  );

  const gap = 12;
  const colWidth = (width - 22 * 2 - gap) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface.DEFAULT, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 18, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text variant="display" style={{ fontSize: 24, textTransform: "uppercase" }}>Portfolio</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: insets.bottom + 32, paddingTop: 8 }}>
        {albumsQuery.isPending ? (
          <Text style={{ color: colors.muted.DEFAULT, textAlign: "center", marginTop: 40 }}>Loading…</Text>
        ) : albums.length === 0 ? (
          <Text style={{ color: colors.muted.DEFAULT, textAlign: "center", marginTop: 40 }}>No albums published yet.</Text>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap }}>
            {albums.map((album) => (
              <Pressable key={album.id} onPress={() => router.push(`/portfolio/${album.id}`)} style={{ width: colWidth, gap: 6 }}>
                {album.cover_path ? (
                  <Image source={{ uri: resolveCover(album.cover_path) }} style={{ width: colWidth, height: colWidth * 1.25 }} resizeMode="cover" />
                ) : (
                  <HatchPlaceholder width={colWidth} height={colWidth * 1.25} />
                )}
                <Text weight="bold" style={{ fontSize: 13 }} numberOfLines={1}>{album.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
