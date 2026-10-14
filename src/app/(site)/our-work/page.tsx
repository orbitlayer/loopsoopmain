import type { Metadata } from "next";
import { styleIncludes } from "@/lib/data";
import { getVisibleCategories } from "@/lib/categories";
import { getFeaturedProjects } from "@/lib/portfolio";
import { resolvePageMetadata } from "@/lib/content";
import { videoThumbnail } from "@/lib/video";
import { Icon } from "@/lib/icons";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CategoryCard } from "@/components/sections/CategoryCard";
import { PageStructuredData } from "@/components/PageStructuredData";
import { KineticText } from "@/components/studio/KineticText";
import { CircularGallery } from "@/components/studio/CircularGallery";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata("our-work");
}

// Served fresh on every request so category renames / image swaps show
// immediately instead of being pinned by the CDN's long static cache.
export const dynamic = "force-dynamic";

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";
const H2 =
  "mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink";

export default async function OurWorkPage() {
  const categories = await getVisibleCategories();
  const featured = await getFeaturedProjects();

  const projects = featured.map((p, i) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    thumb: videoThumbnail(p),
    href: "/portfolio",
    index: i + 1,
  }));

  return (
    <>
      <PageStructuredData
        name="Our Work"
        description="Explore Loopsoop's work by service - motion graphics, talking-head edits, 2D animation, real estate and commercials."
        path="/our-work"
        crumbs={[
          { name: "Home", path: "" },
          { name: "Our Work", path: "/our-work" },
        ]}
      />

      {/* ----------------------------------------------------------- Hero */}
      <section className="relative flex min-h-[64svh] flex-col justify-center overflow-hidden pb-14 pt-28 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[16%] top-1/2 hidden h-[640px] w-[640px] -translate-y-1/2 opacity-50 lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]" />

        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className={EYEBROW}>Our Work</span>

            <h1 className="mt-6 font-display font-normal leading-[0.9] tracking-[-0.03em] text-[clamp(2.5rem,6.8vw,6rem)]">
              <KineticText
                as="span"
                text="Edit. Elevate."
                className="block text-ink"
                stagger={0.05}
              />
              <KineticText
                as="span"
                text="Tell stories your way."
                className="block text-[#8a8a85]"
                stagger={0.05}
              />
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#6b6b6b] md:text-lg">
              Motion graphics, talking-head edits, 2D animation, real-estate
              films and commercials - crafted for creators and brands. Pick a
              service to see the matching work.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <MagneticButton href="#work">Explore the work</MagneticButton>
              <MagneticButton href="/contact" variant="ghost">
                Start a project
              </MagneticButton>
            </div>
          </div>
        </Container>

        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
          <span className={EYEBROW}>Scroll to explore the work</span>
        </div>
      </section>

      {/* -------------------------------------------- Featured work carousel */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className={EYEBROW}>Selected</span>
              <KineticText as="h2" text="Work in motion." className={H2} />
            </div>
            <MagneticButton href="/portfolio" variant="ghost">
              View full portfolio
            </MagneticButton>
          </div>
        </Container>
        <CircularGallery projects={projects} className="mt-10" />
      </section>

      {/* ---------------------------------------------------- Category grid */}
      {/* Each card deep-links into the filtered portfolio — functional core. */}
      <section
        id="work"
        className="relative scroll-mt-24 overflow-hidden py-14 md:py-20"
      >
        <Container className="relative z-10">
          <div className="max-w-2xl">
            <span className={EYEBROW}>Explore by service</span>
            <KineticText
              as="h2"
              text="Five things we do best."
              className={H2}
            />
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={(i % 3) * 0.08}>
                <CategoryCard category={c} index={i} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------- What you get per edit */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="max-w-2xl">
            <span className={EYEBROW}>In every edit</span>
            <KineticText
              as="h2"
              text="The full studio treatment."
              className={H2}
            />
            <p className="mt-6 max-w-md text-base leading-relaxed text-[#6b6b6b]">
              Every project ships with the full studio treatment — the craft
              that turns raw footage into a story worth watching.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {styleIncludes.map((f, i) => (
              <Reveal
                key={f.title}
                delay={(i % 5) * 0.06}
                className="flex h-full flex-col rounded-[20px] border border-line bg-white p-6 shadow-[0_20px_50px_-30px_rgba(17,17,17,0.18)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-ink">
                  <Icon name={f.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-medium text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">
                  {f.description}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ----------------------------------------------------- CTA closer */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.4]"
        >
          <OrbitRings />
        </div>
        <Container className="relative z-10">
          <div className="mx-auto max-w-2xl text-center">
            <span className={EYEBROW}>Start a project</span>
            <KineticText
              as="h2"
              text="Let's make something worth watching."
              className={`${H2} mx-auto`}
            />
            <p className="mt-6 text-base leading-relaxed text-[#6b6b6b]">
              Tell us what you&apos;re building and we&apos;ll shape the edit
              around it — from first brief to final cut.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <MagneticButton href="/contact">Start a project</MagneticButton>
              <MagneticButton href="/portfolio" variant="ghost">
                See the portfolio
              </MagneticButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
