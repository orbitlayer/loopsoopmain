/*
 * Grain — a fixed, full-viewport film-grain overlay for the light shell. A tiled,
 * desaturated SVG fractalNoise sits at low opacity over everything (z-[80],
 * pointer-events-none, aria-hidden) and a slow steps() animation nudges it one
 * tile per loop for a subtle flicker. Monochrome (saturation stripped) so it
 * reads as a faint dark grain on the off-white page and never tints the design.
 * No hooks or browser APIs, so it is a server component
 * and renders identically on the server — the reduced-motion / static fallback
 * lives in the co-located CSS, never blocking interaction.
 */

import { cn } from "@/lib/cn";
import styles from "./Grain.module.css";

export type GrainProps = {
  /** Overlay strength, clamped to [0, 1]. Default 0.04. */
  opacity?: number;
  className?: string;
};

export function Grain({ opacity = 0.04, className }: GrainProps) {
  const o = Math.min(1, Math.max(0, opacity));
  return (
    <div
      aria-hidden="true"
      className={cn(styles.grain, "pointer-events-none fixed inset-0 z-[80]", className)}
      style={{ opacity: o }}
    />
  );
}
