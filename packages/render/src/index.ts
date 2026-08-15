/**
 * @poplab/render
 *
 * Platform adapters that turn a `planSlots()` draw plan into pixels. The plan
 * itself lives in @poplab/template-spec; nothing here recomputes geometry.
 *
 * `./skia` is React Native only — import it from the mobile app, not the web.
 */
export * from "./filters.ts";
