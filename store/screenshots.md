# Screenshots checklist

Both stores need screenshots. Capture on the largest required device and let the
console downscale where allowed.

## Required sizes

- **iOS**: 6.9" (or 6.7") iPhone — 1290×2796 (or 1284×2778). iPad only if you
  keep `supportsTablet: true` (currently true) — either provide 12.9" iPad
  screenshots or set `supportsTablet: false` in `app.json` to skip them.
- **Android**: phone screenshots, min 2, up to 8. 1080×1920 or larger, 16:9-ish.

## Suggested shots (in order)

1. **Home** — Start session tile + templates row (brand-forward).
2. **Capture** — the 4-photo countdown mid-session.
3. **Review / template pick** — a finished strip in a template.
4. **Share screen** — Save / Share / Create share link.
5. **Print pass** — the big code screen ("Show this at the booth").
6. **Portfolio / album** — a published gallery.

## How

- Run on a booted simulator/device at the target resolution and screenshot, or
- Use a framed-screenshot tool later. For now, raw device captures are fine for
  a first submission.

Store the final images in `store/assets/ios/` and `store/assets/android/`
(create as needed — not committed by default if large).
