# PxlPod — remaining work

Status map after the delivery + polish rounds. Grouped by what actually blocks
each item. "You" = actions that need your Supabase/Apple/Google dashboards or a
device build — I can't do these from here.

## A. Pre-launch hardening (mostly dashboard clicks)

- [ ] **Enable leaked-password protection** — Supabase Dashboard → Authentication
  → Policies/Providers → Password → turn on "Check against HaveIBeenPwned".
  (Advisor WARN `auth_leaked_password_protection`.)
- [ ] **Enable an MFA option** for the console — Dashboard → Authentication →
  Multi-Factor → enable TOTP. (Advisor WARN `auth_insufficient_mfa_options`.)
- [ ] **Create a real owner account** and retire the test login. Add the user in
  Dashboard → Authentication → Users, then insert a `staff` row:
  ```sql
  insert into public.staff (tenant_id, user_id, role, status)
  values ('9e605b70-4e7f-4aec-ade9-84c20b69d20d', '<new-auth-user-id>', 'owner', 'active');
  ```
  Then remove/disable `owner@pxlpod.test`.
- [ ] **Deploy the web app to a real domain** and set it as `EXPO_PUBLIC_WEB_URL`
  for the production build. The store privacy URL (`/privacy`) and share links
  must resolve on a real host, not a LAN IP. (See `store/README.md`.)
- [ ] **DNP RX1HS print test** — confirm the redeemed strip prints at 4×6 / 300dpi
  with correct margins from the browser print dialog.
- [ ] **Store submission** — follow `store/README.md`: fill `eas.json` `appleId`
  / `ascAppId`, add the Play service-account JSON, build + submit, and complete
  the listings using `store/app-store.md` / `store/play-store.md`.

Already done here: public `/privacy` + `/terms` pages, scheduled `purge_expired`
cleanup (pg_cron, daily 02:15 Manila), capture analytics on the dashboard.

## B. Bigger features (need a native rebuild — flagged, not built)

These require adding a native module and an EAS dev-client/production rebuild, so
they can't be verified on the current build from here:

- [x] **True `.mp4` video hero** — DONE. `expo-video` added; `start-session.mp4`
  bundled; `StartSessionHeroMp4` plays it looping/muted. Loaded lazily behind an
  ErrorBoundary that falls back to the sprite tile on builds without the native
  module. **Needs a dev-client rebuild** to show the real video:
  `cd apps/mobile && eas build --profile development --platform ios`, then install
  that build and reload. (The production/store build includes it automatically.)
- [ ] **Motion / GIF output** — the delivery hub reserves a "SOON" slot. Needs a
  native encoder (frames → GIF/MP4) and a rebuild.
- [ ] **Web capture booth (Phase 2)** — browser-based capture page; ports the
  Skia compositor to canvas. Large; scheduled for phase 2.

## C. Deferred by product decision

- **Runtime brand theming** (operator colors/logo/fonts applied at runtime) — the
  `tenants.brand` JSON column exists for it, but its value is for **operator two**;
  PxlPod is already branded via design tokens. Revisit when onboarding a 2nd
  operator, alongside the platform-admin/self-serve/billing layer.
- **Email/SMS delivery** — dropped in favor of share links + print.

## Nice-to-have polish (small, no rebuild)

- [ ] Album covers: set a cover on the "Past events" album so the Portfolio
  carousel shows an image instead of the hatch placeholder.
- [ ] Session flags (saved/shared/printed) aren't recorded yet — `log_session`
  logs the capture only. Add an update when the guest taps Save/Share/Print if
  you want a delivery funnel on the dashboard.
