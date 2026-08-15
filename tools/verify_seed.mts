/**
 * End-to-end check of everything Phase 00 built.
 *
 * Reads the templates back the way the app will — anonymous key, RLS in force,
 * no service role — then validates each stored spec against the zod schema the
 * three renderers import. If this passes, the artwork, the detector, the
 * database and the contract all agree.
 *
 *   node tools/verify_seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import {
  TemplateSchema,
  shotCount,
  aspectForPhoto,
  slotsForPhoto,
} from "../packages/template-spec/src/schema.ts";

const URL = "https://plvosxnepmhbamjpjoxr.supabase.co";
const ANON = "sb_publishable_n8VTW5AZeQ1f3DlYOeEplg_Qr3_VOLV";

const db = createClient(URL, ANON);
let failures = 0;

const { data: rows, error } = await db
  .from("templates")
  .select("id, name, category, shot_count, status, spec")
  .order("name");

if (error) {
  console.error("read failed:", error.message);
  process.exit(1);
}

console.log(`anon read: ${rows!.length} published templates\n`);

for (const row of rows!) {
  const parsed = TemplateSchema.safeParse(row.spec);
  if (!parsed.success) {
    failures++;
    console.log(`FAIL  ${row.name}`);
    for (const issue of parsed.error.issues) {
      console.log(`        ${issue.path.join(".") || "(root)"}: ${issue.message}`);
    }
    continue;
  }

  const t = parsed.data;
  const shots = shotCount(t);

  // The denormalised column must match what the spec actually implies.
  if (shots !== row.shot_count) {
    failures++;
    console.log(`FAIL  ${row.name}: shot_count column says ${row.shot_count}, spec implies ${shots}`);
    continue;
  }

  const aspects = Array.from({ length: shots }, (_, i) => {
    const n = slotsForPhoto(t, i).length;
    return `${aspectForPhoto(t, i).toFixed(2)}${n > 1 ? `x${n}` : ""}`;
  });

  console.log(
    `ok    ${t.name.padEnd(14)} ${String(t.slots.length).padStart(2)} windows  ` +
      `${shots} shots  ${t.canvas.width}x${t.canvas.height}  ` +
      `${t.slots[0]!.shape.padEnd(6)} aspect ${aspects.join(" ")}`,
  );
}

// The double strip must reuse shots across windows, or the cut-apart strips
// would show eight different photos instead of two identical columns.
const dbl = rows!.find((r) => r.name === "Double strip");
if (dbl) {
  const t = TemplateSchema.parse(dbl.spec);
  const reused = t.slots.length > shotCount(t);
  console.log(`\ndouble strip reuses shots across windows: ${reused ? "yes" : "NO — would print 8 different photos"}`);
  if (!reused) failures++;
}

// Drafts and other tenants must stay invisible to this key.
const { count } = await db
  .from("templates")
  .select("id", { count: "exact", head: true })
  .eq("status", "draft");
console.log(`drafts visible to anon: ${count ?? 0}${(count ?? 0) === 0 ? " (correct)" : " — LEAK"}`);
if ((count ?? 0) > 0) failures++;

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
