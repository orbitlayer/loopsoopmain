import type { Metadata } from "next";
import { processSteps, statsMain, trustedHome } from "@/lib/data";
import { getFeaturedProjects } from "@/lib/portfolio";
import { getVisibleCategories } from "@/lib/categories";
import { resolvePageMetadata } from "@/lib/content";
import { videoThumbnail } from "@/lib/video";
import { Container } from "@/components/ui/Container";
import { HeroCards } from "@/components/sections/HeroCards";
import { Globe } from "@/components/ui/Globe";
import { KineticText } from "@/components/studio/KineticText";
import { CircularGallery } from "@/components/studio/CircularGallery";
import { ScrollStack } from "@/components/studio/ScrollStack";
import { StickyProcess } from "@/components/studio/StickyProcess";
import { StatBand } from "@/components/studio/StatBand";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";
import { LogoLoop } from "@/components/reactbits/LogoLoop";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata("home");
}

export const dynamic = "force-dynamic";

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";
const H2 =
  "mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink";

export default async function HomePage() {
  const featured = await getFeaturedProjects();
  const visibleCategories = await getVisibleCategories();

  const projects = featured.map((p, i) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    thumb: videoThumbnail(p),
    href: "/portfolio",
    index: i + 1,
  }));
  const services = visibleCategories.slice(0, 6).map((c) => ({
    title: c.name,
    description: c.description,
  }));
  const steps = processSteps.map((s) => ({
    n: s.n,
    title: s.title,
    description: s.description,
  }));
  const stats = statsMain.map((s) => ({ value: s.value, label: s.label }));

  return (
    <>
      {/* ----------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[86svh] flex-col justify-center overflow-hidden pb-14 pt-28 md:min-h-[82svh] md:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[18%] top-1/2 hidden h-[760px] w-[760px] -translate-y-1/2 opacity-[0.5] lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

        <Container className="relative z-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            <div>
              <h1 className="font-display font-normal leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,6.8vw,6rem)]">
                <KineticText
                  as="span"
                  text="Crafted Edits."
                  className="block text-ink"
                  stagger={0.05}
                />
                <KineticText
                  as="span"
                  text="Real Impact."
                  className="block text-[#8a8a85]"
                  stagger={0.05}
                />
              </h1>

              <p className="mt-7 max-w-md text-base leading-relaxed text-[#6b6b6b] md:text-lg">
                A creative studio crafting cinematic video edits and motion
                design for creators, brands and businesses worldwide.
              </p>

              {/* Desktop CTAs live in the text column. */}
              <div className="mt-9 hidden flex-wrap items-center gap-4 lg:flex">
                <MagneticButton href="/our-work">Explore Work</MagneticButton>
                <MagneticButton href="/contact" variant="ghost">
                  Start a project
                </MagneticButton>
              </div>
            </div>

            <div className="relative">
              <HeroCards />
            </div>

            {/* On mobile the CTAs sit below the cards (positions swapped),
                centred. */}
            <div className="flex flex-col items-center gap-4 lg:hidden">
              <MagneticButton href="/our-work">Explore Work</MagneticButton>
              <MagneticButton href="/contact" variant="ghost">
                Start a project
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------- Our Work carousel */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className={EYEBROW}>Selected</span>
              <KineticText as="h2" text="Our Work." className={H2} />
            </div>
            <MagneticButton href="/portfolio" variant="ghost">
              View all projects
            </MagneticButton>
          </div>
        </Container>
        <CircularGallery projects={projects} className="mt-10" />
      </section>

      {/* --------------------------------------------------- Services */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <span className={EYEBROW}>What we do</span>
          <KineticText
            as="h2"
            text="Built around your story."
            className={`${H2} max-w-xl`}
          />
        </Container>
        <ScrollStack
          items={services}
          className="mt-10 md:mt-14"
        />
      </section>

      {/* ---------------------------------------------------- Process */}
      <StickyProcess
        steps={steps}
        eyebrow="How it works"
        heading="From brief to final cut."
      />

      {/* ----------------------------------------------- Global reach */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr]">
            <div className="relative mx-auto w-full max-w-[460px]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 scale-125 opacity-60"
              >
                <OrbitRings />
              </div>
              <div className="relative">
                <Globe />
              </div>
            </div>
            <div>
              <span className={EYEBROW}>Global Reach</span>
              <KineticText
                as="h2"
                text={"Work that travels\nthe world."}
                by="lines"
                className={H2}
              />
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#6b6b6b]">
                From one studio to screens everywhere — the impact we&apos;ve
                made for creators and brands so far.
              </p>
            </div>
          </div>
          <div className="mt-12 border-t border-line pt-10">
            <StatBand stats={stats} />
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------- Trusted by */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <p className={`${EYEBROW} mb-6 text-center`}>Trusted by</p>
          <LogoLoop gap={48} speed={28} className="opacity-70">
            {trustedHome.map((b) => (
              <span
                key={b.name}
                className="whitespace-nowrap text-sm uppercase tracking-[0.18em] text-[#8a8a85]"
              >
                {b.name}
              </span>
            ))}
          </LogoLoop>
        </Container>
      </section>
    </>
  );
}
