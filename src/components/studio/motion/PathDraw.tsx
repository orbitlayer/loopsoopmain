"use client";

/*
 * PathDraw — a self-drawing line-art accent. An SVG path (a tasteful flowing
 * squiggle by default, overridable) draws itself once when it scrolls into view
 * (IntersectionObserver, disconnected after the first hit), then a subtle glint
 * travels along the line on an idle loop. Monochrome ink on near-white.
 *
 * The draw is implemented with pathLength={1} so stroke-dasharray / -dashoffset
 * work in normalised [0,1] units for any path — no getTotalLength() measuring
 * needed. SSR renders the undrawn state (offset 1) deterministically; the effect
 * flips it, so there is no hydration mismatch. prefers-reduced-motion draws the
 * line fully and immediately and skips the glint. Decorative → aria-hidden.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./PathDraw.module.css";

export type PathDrawProps = {
  /** SVG path data. Has a tasteful flowing default. */
  d?: string;
  /** viewBox for the path's coordinate space. */
  viewBox?: string;
  className?: string;
  /** Stroke width in viewBox units. Default 2.5. */
  strokeWidth?: number;
  /** Draw duration in seconds. Default 1.4. */
  duration?: number;
};

const DEFAULT_D =
  "M4 48 C 52 8, 104 8, 150 40 C 188 66, 236 66, 296 24";

export function PathDraw({
  d = DEFAULT_D,
  viewBox = "0 0 300 80",
  className,
  strokeWidth = 2.5,
  duration = 1.4,
}: PathDrawProps) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [shimmer, setShimmer] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      // Nothing to observe: the module's @media (prefers-reduced-motion) rule
      // forces the line fully drawn (overriding the inline dashoffset) and hides
      // the glint, so the composed, finished frame shows with no JS state change.
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setDrawn(true);
            // Start the idle glint only once the line has finished drawing.
            timer = setTimeout(
              () => setShimmer(true),
              Math.round(duration * 1000),
            );
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [duration]);

  return (
    <svg
      ref={ref}
      className={cn(styles.root, className)}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* The drawing line: dashoffset eases from 1 (hidden) to 0 (drawn). */}
      <path
        d={d}
        pathLength={1}
        fill="none"
        stroke="rgba(17,17,17,0.8)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.line}
        style={{
          strokeDasharray: 1,
          strokeDashoffset: drawn ? 0 : 1,
          transition: `stroke-dashoffset ${duration}s cubic-bezier(0.16, 1, 0.3, 1)`,
        }}
      />

      {/* Idle glint travelling along the same geometry, after the draw. */}
      {shimmer && (
        <path
          d={d}
          pathLength={1}
          fill="none"
          stroke="rgba(17,17,17,0.95)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.glint}
        />
      )}
    </svg>
  );
}
