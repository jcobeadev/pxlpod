# Poplab

Monorepo for PxlPod — a photobooth app with a mobile client, a web client, and
shared TypeScript packages, managed with pnpm workspaces + Turborepo.

## Layout

```
apps/
  mobile/          Expo app (TypeScript, expo-router, NativeWind)
  web/              Next.js app (App Router, TypeScript, Tailwind)
packages/
  template-spec/    Overlay/template slot-detection types (shared)
  tokens/           Design tokens + Tailwind preset
  db/               Database layer (shared)
  api/               API layer (shared)
```

## Requirements

- Node 26 (see `.nvmrc`)
- pnpm 11 (`packageManager` is pinned in `package.json`)

## Getting started

```bash
pnpm install
```

## Running the apps

**Mobile** (Expo):

```bash
pnpm --filter @poplab/mobile dev
# or: cd apps/mobile && pnpm dev
```

Then press `i` for iOS simulator, `a` for Android emulator, or `w` for web,
or scan the QR code with Expo Go.

**Web** (Next.js):

```bash
pnpm --filter @poplab/web dev
# or: cd apps/web && pnpm dev
```

Open http://localhost:3000.

## Common tasks

Run any pipeline task across every workspace with Turborepo:

```bash
pnpm dev         # start dev servers
pnpm build       # build all apps/packages
pnpm lint        # lint all apps/packages
pnpm typecheck   # typecheck all apps/packages
pnpm test        # run tests
```
