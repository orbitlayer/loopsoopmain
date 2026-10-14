import type { Metadata } from "next";
import { statsMain, testimonials, trustedClients } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { KineticText } from "@/components/studio/KineticText";
import { LogoLoop } from "@/components/reactbits/LogoLoop";
import { MarqueeReviews } from "@/components/studio/MarqueeReviews";
import { StatBand } from "@/components/studio/StatBand";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";

export const metadata: Metadata = {
  title: "Past Clients",
  description:
    "We've partnered with creators, startups, brands and businesses to produce motion graphics, talking-head edits, 2D animation, real-estate films and commercials that drive attention, engagement and results.",
  alternates: { canonical: "/clients" },
  // This route is intentionally hidden (not in nav/footer/sitemap) and its
  // content largely overlaps the home page. Keep it reachable but out of the
  // index so it isn't an indexable orphan / duplicate. Remove this when the
  // page is promoted (linked + added to the sitemap).
  robots: { index: false, follow: true },
};

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";
const H2 =
  "mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink";

export default function ClientsPage() {
  const stats = statsMain.map((s) => ({ value: s.value, label: s.label }));
  const reviews = testimonials.map((t) => ({
    quote: t.quote,
    name: t.name,
    role: t.role,
    brand: t.brand,
  }));

  return (
    <>
      {/* ----------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[64svh] flex-col justify-center overflow-hidden pb-14 pt-28 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[16%] top-1/2 hidden h-[680px] w-[680px] -translate-y-1/2 opacity-[0.45] lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className={EYEBROW}>Clients</span>

            <h1 className="mt-6 font-display font-normal leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,6.8vw,6rem)]">
              <KineticText
                as="span"
                text="Stories we've created."
                className="block text-ink"
                stagger={0.05}
              />
              <KineticText
                as="span"
                text="Impact we've delivered."
                className="block text-[#8a8a85]"
                stagger={0.05}
              />
            </h1>

            <p className="mt-7 max-w-md text-base leading-relaxed text-[#6b6b6b] md:text-lg">
              We&apos;ve had the privilege of working with amazing creators,
              brands and businesses across the globe. Here are some of them.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <MagneticButton href="/contact">
                Let&apos;s work together
              </MagneticButton>
              <MagneticButton href="/our-work" variant="ghost">
                See the work
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------- Roster */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <span className={EYEBROW}>The roster</span>
          <KineticText
            as="h2"
            text="Brands we've cut for."
            className={`${H2} max-w-xl`}
          />
          <p className="mt-6 max-w-md text-base leading-relaxed text-[#6b6b6b]">
            Creators, startups and household names — the people who trust us with
            their story.
          </p>
        </Container>

        <div className="mt-12 md:mt-14">
          <LogoLoop gap={48} speed={28} className="opacity-70">
            {trustedClients.map((b) => (
              <span
                key={b.name}
                className="whitespace-nowrap text-lg md:text-xl uppercase tracking-[0.14em] text-[#8a8a85]"
              >
                {b.name}
              </span>
            ))}
          </LogoLoop>
        </div>
      </section>

      {/* ------------------------------------------------- Testimonials */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10 mb-14">
          <span className={EYEBROW}>Client love</span>
          <KineticText
            as="h2"
            text="Trusted by the brands you know."
            className={`${H2} max-w-2xl`}
          />
        </Container>
        <MarqueeReviews reviews={reviews} />
      </section>

      {/* ----------------------------------------------------- Results */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-14 md:flex-row md:items-end">
            <div>
              <span className={EYEBROW}>By the numbers</span>
              <KineticText
                as="h2"
                text={"Results that\nspeak for us."}
                by="lines"
                className={H2}
              />
            </div>
            <p className="max-w-sm text-base leading-relaxed text-[#6b6b6b] md:text-right">
              The impact we&apos;ve made for creators and brands around the
              world so far.
            </p>
          </div>
          <StatBand stats={stats} />
        </Container>
      </section>
    </>
  );
}
