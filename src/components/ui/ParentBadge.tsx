import { site } from "@/lib/data";
import { cn } from "@/lib/cn";

/* Subtle badge establishing the Loopsoop → OrbitLayer parent relationship.
   Intentionally minimal so it never competes with the Loopsoop branding. */
export function ParentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs tracking-wide text-muted",
        className,
      )}
    >
      A Creative Division of{" "}
      <span className="font-medium text-ink">{site.parent.name}</span>
    </span>
  );
}
