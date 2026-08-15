import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { PoplabClient } from "../client.ts";
import type { AlbumPhotoRow, AlbumRow } from "../types.ts";

export function albumsQueryKey(tenantId: string) {
  return ["albums", tenantId] as const;
}

export function albumPhotosQueryKey(albumId: string) {
  return ["albumPhotos", albumId] as const;
}

export async function fetchAlbums(
  client: PoplabClient,
  tenantId: string,
): Promise<AlbumRow[]> {
  const { data, error } = await client
    .from("albums")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("sort", { ascending: true });
  if (error) {
    throw error;
  }
  return data ?? [];
}

export function useAlbums(
  client: PoplabClient,
  tenantId: string,
): UseQueryResult<AlbumRow[]> {
  return useQuery({
    queryKey: albumsQueryKey(tenantId),
    queryFn: () => fetchAlbums(client, tenantId),
    enabled: Boolean(tenantId),
  });
}

/**
 * Photos in one album. Keyed on `albumId` alone, not `tenantId`: the
 * `album_photos` table has no `tenant_id` column of its own (only
 * `album_id`), and RLS already confines the read to photos belonging to a
 * published album, so a tenant switch has nothing here to invalidate beyond
 * the album id itself.
 */
export async function fetchAlbumPhotos(
  client: PoplabClient,
  albumId: string,
): Promise<AlbumPhotoRow[]> {
  const { data, error } = await client
    .from("album_photos")
    .select("*")
    .eq("album_id", albumId)
    .order("sort", { ascending: true });
  if (error) {
    throw error;
  }
  return data ?? [];
}

export function useAlbumPhotos(
  client: PoplabClient,
  albumId: string,
): UseQueryResult<AlbumPhotoRow[]> {
  return useQuery({
    queryKey: albumPhotosQueryKey(albumId),
    queryFn: () => fetchAlbumPhotos(client, albumId),
    enabled: Boolean(albumId),
  });
}
