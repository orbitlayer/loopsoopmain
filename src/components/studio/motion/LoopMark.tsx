/*
 * LoopMark — an animated infinity / loop brand mark for "Loopsoop".
 * A lemniscate drawn in SVG with a faint static track + soft glow, plus a
 * bright segment whose stroke-dashoffset animates so light appears to flow
 * endlessly around the loop (pathLength is normalised to 100 for a seamless
 * cycle). Pure CSS → server component. prefers-reduced-motion shows the loop
 * drawn solid and still. Decorative (aria-hidden).
 */
import { cn } from "@/lib/cn";
import styles from "./LoopMark.module.css";

const PATH =
  "M100 50 C100 22 56 22 56 50 C56 78 100 78 100 50 C100 22 144 22 144 50 C144 78 100 78 100 50 Z";

export function LoopMark({
  className,
  strokeWidth = 3,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={cn(styles.root, className)}
      viewBox="0 0 200 100"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* soft glow */}
      <path
        d={PATH}
        fill="none"
        stroke="rgba(17,17,17,0.06)"
        strokeWidth={strokeWidth * 2.6}
        strokeLinecap="round"
      />
      {/* faint full track */}
      <path
        d={PATH}
        fill="none"
        stroke="rgba(17,17,17,0.12)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {/* flowing highlight */}
      <path
        className={styles.flow}
        d={PATH}
        fill="none"
        stroke="rgba(17,17,17,0.95)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={100}
      />
    </svg>
  );
}
