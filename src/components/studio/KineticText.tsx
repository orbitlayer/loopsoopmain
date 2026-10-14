"use client";

/*
 * KineticText — a scroll-reveal heading where each unit (word or line) is masked
 * and slides up into place the first time the component enters the viewport.
 *
 * SSR-safe by design: the server renders the final, readable text at its resting
 * position (good SEO / no-JS / reduced-motion), and the accessible name lives on
 * the root via aria-label while the visual units are aria-hidden. On the client
 * — only when motion is allowed and IntersectionObserver exists — a layout effect
 * "arms" the hidden start state before paint (no flash, no hydration mismatch),
 * then a one-shot IntersectionObserver triggers the staggered reveal. All motion
 * is CSS (see KineticText.module.css); this file only toggles two data attrs.
 */

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  Fragment,
  type ElementType,
} from "react";
import { cn } from "@/lib/cn";
import styles from "./KineticText.module.css";

export interface KineticTextProps {
  /** The text to reveal. Split into units by `by`. */
  text: string;
  /** The element rendered as the root. Default "h2". */
  as?: "h1" | "h2" | "h3" | "p" | "span";
  /** Split into "words" (on whitespace) or "lines" (on "\n"). Default "words". */
  by?: "lines" | "words";
  className?: string;
  /** Per-unit reveal delay, in seconds. Default 0.06. */
  stagger?: number;
}

// Run the arming step before the browser paints (so the hidden start state is
// never flashed), while falling back to useEffect during SSR to avoid React's
// server useLayoutEffect warning.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function KineticText({
  text,
  as = "h2",
  by = "words",
  className,
  stagger = 0.06,
}: KineticTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Reduced motion or no IntersectionObserver → leave the resting final frame.
    if (reduced || typeof IntersectionObserver === "undefined") return;

    // Arm synchronously, before paint: units jump (no transition) to hidden.
    setArmed(true);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(root);

    return () => io.disconnect();
  }, []);

  const Tag: ElementType = as;
  const label = text.replace(/\s+/g, " ").trim();
  const units =
    by === "lines" ? text.split("\n") : text.trim().split(/\s+/).filter(Boolean);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        rootRef.current = el;
      }}
      aria-label={label}
      data-armed={armed ? "true" : "false"}
      data-revealed={revealed ? "true" : "false"}
      className={cn(
        styles.root,
        by === "lines" ? styles.lines : styles.words,
        className,
      )}
    >
      {units.map((unit, i) => (
        <Fragment key={i}>
          <span className={styles.mask} aria-hidden="true">
            <span
              className={styles.unit}
              style={{ transitionDelay: `${(i * stagger).toFixed(3)}s` }}
            >
              {by === "lines" && unit === "" ? " " : unit}
            </span>
          </span>
          {by === "words" && i < units.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
