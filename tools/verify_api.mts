/**
 * End-to-end check of packages/api against the live database.
 *
 * Uses `createPoplabClient` and the fetch functions the hooks in
 * packages/api/src/queries/* wrap (not the hooks themselves — those need a
 * React tree and a QueryClient to run). Anon key, RLS in force, no service
 * role — this is exactly the path the mobile app and the web console take.
 *
 *   node tools/verify_api.mts
 */
import { createPoplabClient } from "../packages/api/src/client.ts";
import { ensureAnonymousSession } from "../packages/api/src/auth.ts";
import { fetchTemplates } from "../packages/api/src/queries/templates.ts";
import { fetchLiveEvent } from "../packages/api/src/queries/events.ts";
import { shotCount } from "../packages/template-spec/src/schema.ts";

const URL = "https://plvosxnepmhbamjpjoxr.supabase.co";
const ANON = "sb_publishable_n8VTW5AZeQ1f3DlYOeEplg_Qr3_VOLV";
const TENANT_ID = "9e605b70-4e7f-4aec-ade9-84c20b69d20d";

let failures = 0;
const client = createPoplabClient({ url: URL, anonKey: ANON });

/* --------------------------------------------------------- 1. templates */

console.log("--- fetchTemplates ---");
const templates = await fetchTemplates(client, TENANT_ID);
console.log(`fetched ${templates.length} validated templates`);
if (templates.length === 0) {
  console.log("FAIL  expected at least one published template");
  failures++;
}
for (const t of templates) {
  console.log(
    `ok    ${t.name.padEnd(14)} status=${t.status} shots=${shotCount(t.spec)} ` +
      `windows=${t.spec.slots.length} variants=${t.spec.variants.length}`,
  );
  if (shotCount(t.spec) !== t.shot_count) {
    console.log(`FAIL  ${t.name}: shot_count column (${t.shot_count}) != spec-derived (${shotCount(t.spec)})`);
    failures++;
  }
}

/* -------------------------------------------------------- 2. live event */

console.log("\n--- fetchLiveEvent (RPC live_events) ---");
const live = await fetchLiveEvent(client, TENANT_ID);
if (!live) {
  console.log("FAIL  expected a running pop-up, got null");
  failures++;
} else {
  console.log(`ok    live event: "${live.title}" (${live.slug}) ends_at=${live.ends_at}`);
  if (live.title !== "Downtown Night Market") {
    console.log(`FAIL  expected "Downtown Night Market", got "${live.title}"`);
    failures++;
  }
}

/* ---------------------------------------------------- 3. anonymous auth */

console.log("\n--- ensureAnonymousSession ---");
try {
  const userId = await ensureAnonymousSession(client);
  if (!userId) {
    console.log("FAIL  ensureAnonymousSession returned no user id");
    failures++;
  } else {
    console.log(`ok    signed in anonymously as ${userId}`);

    // Idempotency: calling it again on the same client must return the same
    // id without minting a second identity.
    const userIdAgain = await ensureAnonymousSession(client);
    if (userIdAgain !== userId) {
      console.log(`FAIL  ensureAnonymousSession not idempotent: ${userId} != ${userIdAgain}`);
      failures++;
    } else {
      console.log(`ok    idempotent — second call returned the same user id`);
    }
  }
} catch (err) {
  const code = (err as { code?: string }).code;
  if (code === "anonymous_provider_disabled") {
    console.log(
      "FAIL  anonymous sign-ins are disabled on this project " +
        "(supabase/config.toml has `enable_anonymous_sign_ins = false`). " +
        "ensureAnonymousSession itself calls the right API — this is a project " +
        "config gap, not a bug in packages/api. Needs enabling in supabase/ " +
        "(config.toml for local dev, and the hosted project's Auth settings for " +
        "this remote database) before guests can get an identity.",
    );
  } else {
    console.log(`FAIL  ensureAnonymousSession threw: ${(err as Error).message}`);
  }
  failures++;
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
