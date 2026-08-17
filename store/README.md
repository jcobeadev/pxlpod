# Store submission — PxlPod

Boilerplate + checklist for shipping the PxlPod mobile app to the **App Store**
and **Google Play**. App config lives in `apps/mobile/app.json`; build/submit
profiles in `apps/mobile/eas.json`. Listing copy is in this folder.

- Bundle id / package: `com.jcobea.pxlpod`
- EAS project id: `d966c7f6-5af7-424c-8f3c-59e8aeea084a`
- Apple Team id: `53HHS3Z88H`
- Web console (live): `https://pxlpod.vercel.app`
- **Privacy policy URL** (required by both stores): `https://pxlpod.vercel.app/privacy`
- **Support URL** (required by both stores): `https://pxlpod.vercel.app/support`
- Terms URL: `https://pxlpod.vercel.app/terms`

> The legal + support pages are served publicly by the web app (`apps/web`,
> routes `/privacy`, `/terms`, `/support`), now deployed on Vercel. If you move to
> a custom domain later, update `EXPO_PUBLIC_WEB_URL` (see below) and these URLs.

> **Before submitting**, replace the placeholder support email
> `hello@pxlpod.example` in `apps/web/src/app/{privacy,terms,support}/page.tsx`
> (and `legal/*.md`) with a real inbox — reviewers do check the support contact.

## 0. Before you build

1. **Assets** — already store-ready:
   - `apps/mobile/assets/icon.png` — 1024×1024, no alpha ✓
   - `apps/mobile/assets/android-icon-*` — adaptive icon layers ✓
   - iPad screenshots are **not** needed (`supportsTablet: false`).
   - Screenshots (see `screenshots.md`) — still need to be captured.
2. **Production env** — already baked into `eas.json` `build.production.env`
   (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`,
   `EXPO_PUBLIC_TENANT_ID`, `EXPO_PUBLIC_TENANT_SLUG`, `EXPO_PUBLIC_WEB_URL` =
   `https://pxlpod.vercel.app`). All are publishable values. Nothing to set by
   hand. (Messenger link is read from the console, not an env var.)
3. **Version** — `app.json` `version` is the marketing version; build number is
   auto-incremented (`autoIncrement`) by EAS on production builds.
4. **Log in to EAS** — `eas login` (needs your Expo account).

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

- App Store Connect (needs Apple Developer Program, $99/yr): create the app with
  bundle id `com.jcobea.pxlpod`, paste listing copy from `app-store.md`, complete
  **App Privacy** (answers in that file), set **age rating**, attach screenshots,
  set **privacy policy URL** = `https://pxlpod.vercel.app/privacy` and **support
  URL** = `https://pxlpod.vercel.app/support`. Then copy the app's Apple ID and
  App Store Connect App ID into `eas.json` `submit.production.ios`
  (`appleId`, `ascAppId`).
- Play Console (needs a Google Play developer account, $25 one-time): create the
  app with package `com.jcobea.pxlpod`, paste copy from `play-store.md`, complete
  the **Data safety** form and **content rating** questionnaire (answers in those
  files), set **privacy policy URL** and add the support email/website, attach
  screenshots. Put the Play service-account JSON at
  `apps/mobile/credentials/play-service-account.json` (git-ignored).

## Notes on review

- **No account / anonymous use** — reviewers can use the app immediately; no
  demo login needed. Mention this in App Review notes.
- **Camera + Photos + Location** usage strings are set in `app.json`
  (`infoPlist` / android `permissions`). Location is optional and only used to
  detect a nearby pop-up.
- **Export compliance**: `ITSAppUsesNonExemptEncryption=false` is set (no custom
  crypto).
