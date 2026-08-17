import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support · PXLPOD Photobooth",
  description: "Help and contact for the PxlPod photobooth app.",
};

// Public, unauthenticated support page — the support URL the app stores require.
// Update the contact email before launch.
const CONTACT = "hello@pxlpod.example"; // TODO: real support inbox before launch

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white text-[#14140f] flex justify-center px-5 py-12">
      <article className="w-full max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Help</p>
        <h1 className="font-display text-4xl uppercase mt-1 mb-2">Support</h1>
        <p className="text-[13px] text-[#7a736a] mb-8">PXLPOD Photobooth</p>

        <Section title="Contact us">
          <p>
            Questions, feedback, or a problem with the app? Email{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a> and we&apos;ll get back to you.
          </p>
        </Section>

        <Section title="Common questions">
          <Q q="Where are my photo strips?">
            Open the app and go to <strong>My Photos</strong>. Strips are saved on your device — they aren&apos;t
            uploaded unless you share, create a link, or send one to print.
          </Q>
          <Q q="I can't open the camera.">
            Allow camera access in your phone&apos;s <strong>Settings → PxlPod → Camera</strong>, then reopen the app.
          </Q>
          <Q q="How do prints work?">
            At a live pop-up, tap <strong>Print at this pop-up</strong> on a finished strip to get a code, then show
            it to our booth staff and pay in cash at the booth.
          </Q>
          <Q q="How do I delete my photos?">
            In the app, go to <strong>More → Delete all my strips</strong>. Copies you already saved or shared stay
            where you put them.
          </Q>
          <Q q="How do I book the booth for my event?">
            Tap <strong>Book us</strong> on the home screen, or message us — we&apos;ll reply with a quote.
          </Q>
        </Section>

        <Section title="Privacy & terms">
          <p>
            Read our <a className="underline" href="/privacy">Privacy Policy</a> and{" "}
            <a className="underline" href="/terms">Terms of Use</a>.
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

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-semibold text-[#14140f]">{q}</p>
      <p className="text-[#2a2a24]">{children}</p>
    </div>
  );
}
