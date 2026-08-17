# Deploy the web console to Vercel

The console is `apps/web` (Next.js 16) in this pnpm monorepo. Supabase is already
the backend, so Vercel only serves the frontend. Free tier is plenty for a pilot.

## What's required

- Only two environment variables (both are safe, publishable values — copy them
  from `apps/web/.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- The service-role / Resend / SMS keys in `.env.local` are **not** used by the
  code — do **not** add them to Vercel.
- Node 22 (pinned via `apps/web/package.json` `engines`).

## Recommended path — GitHub → Vercel (auto-deploys on push)

1. **Create a private GitHub repo** (empty, no README) — e.g. `pxlpod`.
2. **Push this repo** (run these from the project root):
   ```bash
   git branch -M main
   git remote add origin https://github.com/<you>/pxlpod.git
   git push -u origin main
   ```
   `.env*` files are gitignored, so no secrets are pushed.
3. Go to **vercel.com → Add New → Project**, and **Import** the GitHub repo.
4. In the import screen:
   - **Root Directory:** click Edit → select **`apps/web`**.
   - **Framework Preset:** Next.js (auto-detected).
   - **Build / Install commands:** leave default (Vercel handles pnpm workspaces).
   - **Environment Variables:** add the two `NEXT_PUBLIC_SUPABASE_*` values.
5. **Deploy.** You'll get a URL like `https://pxlpod.vercel.app`.
6. (Optional) **Project Settings → Node.js Version:** confirm 22.x.
7. (Optional) **Domains:** add a custom domain when you have one.

Every future `git push` to `main` redeploys automatically.

## Quick alternative — Vercel CLI (no GitHub)

```bash
npm i -g vercel
cd apps/web
vercel            # first run links/creates the project; set root when asked
vercel --prod     # promote to production
```
Add the two env vars in the dashboard afterward (or with `vercel env add`).

## After the first deploy

- **Point the app at the live domain.** Set `EXPO_PUBLIC_WEB_URL` to the Vercel
  URL (e.g. `https://pxlpod.vercel.app`) in `apps/mobile/.env` and in the EAS
  production build env. This is what makes share links and the store **privacy
  URL** (`/privacy`) resolve on a real host.
- **Supabase Auth → URL Configuration:** set the Site URL to the Vercel domain so
  console password-reset emails link correctly.
- **Verify:** open `https://<domain>/privacy` and `/login` — both should load;
  signing in should reach the dashboard.

## Moving to AWS later

You almost certainly won't need to for a long time — Vercel scales well past your
first clients. If you ever outgrow it: AWS Amplify Hosting (closest equivalent) or
containerize `apps/web` to ECS/Fargate. Revisit only if scale or cost forces it.
