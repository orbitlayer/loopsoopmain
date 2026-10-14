import { cn } from "@/lib/cn";
import type { Brand } from "@/lib/data";

const styleClasses: Record<NonNullable<Brand["style"]>, string> = {
  serif: "font-serif italic tracking-tight",
  italic: "italic font-bold tracking-tight",
  wide: "font-semibold tracking-[0.28em]",
  black: "font-black tracking-tight",
};

export function BrandMark({
  brand,
  onDark = false,
  className,
}: {
  brand: Brand;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "select-none whitespace-nowrap text-lg md:text-xl transition-opacity duration-300",
        onDark
          ? "text-white/55 hover:text-white"
          : "text-ink/45 hover:text-ink",
        brand.style ? styleClasses[brand.style] : "font-semibold tracking-tight",
        className,
      )}
    >
      {brand.name}
    </span>
  );
}
