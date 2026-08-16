import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "../../../../lib/auth";
import { createClient } from "../../../../lib/supabase/server";
import { AlbumEditor } from "./album-editor";

export default async function AlbumDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: album } = await supabase
    .from("albums")
    .select("id, title, is_published, cover_path")
    .eq("id", id)
    .eq("tenant_id", staff.tenantId)
    .maybeSingle();
  if (!album) notFound();

  const { data: photos } = await supabase
    .from("album_photos")
    .select("id, path")
    .eq("album_id", id)
    .order("sort", { ascending: true });

  return (
    <div className="p-8">
      <Link href="/albums" className="text-[12px] font-bold uppercase tracking-wide text-[#7a736a]">← Albums</Link>
      <div className="flex items-center gap-3 mt-2 mb-6">
        <h1 className="font-display text-4xl uppercase">{album.title}</h1>
        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${album.is_published ? "bg-[#e4f0e8] text-[#2e7d52]" : "bg-[#e8e8e5] text-[#7a736a]"}`}>
          {album.is_published ? "Live" : "Draft"}
        </span>
      </div>
      <AlbumEditor
        albumId={album.id}
        tenantId={staff.tenantId}
        isPublished={album.is_published}
        coverPath={album.cover_path}
        initialPhotos={photos ?? []}
      />
    </div>
  );
}
