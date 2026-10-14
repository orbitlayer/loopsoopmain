import type { Metadata } from "next";
import {
  projectTypes,
  trustedClients,
  whatsappLink,
} from "@/lib/data";
import { WhatsappIcon } from "@/lib/icons";
import { Container } from "@/components/ui/Container";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { ContactForm } from "@/components/sections/ContactForm";
import { PageStructuredData } from "@/components/PageStructuredData";
import { KineticText } from "@/components/studio/KineticText";
import { LogoLoop } from "@/components/reactbits/LogoLoop";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";
import { getSiteControls } from "@/lib/settings";
import {
  getFaqs,
  getFaqsForEdit,
  getContactCopy,
  getContactCopyForEdit,
  getSiteInfo,
  getSiteDetailsForEdit,
  resolvePageMetadata,
} from "@/lib/content";
import { getSession } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata("contact");
}

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";

const quickStart = projectTypes.filter((t) => t !== "Other");

const AVATARS = [
  "/about/top-left.webp",
  "/about/middle-left.webp",
  "/about/bottom-left.webp",
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  // Kill switch: when the public contact channel is disabled, show a calm
  // "paused" notice instead of the WhatsApp CTAs.
  const { killContact } = await getSiteControls();
  if (killContact) {
    return (
      <section className="flex min-h-[70svh] flex-col items-center justify-center px-6 pb-24 pt-32 text-center md:pt-40">
        <Container>
          <span className={EYEBROW}>Contact</span>
          <h1 className="mx-auto mt-6 max-w-2xl font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink">
            We&apos;re not taking new inquiries{" "}
            <span className="text-[#8a8a85]">right now.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-[#6b6b6b]">
            We&apos;ve paused new project inquiries temporarily. Please check
            back soon — we&apos;d love to hear from you.
          </p>
        </Container>
      </section>
    );
  }

  // Contact copy + FAQs come from the CMS (published), with an admin-only
  // draft preview via ?preview=1.
  const { preview } = await searchParams;
  const isPreview = preview === "1" && Boolean(await getSession());
  const copy = isPreview
    ? (await getContactCopyForEdit()).draft
    : await getContactCopy();
  const faqs = isPreview ? (await getFaqsForEdit()).draft : await getFaqs();
  const info = isPreview
    ? (await getSiteDetailsForEdit()).draft
    : await getSiteInfo();

  return (
    <>
      <PageStructuredData
        type="ContactPage"
        name="Contact Us"
        description="Have a project in mind? Message Loopsoop on WhatsApp and get a tailored quote, usually within a few hours."
        path="/contact"
        crumbs={[
          { name: "Home", path: "" },
          { name: "Contact Us", path: "/contact" },
        ]}
      />
      {isPreview && (
        <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-black shadow-lg shadow-black/20">
          Preview — showing unpublished draft content
        </div>
      )}

      {/* ----------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pb-12 pt-28 md:pb-16 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[16%] top-[8%] hidden h-[620px] w-[620px] opacity-[0.5] lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(70%_60%_at_40%_30%,black,transparent)]" />

        <Container className="relative z-10">
          <span className={EYEBROW}>Contact</span>

          <h1 className="mt-6 max-w-4xl font-display font-normal leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,6.8vw,6rem)]">
            <KineticText
              as="span"
              text="Let's make"
              className="block text-ink"
              stagger={0.05}
            />
            <KineticText
              as="span"
              text="something great."
              className="block text-[#8a8a85]"
              stagger={0.05}
            />
          </h1>

          <p className="mt-7 max-w-md text-base leading-relaxed text-[#6b6b6b] md:text-lg">
            {copy.heroSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticButton href={whatsappLink(info.whatsapp)}>
              Chat on WhatsApp
            </MagneticButton>
            <MagneticButton href="#message" variant="ghost">
              Send a message
            </MagneticButton>
          </div>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex -space-x-2">
              {AVATARS.map((src) => (
                <span
                  key={src}
                  className="h-8 w-8 overflow-hidden rounded-full border-2 border-[#f6f6f4]"
                >
                  <MediaPlaceholder src={src} alt="" />
                </span>
              ))}
            </div>
            <p className="text-sm text-[#6b6b6b]">
              We usually reply within{" "}
              <span className="font-medium text-ink">a few hours.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------- Contact + the form */}
      <section id="message" className="scroll-mt-28 py-16 md:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            {/* Left — contact info / quick-start */}
            <div className="flex flex-col gap-8">
              {/* WhatsApp — the primary channel, on a dark feature card */}
              <div
                id="whatsapp"
                className="on-dark relative scroll-mt-28 overflow-hidden rounded-[24px] bg-dark p-8 text-white md:p-10"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white">
                  <WhatsappIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-6 font-display text-2xl font-normal tracking-[-0.01em] text-white md:text-3xl">
                  {copy.quoteHeading}
                </h2>
                <p className="mt-4 max-w-sm text-sm leading-relaxed text-dark-muted">
                  {copy.quoteBody}
                </p>

                <div className="mt-7 flex flex-col items-start gap-4">
                  <WhatsAppButton
                    variant="invert"
                    className="px-7 py-3.5 text-base"
                    href={whatsappLink(info.whatsapp)}
                  />
                  <a
                    href={`tel:${info.phoneHref}`}
                    className="text-sm text-dark-muted transition-colors hover:text-white"
                  >
                    {info.phone}
                  </a>
                  <span className="text-xs text-dark-faint">{info.hours}</span>
                </div>
              </div>

              {/* Quick-start — prefill a quote message by service */}
              <div>
                <span className={EYEBROW}>Or start with a service</span>
                <div className="mt-5 flex flex-wrap gap-2">
                  {quickStart.map((t) => (
                    <a
                      key={t}
                      href={whatsappLink(
                        info.whatsapp,
                        `Hi LOOPSOOP! I'd like a quote for a ${t} edit.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-line px-4 py-2 text-sm text-[#6b6b6b] transition-colors hover:border-ink hover:text-ink"
                    >
                      {t}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — the stored-inquiry form (restyled wrapper) */}
            <div>
              <span className={EYEBROW}>Prefer a form?</span>
              <KineticText
                as="h2"
                text="Write to us."
                className="mb-7 mt-4 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.6rem,3.6vw,2.4rem)] text-ink"
              />
              <ContactForm projectTypes={quickStart} />
            </div>
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------------- FAQ */}
      <section id="faq" className="relative scroll-mt-28 overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.25] [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <span className={EYEBROW}>FAQ</span>
              <KineticText
                as="h2"
                text={"Quick answers to\ncommon questions."}
                by="lines"
                className="mt-5 block font-display font-normal leading-[0.95] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink"
              />
            </div>
            <div>
              <FaqAccordion faqs={faqs} />
              <div className="mt-8">
                <MagneticButton
                  href={whatsappLink(
                    info.whatsapp,
                    "Hi LOOPSOOP! I have a few questions.",
                  )}
                  variant="ghost"
                >
                  Still have questions? Ask on WhatsApp
                </MagneticButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------- Trusted */}
      <section className="border-t border-line py-14 md:py-16">
        <Container className="mb-8">
          <p className={`${EYEBROW} text-center`}>
            Trusted by creators &amp; brands worldwide
          </p>
        </Container>
        <LogoLoop gap={48} speed={28} className="opacity-70">
          {trustedClients.map((b) => (
            <span
              key={b.name}
              className="whitespace-nowrap text-sm uppercase tracking-[0.18em] text-[#8a8a85]"
            >
              {b.name}
            </span>
          ))}
        </LogoLoop>
      </section>
    </>
  );
}
