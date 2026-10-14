import { cn } from "@/lib/cn";

export function SectionLabel({
  children,
  onDark = false,
  className,
}: {
  children: React.ReactNode;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eyebrow block",
        onDark && "text-dark-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
