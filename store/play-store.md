# Google Play Console — listing & Data safety answers

Paste-ready metadata for the Android listing. Fill anything in **UPPERCASE**.

## Store listing

- **App name**: PxlPod
- **Short description** (80 char):
  Shoot a photo strip at a PxlPod pop-up. Keep it, share it, print it.
- **Full description**:
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
- **App category**: Photography
- **Tags**: photo booth, photo strip, events
- **Contact email**: SUPPORT_EMAIL_HERE
- **Privacy Policy URL**: https://<web-domain>/privacy

## Content rating (IARC questionnaire)

- Category: **Utility / Productivity / Other** (or Photography).
- Answer **No** to all violence, sexual content, profanity, controlled
  substances, gambling questions. Expected result: **Everyone / PEGI 3**.
- User-generated content shareable? The app can create a share link → answer
  **Yes** to "users can interact / share content"; note it's photo strips the
  user makes.

## Data safety form

- **Does your app collect or share user data?** Yes.
- **Data types:**
  - **Photos and videos**
    - Collected: **Yes** (only when the user creates a share link or sends to
      print). Shared: **No**.
    - Processed ephemerally: **No** (share links persist ~30 days).
    - Required or optional: **Optional** (user-initiated).
    - Purpose: **App functionality**.
  - **Personal info — Name, Email address, Phone number**
    - Collected: **Yes** (only via the "Book us" inquiry form). Shared: **No**.
    - Optional. Purpose: **App functionality** (respond to booking).
  - **Location — Approximate location**
    - Collected: **No** — used on device only to detect a nearby pop-up, not
      sent to a server. (If required to declare because of the permission:
      Optional, App functionality, not shared.)
- **Is all collected data encrypted in transit?** Yes (HTTPS / Supabase).
- **Can users request data deletion?** Yes — in-app "Delete all my strips", and
  a contact email for share/print/inquiry data (see privacy policy).
- **Advertising / analytics IDs:** None.

## Permissions declaration

- `CAMERA` — take the photo strip.
- `ACCESS_COARSE/FINE_LOCATION` — optional, detect nearby pop-up.
- Media permissions — save the finished strip to the device gallery.

No sensitive permissions (SMS, call log, all-files-access) are used.

## Other Play Console answers

- **Ads:** contains no ads → declare **No ads**.
- **Target audience & content:** target age **13+** (not designed for children);
  answer the "Designed for Families / kids" questions as **No**.
- **Government / News / COVID-19 app?** No to all.
- **Financial features?** No.
- **App access:** all functionality is available without special access or a
  login — no reviewer credentials needed.
- **Login required?** No (anonymous use).
