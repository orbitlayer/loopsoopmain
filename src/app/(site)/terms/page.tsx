import type { Metadata } from "next";
import { site } from "@/lib/data";
import { getSiteInfo } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { KineticText } from "@/components/studio/KineticText";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Loopsoop website and services.",
  alternates: { canonical: "/terms" },
};

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";

const sections = [
  {
    h: "Services",
    p: "Loopsoop provides video editing and post-production services. The specific scope, deliverables, timelines and revisions for each engagement are agreed in writing before work begins.",
  },
  {
    h: "Client Responsibilities",
    p: "You are responsible for providing the raw footage, assets and information needed to complete your project, and for confirming that you hold the necessary rights to any material you supply.",
  },
  {
    h: "Revisions & Delivery",
    p: "Each project includes an agreed number of revision rounds. Final files are delivered once the project is approved. Additional work beyond the agreed scope may be quoted separately.",
  },
  {
    h: "Intellectual Property",
    p: "Upon full payment, you receive the rights to the final delivered edit for the agreed use. Loopsoop may showcase completed work in its portfolio unless otherwise agreed in writing.",
  },
  {
    h: "Limitation of Liability",
    p: "Our services are provided on a best-effort basis. To the extent permitted by law, Loopsoop is not liable for indirect or consequential losses arising from the use of our services or this website.",
  },
];

export default async function TermsPage() {
  const { email } = await getSiteInfo();

  return (
    <>
      {/* ----------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pb-14 pt-32 md:pb-20 md:pt-40">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]" />

        <Container className="relative z-10 max-w-3xl">
          <span className={EYEBROW}>Legal</span>

          <KineticText
            as="h1"
            text="Terms of Service"
            by="words"
            stagger={0.05}
            className="mt-5 block font-display font-normal leading-[0.95] tracking-[-0.02em] text-[clamp(2.5rem,6.8vw,5.25rem)] text-ink"
          />

          <p className={`mt-7 ${EYEBROW}`}>Last updated — August 2026</p>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-[#6b6b6b] md:text-lg">
            These terms govern your use of the {site.name} website and services.
            They are provided as a general template and should be reviewed by a
            qualified professional before publication.
          </p>
        </Container>
      </section>

      {/* --------------------------------------------------------- Clauses */}
      <section className="relative pb-24 md:pb-32">
        <Container className="max-w-3xl">
          <div className="border-t border-line">
            {sections.map((s, i) => (
              <div
                key={s.h}
                className="grid gap-4 border-b border-line py-9 md:grid-cols-[0.85fr_1.15fr] md:gap-12 md:py-11"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-display text-sm tabular-nums text-[#8a8a85]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-xl font-normal leading-tight tracking-[-0.01em] text-ink md:text-2xl">
                    {s.h}
                  </h2>
                </div>
                <p className="text-base leading-relaxed text-[#6b6b6b]">{s.p}</p>
              </div>
            ))}
          </div>

          {/* ------------------------------------------------- Contact card */}
          <div className="mt-14 rounded-[18px] border border-line bg-white p-8 shadow-[0_20px_50px_-30px_rgba(17,17,17,0.18)] md:p-10">
            <span className={EYEBROW}>Questions?</span>
            <p className="mt-4 max-w-md font-display text-xl font-normal leading-snug tracking-[-0.01em] text-ink md:text-2xl">
              Have a question about these terms? We&apos;re happy to help clear
              things up.
            </p>
            <div className="mt-7">
              <MagneticButton href={`mailto:${email}`} ariaLabel={`Email ${email}`}>
                {email}
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
