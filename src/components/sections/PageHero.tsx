import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { HeroAurora } from "@/components/ui/HeroAurora";

/* Shared inner-page hero.
   Default: label + headline + copy on the left, a large edge-bleeding image
   on the right (lg+). `centered`: a clean, image-free centered hero. */
export function PageHero({
  label,
  title,
  subtitle,
  action,
  extra,
  seed = 24,
  play = false,
  centered = false,
  image,
  imageAlt,
}: {
  label: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  action?: React.ReactNode;
  extra?: React.ReactNode;
  seed?: number;
  play?: boolean;
  centered?: boolean;
  image?: string;
  imageAlt?: string;
}) {
  if (centered) {
    return (
      <section className="relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-44">
        <HeroAurora />
        <Container className="relative z-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Reveal immediate>
              <SectionLabel className="mb-5">{label}</SectionLabel>
            </Reveal>
            <Reveal immediate delay={0.05}>
              <h1 className="font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
                {title}
              </h1>
            </Reveal>
            <Reveal immediate delay={0.12}>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                {subtitle}
              </p>
            </Reveal>
            {action && (
              <Reveal immediate delay={0.18} className="mt-8">
                {action}
              </Reveal>
            )}
            {extra && (
              <Reveal immediate delay={0.24} className="mt-8">
                {extra}
              </Reveal>
            )}
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden pb-16 pt-32 md:pb-20 md:pt-40 lg:min-h-[600px]">
      <HeroAurora />
      {/* Edge-bleed image (desktop) */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[48%] lg:block">
        <MediaPlaceholder
          seed={seed}
          src={image}
          alt={imageAlt}
          play={play}
          playSize="lg"
          className="group h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/25 to-transparent" />
      </div>

      <Container className="relative z-10">
        <div className="max-w-xl">
          <Reveal immediate>
            <SectionLabel className="mb-5">{label}</SectionLabel>
          </Reveal>
          <Reveal immediate delay={0.05}>
            <h1 className="font-display text-4xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
              {title}
            </h1>
          </Reveal>
          <Reveal immediate delay={0.12}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted md:text-lg">
              {subtitle}
            </p>
          </Reveal>
          {action && (
            <Reveal immediate delay={0.18} className="mt-8">
              {action}
            </Reveal>
          )}
          {extra && (
            <Reveal immediate delay={0.24} className="mt-8">
              {extra}
            </Reveal>
          )}
        </div>

        {/* Contained image (mobile / tablet) */}
        <Reveal delay={0.1} className="mt-10 lg:hidden">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[20px]">
            <MediaPlaceholder
              seed={seed}
              src={image}
              alt={imageAlt}
              play={play}
              playSize="md"
              className="group"
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
