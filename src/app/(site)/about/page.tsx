import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { processSteps, site, statsMain, team, values } from "@/lib/data";
import { getSiteInfo, resolvePageMetadata } from "@/lib/content";
import { Icon, InstagramIcon, LinkedinIcon } from "@/lib/icons";
import { Container } from "@/components/ui/Container";
import { Globe } from "@/components/ui/Globe";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { PageStructuredData } from "@/components/PageStructuredData";
import { KineticText } from "@/components/studio/KineticText";
import { MagneticButton } from "@/components/studio/MagneticButton";
import { StatBand } from "@/components/studio/StatBand";
import { StickyProcess } from "@/components/studio/StickyProcess";
import { OrbitRings } from "@/components/studio/motion/OrbitRings";
import { TickerGrid } from "@/components/studio/motion/TickerGrid";

export async function generateMetadata(): Promise<Metadata> {
  return resolvePageMetadata("about");
}

export const dynamic = "force-dynamic";

// "Meet The Team" section is hidden for now — set to true to re-enable it.
const SHOW_TEAM = false;

const EYEBROW = "text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]";
const H2 =
  "mt-5 block font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink";

export default async function AboutPage() {
  const { email } = await getSiteInfo();

  const stats = statsMain.map((s) => ({ value: s.value, label: s.label }));
  const steps = processSteps.map((s) => ({
    n: s.n,
    title: s.title,
    description: s.description,
  }));

  return (
    <>
      <PageStructuredData
        type="AboutPage"
        name="About Loopsoop"
        description="Loopsoop transforms raw footage into cinematic, engaging and high-performing content across motion graphics, talking head, 2D animation, real estate and commercials. Meet the studio and the philosophy behind the edits."
        path="/about"
        crumbs={[
          { name: "Home", path: "" },
          { name: "About", path: "/about" },
        ]}
      />

      {/* ----------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden pb-14 pt-28 md:pb-20 md:pt-36">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-[20%] top-[12%] hidden h-[680px] w-[680px] opacity-[0.5] lg:block"
        >
          <OrbitRings />
        </div>
        <TickerGrid className="opacity-[0.35] [mask-image:radial-gradient(70%_60%_at_50%_35%,black,transparent)]" />

        <Container className="relative z-10">
          <span className={EYEBROW}>About Loopsoop</span>

          <h1 className="mt-6 max-w-[16ch] font-display font-normal leading-[0.95] tracking-[-0.03em] text-[clamp(2.5rem,6.8vw,6rem)]">
            <KineticText
              as="span"
              text="We Craft Visuals."
              className="block text-ink"
              stagger={0.05}
            />
            <KineticText
              as="span"
              text="You Tell Stories."
              className="block text-[#8a8a85]"
              stagger={0.05}
            />
          </h1>

          <p className="mt-8 max-w-xl text-base leading-relaxed text-[#6b6b6b] md:text-lg">
            Loopsoop is the creative division of {site.parent.name} — a studio
            dedicated to premium Video Editing and Graphic Design that helps
            brands communicate, engage and grow.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticButton href="/contact">Let&apos;s work together</MagneticButton>
            <MagneticButton href="/our-work" variant="ghost">
              See our work
            </MagneticButton>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------- Mission */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <span className={EYEBROW}>Our Mission</span>
              <h2 className="mt-5 font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)]">
                <KineticText
                  as="span"
                  text="Empowering brands"
                  className="block text-ink"
                />
                <KineticText
                  as="span"
                  text="through creative excellence."
                  className="block text-[#8a8a85]"
                />
              </h2>
            </div>

            <div className="max-w-xl space-y-6 text-base leading-relaxed text-[#6b6b6b] md:text-lg">
              <p>
                Loopsoop is the creative division of {site.parent.name},
                dedicated to delivering premium Video Editing and Graphic Design
                for creators, startups and growing businesses.
              </p>
              <p>
                While {site.parent.name} specializes in web development, AI
                automation, campaign design and performance marketing, Loopsoop
                focuses entirely on creative execution — crafting high-quality
                visual content that helps brands communicate, engage and grow.
              </p>
              <p>
                Together, we give businesses both technical innovation and
                creative excellence under one trusted ecosystem.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------- Values */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <TickerGrid className="opacity-[0.3] [mask-image:radial-gradient(65%_60%_at_50%_45%,black,transparent)]" />
        <Container className="relative z-10">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
            <div>
              <span className={EYEBROW}>What drives us</span>
              <KineticText
                as="h2"
                text="Principles behind every edit."
                className="mt-5 block max-w-xl font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.9rem,4.6vw,3.5rem)] text-ink"
              />
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-[#6b6b6b]">
              Three beliefs shape how we approach every project, from the first
              frame to the final cut.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {values.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 0.08}
                className="group flex h-full flex-col rounded-[24px] border border-line bg-white p-8 shadow-[0_1px_2px_rgba(17,17,17,0.04),0_24px_60px_-42px_rgba(17,17,17,0.4)] transition-transform duration-500 hover:-translate-y-1 md:p-10"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink">
                    <Icon name={v.icon} className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                  <span className="font-display text-[0.8rem] tracking-[0.25em] text-[#8a8a85] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-8 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-normal leading-[1.05] tracking-[-0.02em] text-ink">
                  {v.title}
                </h3>
                <p className="mt-3 text-[0.98rem] leading-relaxed text-[#6b6b6b]">
                  {v.description}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------- Global reach */}
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
              <span className={EYEBROW}>By the numbers</span>
              <KineticText
                as="h2"
                text={"Impact that travels\nthe world."}
                by="lines"
                className={H2}
              />
              <p className="mt-6 max-w-md text-base leading-relaxed text-[#6b6b6b]">
                From one studio to screens everywhere — the reach we&apos;ve
                built for creators and brands across the globe.
              </p>
            </div>
          </div>
          <div className="mt-12 border-t border-line pt-10">
            <StatBand stats={stats} />
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------- Process */}
      <StickyProcess
        steps={steps}
        eyebrow="How it works"
        heading="From brief to final cut."
      />

      {/* ----------------------------------------------------- Ecosystem */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <Container className="relative z-10">
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-white px-7 py-12 shadow-[0_1px_2px_rgba(17,17,17,0.04),0_30px_80px_-55px_rgba(17,17,17,0.45)] md:px-14 md:py-16">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-[14%] top-1/2 hidden h-[460px] w-[460px] -translate-y-1/2 opacity-[0.55] lg:block"
            >
              <OrbitRings />
            </div>
            <div className="relative z-10 grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <span className={EYEBROW}>Ecosystem</span>
                <h2 className="mt-5 font-display font-normal leading-[0.98] tracking-[-0.02em] text-[clamp(1.75rem,4vw,3rem)]">
                  <KineticText
                    as="span"
                    text={`Part of the ${site.parent.name}`}
                    className="block text-ink"
                  />
                  <KineticText
                    as="span"
                    text="ecosystem."
                    className="block text-[#8a8a85]"
                  />
                </h2>
              </div>
              <div className="flex flex-col items-start gap-7 md:items-end">
                <p className="max-w-md text-base leading-relaxed text-[#6b6b6b] md:text-right">
                  Loopsoop operates under {site.parent.name}, giving clients
                  access to a broader digital ecosystem that combines creative
                  services with web development, AI automation, campaign strategy
                  and performance marketing.
                </p>
                <MagneticButton href={site.parent.url} variant="ghost">
                  Visit {site.parent.name}
                </MagneticButton>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Team — hidden (set SHOW_TEAM = true near the top of this file to re-enable) */}
      {SHOW_TEAM && (
        <section className="py-12 md:py-16">
          <Container>
            <Reveal className="on-dark overflow-hidden rounded-[24px] bg-dark px-6 py-14 md:px-10 md:py-16">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <SectionLabel onDark className="mb-4">
                    Meet The Team
                  </SectionLabel>
                  <h2 className="font-display text-3xl font-medium text-white md:text-[2.4rem]">
                    The People Behind The Edits.
                  </h2>
                </div>
                <p className="max-w-xs text-sm text-dark-muted">
                  A team of passionate editors, storytellers and creatives who
                  live and breathe video.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4">
                {team.map((m, i) => (
                  <Reveal key={m.name} delay={i * 0.08}>
                    <div className="group relative aspect-[3/4] overflow-hidden rounded-[20px] bg-dark-surface">
                      <MediaPlaceholder
                        seed={m.seed}
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className="text-sm font-semibold text-white">
                          {m.name}
                        </h3>
                        <p className="text-xs text-white/60">{m.role}</p>
                        <div className="mt-3 -ml-1.5 flex items-center gap-0.5 text-white/60">
                          <a
                            href={site.socials.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name} on LinkedIn`}
                            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <LinkedinIcon className="h-4 w-4" />
                          </a>
                          <a
                            href={site.socials.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${m.name} on Instagram`}
                            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <InstagramIcon className="h-4 w-4" />
                          </a>
                          <a
                            href={`mailto:${email}`}
                            aria-label={`Email ${m.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Mail className="h-4 w-4" strokeWidth={1.5} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </Container>
        </section>
      )}
    </>
  );
}
