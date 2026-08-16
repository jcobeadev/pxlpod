# Store submission — PxlPod

Boilerplate + checklist for shipping the PxlPod mobile app to the **App Store**
and **Google Play**. App config lives in `apps/mobile/app.json`; build/submit
profiles in `apps/mobile/eas.json`. Listing copy is in this folder.

- Bundle id / package: `com.jcobea.pxlpod`
- EAS project id: `d966c7f6-5af7-424c-8f3c-59e8aeea084a`
- Apple Team id: `53HHS3Z88H`
- Privacy policy URL (required by both stores): `https://<web-domain>/privacy`
- Terms URL: `https://<web-domain>/terms`

> The legal pages are served publicly by the web app (`apps/web`, routes
> `/privacy` and `/terms`). **Deploy the web app to a real domain and set that
> domain as `EXPO_PUBLIC_WEB_URL` for the production build** — a LAN IP or
> `pxlpod.app` placeholder is not an acceptable privacy URL for review.

## 0. Before you build

1. **Assets** — confirm these exist and look right:
   - `apps/mobile/assets/icon.png` (1024×1024, no alpha for iOS)
   - `apps/mobile/assets/android-icon-*` (adaptive icon layers)
   - Screenshots (see `screenshots.md`) — captured, not yet automated.
2. **Production env** — the production build needs the public runtime config.
   Set these as EAS env vars (or `eas secret:create`), since `eas.json`
   `build.production.env` only carries `EXPO_PUBLIC_TENANT_SLUG`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (publishable key — safe to embed)
   - `EXPO_PUBLIC_TENANT_ID`
   - `EXPO_PUBLIC_WEB_URL` (the deployed web domain)
   - `EXPO_PUBLIC_MESSENGER_URL` (optional; Messenger link is otherwise read
     from the console at Content → Messenger link)
3. **Version** — `app.json` `version` is the marketing version; build number is
   auto-incremented (`autoIncrement`) by EAS on production builds.

## 1. Build

```bash
cd apps/mobile
eas build --profile production --platform ios
eas build --profile production --platform android
```

## 2. Submit

iOS (needs `appleId` + `ascAppId` filled into `eas.json`, and an app created in
App Store Connect):

```bash
cd apps/mobile
eas submit --profile production --platform ios --latest
```

Android (needs a Play service-account JSON at
`apps/mobile/credentials/play-service-account.json` — git-ignored; and an app
created in the Play Console):

```bash
cd apps/mobile
eas submit --profile production --platform android --latest
```

Android first-submit currently targets the **internal** track as a **draft** —
promote to production in the Play Console after you've reviewed it.

## 3. Store Console setup (one-time, in the web dashboards)

- App Store Connect: create the app, paste listing copy from `app-store.md`,
  complete **App Privacy** (answers in that file), set **age rating**, attach
  screenshots, set the **privacy policy URL**.
- Play Console: create the app, paste copy from `play-store.md`, complete the
  **Data safety** form and **content rating** questionnaire (answers in that
  file), set the **privacy policy URL**, attach screenshots.

## Notes on review

- **No account / anonymous use** — reviewers can use the app immediately; no
  demo login needed. Mention this in App Review notes.
- **Camera + Photos + Location** usage strings are set in `app.json`
  (`infoPlist` / android `permissions`). Location is optional and only used to
  detect a nearby pop-up.
- **Export compliance**: `ITSAppUsesNonExemptEncryption=false` is set (no custom
  crypto).
