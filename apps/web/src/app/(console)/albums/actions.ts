"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";

export async function createAlbum(formData: FormData) {
  const staff = await requireStaff();
  const supabase = await createClient();
  const title = ((formData.get("title") as string) || "").trim() || "Untitled album";
  const { data, error } = await supabase
    .from("albums")
    .insert({ tenant_id: staff.tenantId, title, is_published: false })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/albums/${data.id}`);
}

export async function setAlbumPublished(id: string, published: boolean) {
  const supabase = await createClient();
  await supabase.from("albums").update({ is_published: published }).eq("id", id);
  revalidatePath(`/albums/${id}`);
  revalidatePath("/albums");
}

export async function setAlbumCover(id: string, coverPath: string) {
  const supabase = await createClient();
  await supabase.from("albums").update({ cover_path: coverPath }).eq("id", id);
  revalidatePath(`/albums/${id}`);
  revalidatePath("/albums");
}

export async function deleteAlbum(id: string) {
  const supabase = await createClient();
  await supabase.from("albums").delete().eq("id", id);
  revalidatePath("/albums");
  redirect("/albums");
}

/** Register an uploaded photo (the file is already in Storage by this point). */
export async function addAlbumPhoto(albumId: string, path: string, width?: number, height?: number) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("album_photos").select("sort").eq("album_id", albumId).order("sort", { ascending: false }).limit(1);
  const sort = (existing?.[0]?.sort ?? -1) + 1;
  await supabase.from("album_photos").insert({ album_id: albumId, path, width: width ?? null, height: height ?? null, sort });
  revalidatePath(`/albums/${albumId}`);
}

export async function deleteAlbumPhoto(photoId: string, albumId: string) {
  const supabase = await createClient();
  await supabase.from("album_photos").delete().eq("id", photoId);
  revalidatePath(`/albums/${albumId}`);
}
