/*
 * TickerGrid — a low-key animated 2D section-background motif. A field of small
 * ink "+" marks tiled on a grid, with a faint diagonal highlight that sweeps
 * across on a loop, evoking a timeline / technical canvas. Monochrome, very low
 * alpha, meant to sit behind content (absolute inset-0, pointer-events-none,
 * aria-hidden — all baked in, so just drop it inside a `relative` parent).
 *
 * The plus tile is an inline SVG data URI used as a repeating CSS background,
 * sized to `gap` px — no DOM ids (so multiple instances never collide) and no
 * JS, so this is a server component. A second, brighter copy of the field is
 * masked by a moving diagonal gradient band to produce the sweep (CSS @keyframes
 * in the module). Reduced motion hides the sweep, leaving the static field.
 */

import { cn } from "@/lib/cn";
import styles from "./TickerGrid.module.css";

export type TickerGridProps = {
  className?: string;
  /** Grid spacing in px. Default 32. */
  gap?: number;
};

// Build a single "+" tile as a data-URI background image. Deterministic (no
// Math.random), so SSR and client markup match.
function plusTile(gap: number, alpha: number): string {
  const c = gap / 2;
  const arm = Math.max(2, Math.min(gap / 6, 3.5));
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${gap}' height='${gap}' viewBox='0 0 ${gap} ${gap}'>` +
    `<g stroke='rgba(17,17,17,${alpha})' stroke-width='1' stroke-linecap='round'>` +
    `<line x1='${c - arm}' y1='${c}' x2='${c + arm}' y2='${c}'/>` +
    `<line x1='${c}' y1='${c - arm}' x2='${c}' y2='${c + arm}'/>` +
    `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function TickerGrid({ className, gap = 32 }: TickerGridProps) {
  const size = Math.max(10, gap);
  const backgroundSize = `${size}px ${size}px`;

  return (
    <div
      className={cn(
        styles.root,
        "absolute inset-0 overflow-hidden pointer-events-none",
        className,
      )}
      aria-hidden="true"
    >
      {/* Static base field */}
      <div
        className={styles.field}
        style={{ backgroundImage: plusTile(size, 0.08), backgroundSize }}
      />
      {/* Brighter field, revealed only under the moving diagonal sweep */}
      <div
        className={cn(styles.field, styles.sweep)}
        style={{ backgroundImage: plusTile(size, 0.25), backgroundSize }}
      />
    </div>
  );
}
