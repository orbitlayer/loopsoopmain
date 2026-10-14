import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function SectionHeading({
  label,
  title,
  action,
  onDark = false,
  size = "md",
  center = false,
  className,
}: {
  label?: React.ReactNode;
  title: React.ReactNode;
  action?: React.ReactNode;
  onDark?: boolean;
  size?: "md" | "lg";
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        center && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <Reveal className={cn(center && "flex flex-col items-center")}>
        {label && (
          <SectionLabel onDark={onDark} className="mb-4">
            {label}
          </SectionLabel>
        )}
        <h2
          className={cn(
            "font-display font-medium leading-[1.05]",
            size === "lg"
              ? "text-4xl md:text-5xl"
              : "text-3xl md:text-[2.6rem]",
            onDark ? "text-white" : "text-ink",
          )}
        >
          {title}
        </h2>
      </Reveal>
      {action && <Reveal delay={0.1}>{action}</Reveal>}
    </div>
  );
}
