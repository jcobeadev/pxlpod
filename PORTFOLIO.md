# PxlPod — Photobooth SaaS (iOS · Android · Web)

A multi-tenant photobooth platform I designed and built end-to-end: a branded
mobile app where guests shoot photo strips on their phone and keep, share, or
print them at a live pop-up, plus a web console where the operator manages
templates, events, bookings, and prints. Built on a single Supabase database
secured by row-level security, so the app and console are two clients over one
schema.

## Try it
- **iOS**: TestFlight — <add public link> (installs on any device, worldwide)
- **Web console**: https://pxlpod.vercel.app *(demo credentials on request)*
- **Public share page example**: https://pxlpod.vercel.app/s/ *(a guest's shared strip)*

## Stack
- **Mobile**: React Native (Expo 57, New Architecture), expo-router, VisionCamera,
  Skia (image compositor), Reanimated, expo-video, NativeWind, Zustand, SQLite.
- **Web**: Next.js 16 (App Router, Server Actions), Supabase SSR, Tailwind.
- **Backend**: Supabase (Postgres + RLS, anonymous auth for guests, SECURITY
  DEFINER RPCs, Storage with signed URLs, pg_cron), deployed on Vercel.
- **Monorepo**: Turborepo + pnpm; shared `template-spec` (zod), typed API client,
  and design tokens consumed by both apps.

## Engineering highlights
- **Multi-tenant by construction** — deny-by-default RLS with private-schema
  helpers scopes every row to a tenant; guests act as anonymous users and can
  only ever touch their own data.
- **On-device, privacy-first capture** — strips are composited on-device with
  Skia at print resolution (1200×1800 / 4×6 @300dpi) and stored locally in
  SQLite; nothing is uploaded unless the guest taps share or print.
- **Real camera work** — VisionCamera with a fused ultra-wide+wide device to
  expose a true 0.5× high-angle lens, pinch/tap zoom stops, JPEG capture.
- **Serverless delivery** — share links and cash-print "passes" run entirely on
  RLS + SECURITY DEFINER RPCs (no bespoke API server); print redemption is
  event-bound and staff-verified.
- **Production-grade polish** — masonry portfolio with EXIF-correct image
  transforms, offline states, pull-to-refresh, image prefetch/caching, scheduled
  data cleanup, and capture analytics on the operator dashboard.
- **Shipped it** — took it through EAS production builds and App Store / Google
  Play submission (including debugging a gnarly Metro transformer failure from
  the raw CI logs).

## Role
Solo — product, architecture, mobile, web, database, and release.
