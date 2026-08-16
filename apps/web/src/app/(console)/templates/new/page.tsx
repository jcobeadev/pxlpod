"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/client";
import { detectSlots } from "../../../../lib/detect-slots";
import { createTemplate } from "./actions";

const PRESET_CATEGORIES = ["strip", "combo", "classic", "fisheye"];

/**
 * New template from artwork: upload an overlay PNG (with transparent photo
 * windows), auto-detect the windows, and create a draft. The heavy lifting
 * (upload, alpha detection) runs in the browser; the server assembles and
 * validates the final spec.
 */
export default function NewTemplatePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strip");
  const [shots, setShots] = useState(4);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [detected, setDetected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve the tenant id once (needed for the storage path).
  const ensureTenant = async (): Promise<string> => {
    if (tenantId) return tenantId;
    const supabase = createClient();
    const { data: user } = await supabase.auth.getUser();
    const { data: staff } = await supabase.from("staff").select("tenant_id").eq("user_id", user.user!.id).eq("status", "active").limit(1).single();
    setTenantId(staff!.tenant_id);
    return staff!.tenant_id;
  };

  const onFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setDetected(null);
    if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
  };

  const onCreate = async () => {
    if (!file) {
      setError("Choose an overlay PNG first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const tid = await ensureTenant();
      const supabase = createClient();

      const slug = (name || "template").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "template";
      const overlayPath = `${tid}/${slug}-${Date.now().toString(36)}/original.png`;
      const { error: upErr } = await supabase.storage.from("overlays").upload(overlayPath, file, { contentType: "image/png", upsert: false });
      if (upErr) throw new Error(upErr.message);

      // Detect from the local object URL (fast, no round trip).
      const { width, height, slots } = await detectSlots(preview!);
      setDetected(slots.length);
      if (slots.length === 0) throw new Error("No transparent photo windows found in this artwork.");

      // A session can only capture 1–8 shots, but a template may have far more
      // windows (a keychain sheet repeats a few shots many times). Cycle the
      // windows through `shots` photos so the distinct count stays valid; the
      // operator refines the exact mapping per-window in the editor.
      const nShots = Math.min(Math.max(shots, 1), Math.min(8, slots.length));

      const res = await createTemplate({
        name: name || "Untitled template",
        category,
        overlayPath,
        canvas: { width, height },
        slots: slots.map((s, i) => ({ id: s.id, photoIndex: i % nShots, x: s.x, y: s.y, w: s.w, h: s.h, shape: s.shape })),
      });
      if (res && !res.ok) throw new Error(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create template");
      setBusy(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <Link href="/templates" className="text-[12px] font-bold uppercase tracking-wide text-[#7a736a]">← Templates</Link>
      <h1 className="font-display text-4xl uppercase mt-2 mb-6">New template</h1>

      <div className="flex flex-col gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a] mb-2">Overlay artwork (PNG with transparent windows)</p>
          <input ref={fileRef} type="file" accept="image/png" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <div className="flex items-start gap-4">
            <button onClick={() => fileRef.current?.click()} className="border border-[#14140f] px-4 py-2.5 font-bold uppercase text-[13px] tracking-wide">
              Choose PNG
            </button>
            {preview ? (
              <div className="w-28 border border-[#14140f] bg-[#ece8df]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="w-full object-contain" />
              </div>
            ) : null}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="border border-[#14140f] px-3 py-2.5 bg-white" placeholder="Single strip" />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Category</span>
            <input
              list="category-presets"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-[#14140f] px-3 py-2.5 bg-white w-48"
              placeholder="strip, keychain…"
            />
            <datalist id="category-presets">
              {PRESET_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <span className="text-[11px] text-[#7a736a]">Type your own to add a new one.</span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Shots</span>
            <input
              type="number"
              min={1}
              max={8}
              value={shots}
              onChange={(e) => setShots(Number(e.target.value))}
              className="border border-[#14140f] px-3 py-2.5 bg-white w-24"
            />
            <span className="text-[11px] text-[#7a736a]">Photos per session (1–8). Extra windows repeat these.</span>
          </label>
        </div>

        {detected !== null ? <p className="text-[13px] text-[#8a570d]">Detected {detected} windows.</p> : null}
        {error ? <p className="text-[14px] text-[#a33418] font-semibold border border-[#a33418] bg-[#f7e6e0] px-4 py-3">{error}</p> : null}

        <button onClick={onCreate} disabled={busy} className="bg-[#14140f] text-white font-bold uppercase tracking-wide py-3 disabled:opacity-50 self-start px-6">
          {busy ? "Analyzing…" : "Analyze & create"}
        </button>
      </div>
    </div>
  );
}
