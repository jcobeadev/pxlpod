/**
 * RLS isolation check, run as a real anonymous guest.
 *
 * Enabling anonymous sign-in means guests now carry the `authenticated` role,
 * so every policy written `to authenticated` applies to them too. The design
 * survives that only because each such policy keys off staff membership or
 * `created_by` rather than merely being signed in — this asserts it rather
 * than trusting it.
 *
 *   node tools/verify_rls.mts
 */
import { createClient } from "@supabase/supabase-js";

const URL = "https://plvosxnepmhbamjpjoxr.supabase.co";
const ANON = "sb_publishable_n8VTW5AZeQ1f3DlYOeEplg_Qr3_VOLV";

const db = createClient(URL, ANON, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: signIn, error: authErr } = await db.auth.signInAnonymously();
if (authErr || !signIn.user) {
  console.error("could not sign in anonymously:", authErr?.message);
  process.exit(1);
}
console.log(`signed in anonymously as ${signIn.user.id}`);
console.log(`is_anonymous claim: ${signIn.user.is_anonymous}\n`);

let failures = 0;

/** A guest must see exactly `expected` rows of `table`. */
async function mustSee(label: string, table: string, expected: number, filter?: [string, string]) {
  let q = db.from(table).select("*", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count, error } = await q;
  const got = error ? `error: ${error.message}` : String(count ?? 0);
  const ok = !error && (count ?? 0) === expected;
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${label.padEnd(46)} expected ${expected}, got ${got}`);
}

console.log("things a guest MUST NOT see");
await mustSee("staff roster", "staff", 0);
await mustSee("tenant_settings (domains, plan)", "tenant_settings", 0);
await mustSee("draft templates", "templates", 0, ["status", "draft"]);
await mustSee("other guests' print passes", "print_jobs", 0);
await mustSee("other guests' share links", "share_links", 0);
await mustSee("delivery log", "deliveries", 0);
await mustSee("session analytics", "sessions", 0);
await mustSee("booking inquiries", "inquiries", 0);

console.log("\nthings a guest MUST see");
await mustSee("published templates", "templates", 3, ["status", "published"]);
await mustSee("published events", "events", 1, ["is_published", "true"]);

console.log("\nthings a guest MUST NOT be able to write");
const writes: Array<[string, () => Promise<{ error: unknown }>]> = [
  ["insert a free print pass", async () =>
    await db.from("print_jobs").insert({
      tenant_id: "9e605b70-4e7f-4aec-ade9-84c20b69d20d",
      event_id: "00000000-0000-0000-0000-000000000000",
      code: "FREE01", render_path: "x.jpg", price_cents: 0,
      expires_at: "2099-01-01T00:00:00Z",
    } as never)],
  ["publish their own template", async () =>
    await db.from("templates").insert({
      tenant_id: "9e605b70-4e7f-4aec-ade9-84c20b69d20d",
      name: "hacked", category: "strip", spec: {}, shot_count: 1, status: "published",
    } as never)],
  ["promote themselves to staff", async () =>
    await db.from("staff").insert({
      tenant_id: "9e605b70-4e7f-4aec-ade9-84c20b69d20d",
      user_id: signIn.user!.id, role: "owner", status: "active",
    } as never)],
];

for (const [label, run] of writes) {
  const { error } = await run();
  const blocked = Boolean(error);
  if (!blocked) failures++;
  console.log(`${blocked ? "ok  " : "FAIL"}  ${label.padEnd(46)} ${blocked ? "blocked" : "ALLOWED — LEAK"}`);
}

// UPDATE needs a different assertion from INSERT. PostgREST does not error when
// RLS filters an update down to zero rows — "changed nothing" is a success. So
// ask for the changed rows back and require the list to be empty.
{
  const { data, error } = await db
    .from("events")
    .update({ print_price_cents: 1 } as never)
    .neq("id", "00000000-0000-0000-0000-000000000000")
    .select("id, print_price_cents");
  const rows = data ?? [];
  const blocked = Boolean(error) || rows.length === 0;
  if (!blocked) failures++;
  console.log(
    `${blocked ? "ok  " : "FAIL"}  ${"reprice an event".padEnd(46)} ` +
      `${blocked ? `blocked (${rows.length} rows changed)` : `ALLOWED — LEAK, ${rows.length} rows changed`}`,
  );
}

console.log("\nprivileged RPCs must be unreachable");
for (const fn of ["current_tenant_ids", "issue_print_job", "redeem_print_job", "purge_expired", "generate_code"]) {
  const { error } = await db.rpc(fn as never, {} as never);
  const blocked = Boolean(error);
  if (!blocked) failures++;
  console.log(`${blocked ? "ok  " : "FAIL"}  ${fn.padEnd(46)} ${blocked ? "blocked" : "CALLABLE — LEAK"}`);
}

console.log(failures === 0 ? "\nALL RLS CHECKS PASSED" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
