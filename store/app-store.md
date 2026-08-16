# App Store Connect — listing & review answers

Paste-ready metadata for the iOS listing. Fill anything in **UPPERCASE** first.

## Listing

- **Name**: PxlPod
- **Subtitle** (30 char max): High-angle photo booth
- **Primary category**: Photo & Video
- **Secondary category**: Entertainment
- **Promotional text** (170 char, editable without review):
  Shoot a photo strip from your phone at a PxlPod pop-up. Keep it, share it,
  print it at the booth.

- **Description**:
  ```
  PxlPod turns your phone into a high-angle photo booth.

  • Shoot a 4-photo strip with a countdown, right on your phone.
  • Pick a template and a look — your strip is built on-device.
  • Keep it, save it to your photos, or share it anywhere.
  • Create a share link to a branded page anyone can open.
  • At a live PxlPod pop-up, pay cash at the booth to print your strip.

  Your photos stay on your phone. Nothing is uploaded to make a strip — a photo
  only leaves your device when you choose to share or print it. No account
  needed, ever.

  Running an event? Tap Book us to get a quote.
  ```

- **Keywords** (100 char, comma-separated, no spaces):
  photobooth,photo booth,photo strip,event,party,wedding,prints,booth,pop-up,strip

- **Support URL**: https://<web-domain>/  (or a support/contact page)
- **Marketing URL** (optional): https://<web-domain>/
- **Privacy Policy URL**: https://<web-domain>/privacy

## Age rating

- Made for Kids: **No**
- Expected rating: **4+** (no objectionable content). Answer "None" to all
  content-descriptor questions (violence, mature themes, gambling, etc.).

## App Privacy (data collection questionnaire)

The guest app collects very little. Answer as follows:

- **Do you collect data from this app?** Yes (only via the features below).
- **User Content — Photos or Videos**
  - Collected: **Yes**, but only when the user creates a share link or sends a
    strip to print (not to build a strip).
  - Linked to identity: **No** (guests are anonymous, no account).
  - Used for tracking: **No**.
  - Purpose: **App Functionality** (deliver the share link / print).
- **Contact Info — Name, Email Address, Phone Number**
  - Collected: **Yes**, only when the user submits a "Book us" inquiry.
  - Linked to identity: **No account**, but the inquiry itself contains it.
  - Used for tracking: **No**.
  - Purpose: **App Functionality** (respond to the booking request).
- **Location — Coarse Location**
  - Collected: **No** (used on-device only to check for a nearby pop-up; not
    sent to or stored by us). If the questionnaire insists it's "collected"
    because the permission exists, mark purpose **App Functionality**, not
    linked, not tracking.
- **Identifiers / Usage Data / Diagnostics**: **No** — the app has no analytics
  or crash SDK, and no advertising identifiers.

## App Review notes (paste into the review notes field)

```
No login is required — the app is used anonymously. To try the full flow:
1. Allow camera access on the "Camera access" screen.
2. Tap Start session, pick a template, shoot the 4-photo countdown.
3. On the final screen you can Save, Share, or Create a share link.
"Print at this pop-up" only appears during a live event window, so it may be
hidden during review — it issues a code the on-site staff redeem in our web
console. Photos are not uploaded except when the user taps Share link or Print.
```

## Export compliance

- Uses non-exempt encryption: **No** (`ITSAppUsesNonExemptEncryption=false` in
  app.json). No prompt at submit.
