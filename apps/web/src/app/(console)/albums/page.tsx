import Link from "next/link";
import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { publicUrl } from "../../../lib/storage";
import { createAlbum } from "./actions";

export default async function AlbumsPage() {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("id, title, cover_path, is_published, album_photos(count)")
    .eq("tenant_id", staff.tenantId)
    .order("sort", { ascending: true });

  return (
    <div className="p-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Portfolio</p>
          <h1 className="font-display text-4xl uppercase mt-1">Albums</h1>
        </div>
        <form action={createAlbum} className="flex gap-2">
          <input name="title" placeholder="New album title" className="border border-[#14140f] px-3 py-2 bg-white text-[14px]" />
          <button type="submit" className="bg-[#14140f] text-white font-bold uppercase tracking-wide text-[13px] px-4 py-2">+ Create</button>
        </form>
      </div>

      {(albums ?? []).length === 0 ? (
        <p className="text-[#7a736a]">No albums yet. Create one to publish photos from a pop-up.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
          {(albums ?? []).map((a) => {
            const count = (a.album_photos as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <Link key={a.id} href={`/albums/${a.id}`} className="bg-white border border-[#14140f] p-3 flex flex-col gap-2 hover:shadow-[4px_4px_0_#14140f] transition-shadow">
                <div className="aspect-[4/3] bg-[#e8e8e5] overflow-hidden">
                  {a.cover_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={publicUrl("albums", a.cover_path)} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{a.title}</p>
                    <p className="text-[12px] text-[#7a736a]">{count} photos</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${a.is_published ? "bg-[#e4f0e8] text-[#2e7d52]" : "bg-[#e8e8e5] text-[#7a736a]"}`}>
                    {a.is_published ? "Live" : "Draft"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
