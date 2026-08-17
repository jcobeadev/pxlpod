import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · PXLPOD Photobooth",
  description: "How the PxlPod photobooth app handles your photos and data.",
};

// Public, unauthenticated legal page — the privacy URL the mobile app and the
// app stores link to. Kept as plain readable content, no console chrome.
// Written to match what the app actually does; update the effective date and
// the operator contact line when the handling changes.
const UPDATED = "August 17, 2026";
const OPERATOR = "PXLPOD Photobooth";
const CONTACT = "pxlpodbooth@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-[#14140f] flex justify-center px-5 py-12">
      <article className="w-full max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Legal</p>
        <h1 className="font-display text-4xl uppercase mt-1 mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-[#7a736a] mb-8">Last updated {UPDATED}</p>

        <Section title="The short version">
          <p>
            The PxlPod app makes photo strips on your phone. The photos and strips you shoot stay on your
            device. Nothing is uploaded to make a strip. A photo only leaves your phone when you choose to
            share it, create a share link, or send it to print — and only after you tap that action.
          </p>
        </Section>

        <Section title="Who we are">
          <p>
            {OPERATOR} operates the pop-up photobooth and this app. We are responsible for the personal data
            described here. Questions? Email <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </Section>

        <Section title="What we collect, and when">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Photos and strips</strong> — created and stored on your device. We never receive them
              unless you use a sharing or printing action below.
            </li>
            <li>
              <strong>Share links</strong> — if you tap “Create a share link,” the finished strip is uploaded
              so anyone with the link can view it. Share links expire automatically (about 30 days).
            </li>
            <li>
              <strong>Print at a pop-up</strong> — if you tap “Print at this pop-up,” the finished strip is
              uploaded so our booth staff can print it. It is tied to that event and removed after the event
              window.
            </li>
            <li>
              <strong>Booking inquiries</strong> — if you use “Book us,” we collect the details you enter
              (name, email and/or phone, and event details) so we can reply with a quote.
            </li>
            <li>
              <strong>Approximate location</strong> — only if you allow it, and only to check whether a pop-up
              is running near you. It is used on-device and not stored by us.
            </li>
          </ul>
        </Section>

        <Section title="What we do NOT do">
          <ul className="list-disc pl-5 space-y-2">
            <li>No guest accounts. You use the app without signing up.</li>
            <li>No microphone access. No advertising trackers. We don’t sell your data.</li>
            <li>We don’t upload your photos in the background or for analytics.</li>
          </ul>
        </Section>

        <Section title="How sharing works">
          <p>
            “Save to device” writes a copy to your phone’s photo library. “Share” hands the image to whichever
            app you pick (Instagram, Messenger, etc.), which then handles it under its own policy. Uploaded
            strips (share links and prints) are stored with our infrastructure provider, Supabase, on our
            behalf.
          </p>
        </Section>

        <Section title="How long we keep things">
          <ul className="list-disc pl-5 space-y-2">
            <li>On-device photos and strips: until you delete them (More → Delete all my strips).</li>
            <li>Share links: expire automatically, roughly 30 days after creation.</li>
            <li>Print uploads: kept for the event, then cleared.</li>
            <li>Booking inquiries: kept while we handle your booking and our records require.</li>
          </ul>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc pl-5 space-y-2">
            <li>Delete every strip the app holds at any time from the More screen.</li>
            <li>Revoke camera, photos, or location permission in your phone’s Settings.</li>
            <li>
              Ask us to access or delete a booking inquiry, or a strip you shared or sent to print, by emailing{" "}
              <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
            </li>
          </ul>
        </Section>

        <Section title="Children">
          <p>
            The app is not directed to children under 13. Booking inquiries should be submitted by an adult.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We’ll update this page if our handling changes and revise the date above. Continued use after a
            change means you accept the updated policy.
          </p>
        </Section>

        <p className="text-[13px] text-[#7a736a] mt-10">
          Contact: <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>
        </p>
      </article>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="font-bold text-[15px] uppercase tracking-wide mb-2">{title}</h2>
      <div className="text-[14.5px] leading-relaxed text-[#2a2a24] space-y-3">{children}</div>
    </section>
  );
}
