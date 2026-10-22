import type { Metadata } from "next";
import { categorySlugToName, statsWork } from "@/lib/data";
import { getPortfolioProjects } from "@/lib/portfolio";
import { getVisibleCategories, getVisibleCategoryNames } from "@/lib/categories";
import { resolvePageMetadata } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { WorkGrid } from "@/components/sections/WorkGrid";
import { CategoryCard } from "@/components/sections/CategoryCard";
import { PageStructuredData } from "@/components/PageStructuredData";
import { KineticText } from "@/components/studio/KineticText";
import { StatBand } from "@/components/studio/StatBand";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata("portfolio");
}

// Always render fresh so videos added/edited in the admin panel appear
// immediately with no redeploy.
export const dynamic = "force-dynamic";

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const initialCategory = categorySlugToName(category) ?? "All Work";
  const { projects, error } = await getPortfolioProjects();
  const categories = await getVisibleCategories();
  const filters = ["All Work", ...(await getVisibleCategoryNames())];
  const stats = statsWork.map((s) => ({ value: s.value, label: s.label }));

  return (
    <>
      <PageStructuredData
        name="Video Editing Portfolio"
        description="From raw footage to real impact - explore Loopsoop's portfolio of long-form and short-form video edits crafted for brands, creators, startups and businesses."
        path="/portfolio"
        crumbs={[
          { name: "Home", path: "" },
          { name: "Our Work", path: "/our-work" },
          { name: "Portfolio", path: "/portfolio" },
        ]}
      />

      {/* --------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pb-10 pt-28 md:pb-14 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[16%] top-24 hidden h-[560px] w-[560px] opacity-[0.45] lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(72%_60%_at_50%_30%,black,transparent)]" />

        <Container className="relative z-10">
          <span className={EYEBROW}>Portfolio</span>
          <h1 className="mt-5 font-display font-normal leading-[0.95] tracking-[-0.02em] text-[clamp(2.5rem,6.8vw,6rem)]">
            <KineticText
              as="span"
              text="Video Editing"
              className="block text-ink"
              stagger={0.05}
            />
            <KineticText
              as="span"
              text="Portfolio."
              className="block text-[#8a8a85]"
              stagger={0.05}
            />
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#6b6b6b] md:text-lg">
            From raw footage to real impact — explore Loopsoop&apos;s portfolio
            of long-form and short-form video edits crafted for brands,
            creators, startups and businesses.
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------ Browse by service */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <div className="max-w-2xl">
            <span className={EYEBROW}>Explore by service</span>
            <KineticText
              as="h2"
              text="What we do best."
              className="mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink"
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

      {/* ----------------------------------------- Gallery (functional) */}
      <WorkGrid
        initialCategory={initialCategory}
        className="pt-2 md:pt-4"
        projects={projects}
        loadError={error}
        filters={filters}
      />

      {/* ------------------------------------------------------- Stats */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="mb-10 max-w-xl md:mb-14">
            <span className={EYEBROW}>By the numbers</span>
            <KineticText
              as="h2"
              text="Proof in the playback."
              className="mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink"
            />
          </div>
          <StatBand stats={stats} />
        </Container>
      </section>
    </>
  );
}
