import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Globe } from "@/components/ui/Globe";
import { CountUp } from "@/components/reactbits/CountUp";

type Stat = { value: string; label: string; icon: string };

/*
 * Global-reach band: the studio's headline stats paired with an interactive
 * globe, on the site's dark surface. The globe sits beside the stats on large
 * screens and above them when stacked. Reuses the StatsBand stat styling.
 */
export function GlobalReachBand({ stats }: { stats: Stat[] }) {
  return (
    <Container>
      <div className="on-dark overflow-hidden rounded-[24px] bg-dark px-6 py-12 md:px-10 md:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
          {/* Globe */}
          <Reveal className="order-1 lg:order-none">
            <Globe className="max-w-[300px] sm:max-w-[360px] lg:max-w-[420px]" />
          </Reveal>

          {/* Copy + stats */}
          <div className="order-2 lg:order-none">
            <Reveal>
              <SectionLabel onDark className="mb-4">
                Global Reach
              </SectionLabel>
              <h2 className="font-display text-3xl font-medium leading-tight text-white md:text-[2.6rem]">
                Work that travels{" "}
                <span className="text-dark-faint">the world.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-dark-muted">
                From one studio to screens everywhere — here&apos;s the impact
                we&apos;ve made for creators and brands so far.
              </p>
            </Reveal>

            <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-8">
              {stats.map((s, i) => (
                <Reveal
                  key={s.label}
                  delay={i * 0.08}
                  className={cn(
                    "flex flex-col border-white/10 pl-4 sm:pl-6",
                    i % 2 === 1 && "border-l",
                  )}
                >
                  <Icon name={s.icon} className="mb-3 h-6 w-6 text-white/80" />
                  <div className="font-display text-3xl font-semibold text-white md:text-4xl">
                    <CountUp value={s.value} />
                  </div>
                  <div className="mt-1.5 text-xs text-dark-muted md:text-sm">
                    {s.label}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
