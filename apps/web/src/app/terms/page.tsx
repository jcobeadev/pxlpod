import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use · PXLPOD Photobooth",
  description: "Terms for using the PxlPod photobooth app.",
};

const UPDATED = "August 17, 2026";
const OPERATOR = "PXLPOD Photobooth";
const CONTACT = "hello@pxlpod.example"; // TODO: real support inbox before launch

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-[#14140f] flex justify-center px-5 py-12">
      <article className="w-full max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#7a736a]">Legal</p>
        <h1 className="font-display text-4xl uppercase mt-1 mb-2">Terms of Use</h1>
        <p className="text-[13px] text-[#7a736a] mb-8">Last updated {UPDATED}</p>

        <Section title="Using the app">
          <p>
            The PxlPod app, operated by {OPERATOR}, lets you shoot photo strips, keep them on your device, and
            optionally share or print them. Use it lawfully and only with the consent of anyone appearing in a
            strip.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You own the photos you take. When you create a share link, anyone with the link can view that
            strip until it expires. When you send a strip to print at a pop-up, you authorize our staff to
            print it for you. Don’t create or share content that is unlawful, infringing, or harmful.
          </p>
        </Section>

        <Section title="Prints and payment">
          <p>
            Prints at a pop-up are paid in cash at the booth at the price shown before you request a print
            code. A print code is valid only during its event window.
          </p>
        </Section>

        <Section title="No warranty">
          <p>
            The app is provided “as is.” We don’t guarantee it will be uninterrupted or error-free, and we’re
            not liable for lost strips — keep your own copies of anything important.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email{" "}
            <a className="underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.
          </p>
        </Section>
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
