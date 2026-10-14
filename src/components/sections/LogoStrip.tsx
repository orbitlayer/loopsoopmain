import { cn } from "@/lib/cn";
import type { Brand } from "@/lib/data";
import { BrandMark } from "@/components/ui/BrandMark";

/* Static, evenly spaced row with a leading label (home mockup) */
export function LogoRow({
  brands,
  label,
  className,
}: {
  brands: Brand[];
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-8 gap-y-6 md:justify-between",
        className,
      )}
    >
      {label && (
        <span className="eyebrow shrink-0">{label}</span>
      )}
      {brands.map((b) => (
        <BrandMark key={b.name} brand={b} />
      ))}
    </div>
  );
}

/* Auto-scrolling marquee with edge fades (clients / contact) */
export function LogoMarquee({
  brands,
  onDark = false,
  className,
}: {
  brands: Brand[];
  onDark?: boolean;
  className?: string;
}) {
  const track = [...brands, ...brands];
  return (
    <div
      className={cn(
        "marquee-pause relative overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
        className,
      )}
    >
      <div className="animate-marquee flex w-max items-center gap-x-16">
        {track.map((b, i) => (
          <BrandMark key={`${b.name}-${i}`} brand={b} onDark={onDark} />
        ))}
      </div>
    </div>
  );
}
