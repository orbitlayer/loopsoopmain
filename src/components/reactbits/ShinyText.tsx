/*
 * ShinyText — a monochrome recreation of reactbits.dev's "Shiny Text".
 * A soft light sheen sweeps across the text on a loop. The text colour is
 * painted from a moving linear-gradient clipped to the glyphs (background-clip:
 * text): a muted base with an inkier highlight band that travels across. On the
 * light theme the sweep is a darker-to-ink shimmer over muted text; `onDark`
 * flips the stops to a near-white highlight over light-grey for dark surfaces.
 *
 * Pure CSS, so it is SSR-safe and renders its final readable text in the server
 * HTML with no hydration work. prefers-reduced-motion and `disabled` both fall
 * back to static, fully readable text. Keyframes live in ShinyText.module.css.
 */

import { cn } from "@/lib/cn";
import styles from "./ShinyText.module.css";

export type ShinyTextProps = {
  text: string;
  className?: string;
  /** Seconds per sheen sweep. Default 4. */
  speed?: number;
  /** Render as plain, un-animated text. */
  disabled?: boolean;
  /** Flip the gradient stops for placement on dark surfaces. */
  onDark?: boolean;
};

export function ShinyText({
  text,
  className,
  speed = 4,
  disabled = false,
  onDark = false,
}: ShinyTextProps) {
  if (disabled) {
    return <span className={className}>{text}</span>;
  }

  const style = {
    "--shine-base": onDark ? "#9a9a9a" : "#6b6b6b",
    "--shine-hi": onDark ? "#ffffff" : "#111111",
    "--shine-speed": `${speed}s`,
  } as React.CSSProperties;

  return (
    <span className={cn(styles.shiny, className)} style={style}>
      {text}
    </span>
  );
}
