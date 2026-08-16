"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { publicUrl } from "../../../../lib/storage";
import { addAlbumPhoto, deleteAlbumPhoto, setAlbumCover, setAlbumPublished, deleteAlbum } from "../actions";

interface Photo {
  id: string;
  path: string;
}

/**
 * Album editor: uploads photos straight to Storage from the browser (staff
 * write policy scopes the path to the tenant), registers each row via a server
 * action, and manages cover / publish / delete. Uploading from the client keeps
 * large image bytes off the server.
 */
export function AlbumEditor({
  albumId,
  tenantId,
  isPublished,
  coverPath,
  initialPhotos,
}: {
  albumId: string;
  tenantId: string;
  isPublished: boolean;
  coverPath: string | null;
  initialPhotos: Photo[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const onFiles = async (files: FileList) => {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${tenantId}/${albumId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("albums").upload(path, file, {
          contentType: file.type || "image/jpeg",
          upsert: false,
        });
        if (upErr) throw new Error(upErr.message);
        await addAlbumPhoto(albumId, path);
        setPhotos((p) => [...p, { id: `tmp-${path}`, path }]);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => e.target.files && onFiles(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="bg-[#14140f] text-white font-bold uppercase tracking-wide text-[13px] px-4 py-2.5 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload photos"}
        </button>

        <button
          onClick={() => startTransition(() => void setAlbumPublished(albumId, !isPublished))}
          className="border border-[#14140f] font-bold uppercase tracking-wide text-[13px] px-4 py-2.5"
        >
          {isPublished ? "Unpublish" : "Publish"}
        </button>

        <button
          onClick={() => { if (confirm("Delete this album and all its photos?")) void deleteAlbum(albumId); }}
          className="ml-auto border border-[#a33418] text-[#a33418] font-bold uppercase tracking-wide text-[13px] px-4 py-2.5"
        >
          Delete album
        </button>
      </div>

      {error ? <p className="text-[14px] text-[#a33418]">{error}</p> : null}

      {photos.length === 0 ? (
        <p className="text-[#7a736a]">No photos yet. Upload from a pop-up to build the album.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
          {photos.map((photo) => {
            const isCover = coverPath === photo.path;
            return (
              <div key={photo.id} className="relative group border border-[#d8d4ca] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={publicUrl("albums", photo.path)} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-x-0 bottom-0 flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startTransition(() => void setAlbumCover(albumId, photo.path))}
                    className={`flex-1 text-[10px] font-bold uppercase py-1.5 ${isCover ? "bg-[#ffb81f] text-[#14140f]" : "bg-[#14140f] text-white"}`}
                  >
                    {isCover ? "Cover" : "Set cover"}
                  </button>
                  {!photo.id.startsWith("tmp-") ? (
                    <button
                      onClick={() => {
                        setPhotos((p) => p.filter((x) => x.id !== photo.id));
                        startTransition(() => void deleteAlbumPhoto(photo.id, albumId));
                      }}
                      className="px-3 text-[10px] font-bold uppercase py-1.5 bg-[#a33418] text-white"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
                {isCover ? <span className="absolute top-1 left-1 text-[9px] font-bold uppercase bg-[#ffb81f] px-1.5 py-0.5">Cover</span> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
