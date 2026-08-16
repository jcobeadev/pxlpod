import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { publicUrl } from "../../../lib/storage";

export const dynamic = "force-dynamic";

/**
 * Public shared-strip page. Anyone with the link sees the strip; RLS exposes
 * only live (non-expired, non-revoked) share links, and the render lives in the
 * public shares bucket. No sign-in (see the middleware allowlist).
 */
export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: link } = await supabase
    .from("share_links")
    .select("render_path, tenant_id, expires_at")
    .eq("slug", slug)
    .maybeSingle();
  if (!link) notFound();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, brand")
    .eq("id", link.tenant_id)
    .maybeSingle();

  const img = publicUrl("shares", link.render_path);
  const name = tenant?.name ?? "Poplab";

  return (
    <main className="min-h-screen bg-[#0e0e0c] text-white flex flex-col items-center px-5 py-10 gap-6">
      <div className="font-display text-2xl uppercase tracking-tight">{name}</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt="Photo strip" className="max-h-[75vh] w-auto shadow-2xl" />
      <a
        href={img}
        download
        className="bg-[#ffb81f] text-[#14140f] font-bold uppercase tracking-wide px-6 py-3"
      >
        Download
      </a>
      <p className="text-[12px] text-white/50 text-center max-w-xs">
        Made at a {name} photobooth. Want us at your event? Ask the booth.
      </p>
    </main>
  );
}
