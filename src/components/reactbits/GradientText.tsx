/*
 * GradientText — a monochrome recreation of reactbits.dev's "Gradient Text".
 * The text is painted from a linear-gradient clipped to the glyphs. Light theme
 * runs ink -> faint -> ink; `onDark` runs white -> grey -> white. When `animate`
 * is set, the gradient position drifts back and forth for a slow shimmer.
 *
 * Pure CSS, so it is SSR-safe and renders its real text in the server HTML.
 * prefers-reduced-motion falls back to a static gradient (no drift).
 * Keyframes live in GradientText.module.css.
 */

import { cn } from "@/lib/cn";
import styles from "./GradientText.module.css";

export type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
  /** Drift the gradient position. Default true. */
  animate?: boolean;
  /** Flip the gradient stops for placement on dark surfaces. */
  onDark?: boolean;
};

export function GradientText({
  children,
  className,
  animate = true,
  onDark = false,
}: GradientTextProps) {
  const style = {
    "--g1": onDark ? "#ffffff" : "#111111",
    "--g2": onDark ? "#9a9a9a" : "#8a8a85",
  } as React.CSSProperties;

  return (
    <span
      className={cn(styles.gradient, animate && styles.animate, className)}
      style={style}
    >
      {children}
    </span>
  );
}
