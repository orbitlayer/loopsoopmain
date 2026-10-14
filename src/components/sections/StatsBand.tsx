import { cn } from "@/lib/cn";
import { Icon } from "@/lib/icons";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";

type Stat = { value: string; label: string; icon: string };

export function StatsBand({
  stats,
  className,
  contained = true,
}: {
  stats: Stat[];
  className?: string;
  contained?: boolean;
}) {
  const band = (
    <div
      className={cn(
        "on-dark grid grid-cols-2 gap-y-10 rounded-[24px] bg-dark px-6 py-12 md:grid-cols-4 md:gap-y-0 md:px-4 md:py-14",
        className,
      )}
    >
      {stats.map((s, i) => (
        <Reveal
          key={s.label}
          delay={i * 0.08}
          className={cn(
            "flex flex-col items-center px-4 text-center",
            i % 2 === 1 && "border-l border-white/10",
            "md:border-l md:border-white/10",
            i === 0 && "md:border-l-0",
          )}
        >
          <Icon name={s.icon} className="mb-4 h-6 w-6 text-white/80" />
          <div className="font-display text-3xl font-semibold text-white md:text-4xl">
            {s.value}
          </div>
          <div className="mt-1.5 text-xs text-dark-muted md:text-sm">
            {s.label}
          </div>
        </Reveal>
      ))}
    </div>
  );

  return contained ? <Container>{band}</Container> : band;
}
