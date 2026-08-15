/**
 * @poplab/api
 *
 * The typed Supabase client and React Query hooks both the mobile app and
 * the web console build their data layer on. No UI here — hooks, fetch
 * functions, and the client/session/storage helpers they sit on.
 *
 * Hooks take the client explicitly as their first argument (e.g.
 * `useTemplates(client, tenantId)`) rather than reading it off a Context —
 * this package deliberately has no Provider component, so each app wires up
 * where its single `PoplabClient` instance lives.
 */

export * from "./client.ts";
export * from "./auth.ts";
export * from "./storage.ts";
export * from "./types.ts";
export * from "./queries/index.ts";
