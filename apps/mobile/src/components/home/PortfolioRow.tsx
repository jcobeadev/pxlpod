import { Image, Pressable, ScrollView, View } from "react-native";
import type { AlbumRow } from "@poplab/api";

import { Text } from "../ui";
import { colors } from "../../theme/tokens";
import { HatchPlaceholder } from "./HatchPlaceholder";

const CARD_WIDTH = 164;
const CARD_HEIGHT = 200;

export interface PortfolioRowProps {
  albums: AlbumRow[];
  /** Resolves an album's `cover_path` (in the `albums` bucket) to a loadable URL. */
  resolveCover: (path: string) => string;
  onOpen: (albumId: string) => void;
}

/**
 * "Portfolio" — the operator's published galleries from past pop-ups. These are
 * the curated albums built in the console (Albums), and they are the app's proof
 * of what a booth looks like. Hidden entirely when the tenant has published no
 * albums yet, so an empty carousel never shows.
 */
export function PortfolioRow({ albums, resolveCover, onOpen }: PortfolioRowProps) {
  if (albums.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 22 }}>
        <Text weight="bold" style={{ fontSize: 12, letterSpacing: 2.16, textTransform: "uppercase" }}>
          Portfolio
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 22 }}
      >
        {albums.map((album) => (
          <Pressable
            key={album.id}
            onPress={() => onOpen(album.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open album ${album.title}`}
            style={{ width: CARD_WIDTH, gap: 8 }}
          >
            {album.cover_path ? (
              <Image
                source={{ uri: resolveCover(album.cover_path) }}
                style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
                resizeMode="cover"
              />
            ) : (
              <HatchPlaceholder width={CARD_WIDTH} height={CARD_HEIGHT} />
            )}
            <Text weight="bold" style={{ fontSize: 13, color: colors.ink }} numberOfLines={1}>
              {album.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
