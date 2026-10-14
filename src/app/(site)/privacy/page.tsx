import type { Metadata } from "next";
import { site } from "@/lib/data";
import { getSiteInfo } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { KineticText } from "@/components/studio/KineticText";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Loopsoop collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";

export default async function PrivacyPage() {
  const { email } = await getSiteInfo();

  const sections = [
    {
      h: "Information We Collect",
      p: "When you contact us or submit a project enquiry, we collect the details you provide - such as your name, email address, phone number, company and project description. We may also collect basic, anonymised analytics about how visitors use this website.",
    },
    {
      h: "How We Use Your Information",
      p: "We use your information solely to respond to your enquiry, deliver our editing services, communicate about your project, and improve our website. We do not sell your personal information.",
    },
    {
      h: "Sharing & Third Parties",
      p: "We only share information with trusted service providers that help us operate (for example, email delivery and hosting). These providers process data on our behalf and are bound by confidentiality obligations.",
    },
    {
      h: "Data Retention",
      p: "We keep enquiry and project information only for as long as necessary to provide our services and meet legal or business requirements, after which it is deleted or anonymised.",
    },
    {
      h: "Your Rights",
      p: `You can request access to, correction of, or deletion of your personal data at any time by emailing ${email}.`,
    },
  ];

  return (
    <>
      {/* -------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(70%_60%_at_50%_30%,black,transparent)]" />
        <Container className="relative z-10">
          <span className={EYEBROW}>Legal</span>
          <KineticText
            as="h1"
            text="Privacy Policy"
            className="mt-5 block font-display font-normal leading-[0.95] tracking-[-0.02em] text-[clamp(2.5rem,6.8vw,5rem)] text-ink"
          />
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#6b6b6b]">
            This policy explains how {site.name} handles the information you
            share with us. It is provided as a general template and should be
            reviewed by a qualified professional before publication.
          </p>
          <p className={`mt-7 ${EYEBROW}`}>Last updated — August 2026</p>
        </Container>
      </section>

      {/* -------------------------------------------------------- Body */}
      <section className="relative pb-24 md:pb-32">
        <Container>
          <div className="max-w-2xl">
            <dl className="border-t border-line">
              {sections.map((s) => (
                <div
                  key={s.h}
                  className="border-b border-line py-10 md:py-12"
                >
                  <dt className="font-display text-xl font-normal tracking-[-0.01em] text-ink md:text-2xl">
                    {s.h}
                  </dt>
                  <dd className="mt-4 text-base leading-relaxed text-[#6b6b6b]">
                    {s.p}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-14 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <p className="text-base leading-relaxed text-[#6b6b6b]">
                Questions about this policy? Reach us at{" "}
                <a
                  href={`mailto:${email}`}
                  className="text-ink underline underline-offset-4 decoration-[#c9c9c4] transition-colors hover:decoration-ink"
                >
                  {email}
                </a>
                .
              </p>
              <MagneticButton href={`mailto:${email}`} variant="ghost">
                Email us
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
