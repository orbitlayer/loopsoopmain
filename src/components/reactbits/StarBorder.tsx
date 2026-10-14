/*
 * StarBorder — a monochrome recreation of reactbits.dev's "Star Border".
 * Wraps content in a rounded pill with two soft glints that orbit the border,
 * giving a light-sweeping-around-the-edge sheen. The inner content sits on a
 * solid surface (bg-surface on light, bg-dark when onDark) with a full hairline
 * ring, and the glints peek through the thin padding band around it.
 *
 * Pure CSS (no client JS), so it is SSR-safe and renders its real children in
 * the server HTML. Monochrome: ink glints on light surfaces, white on dark.
 * prefers-reduced-motion hides the travelling glints and leaves the static ring.
 * The glints are pointer-events:none, so wrapping a Button/link never swallows
 * clicks. Keyframes live in StarBorder.module.css.
 */

import { cn } from "@/lib/cn";
import styles from "./StarBorder.module.css";

export type StarBorderProps = {
  children: React.ReactNode;
  /** Element to render as. Default "div". */
  as?: "div" | "span" | "button";
  className?: string;
  /** Seconds per orbit. Default 6. */
  speed?: number;
  /** Flip glints to white + lighten the ring for dark surfaces. */
  onDark?: boolean;
};

export function StarBorder({
  children,
  as = "div",
  className,
  speed = 6,
  onDark = false,
}: StarBorderProps) {
  const style = {
    "--sb-speed": `${speed}s`,
    "--sb-glint": onDark ? "#ffffff" : "#111111",
    "--sb-ring": onDark ? "rgba(255, 255, 255, 0.16)" : "rgba(17, 17, 17, 0.14)",
  } as React.CSSProperties;

  const Tag = as as React.ElementType;
  const extra = as === "button" ? { type: "button" as const } : {};

  return (
    <Tag className={cn(styles.container, className)} style={style} {...extra}>
      <span className={cn(styles.glint, styles.bottom)} aria-hidden="true" />
      <span className={cn(styles.glint, styles.top)} aria-hidden="true" />
      <span className={cn(styles.inner, onDark ? "bg-dark" : "bg-surface")}>
        {children}
      </span>
    </Tag>
  );
}
