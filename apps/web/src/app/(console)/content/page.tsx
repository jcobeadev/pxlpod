import { requireStaff } from "../../../lib/auth";
import { createClient } from "../../../lib/supabase/server";
import { saveContent } from "./actions";

const BLOCKS = [
  { key: "about", label: "About PXLPOD", hint: "Shown on the app's More screen." },
  { key: "hero", label: "Home hero line", hint: "The tagline under Start session." },
  { key: "messenger", label: "Messenger link", hint: "m.me link for the app's Book Us screen (e.g. https://m.me/YourPage). Leave blank to hide the button." },
];

export default async function ContentPage() {
  const staff = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_content")
    .select("key, value")
    .eq("tenant_id", staff.tenantId);
  const byKey = new Map((data ?? []).map((r) => [r.key, (r.value as { body?: string })?.body ?? ""]));
  const heroStyle = byKey.get("home_hero_video") === "on" ? "on" : "off";

  return (
    <div className="p-8 max-w-2xl">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Content</p>
      <h1 className="font-display text-4xl uppercase mt-1 mb-6">App content</h1>

      <form action={saveContent} className="bg-white border border-[#14140f] p-5 flex flex-col gap-2 mb-5">
        <input type="hidden" name="key" value="home_hero_video" />
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Start-session tile</span>
            <p className="text-[12px] text-[#7a736a] mt-0.5">Show the looping video tile on the app home, or the flat tile.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select name="body" defaultValue={heroStyle} className="border border-[#14140f] px-3 py-2 bg-white text-[14px] outline-none">
              <option value="off">Flat tile</option>
              <option value="on">Video tile</option>
            </select>
            <button type="submit" className="bg-[#14140f] text-white text-[12px] font-bold uppercase tracking-wide px-4 py-2.5">Save</button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-5">
        {BLOCKS.map((b) => (
          <form key={b.key} action={saveContent} className="bg-white border border-[#14140f] p-5 flex flex-col gap-2">
            <input type="hidden" name="key" value={b.key} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">{b.label}</span>
              <button type="submit" className="bg-[#14140f] text-white text-[12px] font-bold uppercase tracking-wide px-4 py-1.5">Save</button>
            </div>
            <p className="text-[12px] text-[#7a736a]">{b.hint}</p>
            <textarea name="body" defaultValue={byKey.get(b.key) ?? ""} rows={4} className="border border-[#14140f] px-3 py-2 bg-white text-[15px] outline-none focus:bg-[#faf9f5]" />
          </form>
        ))}
      </div>
    </div>
  );
}
