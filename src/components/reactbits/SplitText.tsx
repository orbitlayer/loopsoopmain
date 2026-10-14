"use client";

/*
 * SplitText — an original recreation of reactbits.dev's "Split Text".
 * Splits a string into per-character or per-word inline-block units and, the
 * first time the element scrolls into view, animates each unit in (opacity,
 * translateY and optionally blur) with a stagger.
 *
 * SSR renders the full, readable text at its resting/visible state (good for
 * SEO and no-JS), the root carries aria-label={text} while the units are
 * aria-hidden, and prefers-reduced-motion keeps the resting state with no
 * motion. The entrance is driven by CSS transitions on inline styles, armed
 * before first paint via a layout effect so there is no flash of the final
 * state before it animates.
 */

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/cn";

// Layout effect on the client (no flash), plain effect on the server (no warn).
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type SplitTextTag = "span" | "h1" | "h2" | "h3" | "p" | "div";

export type SplitTextProps = {
  text: string;
  as?: SplitTextTag;
  by?: "chars" | "words";
  className?: string;
  /** Seconds to wait before the first unit starts. */
  delay?: number;
  /** Seconds between consecutive units. */
  stagger?: number;
  /** Seconds each unit takes. */
  duration?: number;
  /** Starting vertical offset in px. */
  y?: number;
  /** Also animate an 8px blur → 0. */
  blur?: boolean;
  /** Only play once (don't replay on re-enter). */
  once?: boolean;
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function SplitText({
  text,
  as = "span",
  by = "chars",
  className,
  delay = 0,
  stagger = 0.03,
  duration = 0.6,
  y = 24,
  blur = false,
  once = true,
}: SplitTextProps) {
  const rootRef = useRef<HTMLElement>(null);
  // armed: JS will run the entrance (false on the server + under reduced motion
  // → resting/visible). shown: the units have been released to animate in.
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  const units = useMemo(() => {
    if (by === "words") return text.split(/\s+/).filter(Boolean);
    return Array.from(text); // includes space chars, rendered as nbsp below
  }, [text, by]);

  useIsoLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return; // leave resting/visible, no motion

    // Arm (synchronous re-render before paint hides the units) then release on
    // first enter-view.
    setArmed(true);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) io.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { rootMargin: "-10% 0px -10% 0px", threshold: 0 },
    );
    io.observe(node);

    return () => io.disconnect();
  }, [once]);

  const unitStyle = (index: number): CSSProperties => {
    const base: CSSProperties = { display: "inline-block" };
    if (!armed) return base; // server + reduced motion: resting/visible
    if (!shown) {
      // Pre-animation resting-hidden state, applied with no transition so it
      // snaps rather than animating out.
      return {
        ...base,
        opacity: 0,
        transform: `translateY(${y}px)`,
        filter: blur ? "blur(8px)" : undefined,
        willChange: "opacity, transform",
      };
    }
    return {
      ...base,
      opacity: 1,
      transform: "translateY(0px)",
      filter: blur ? "blur(0px)" : undefined,
      transitionProperty: blur ? "opacity, transform, filter" : "opacity, transform",
      transitionDuration: `${duration}s`,
      transitionTimingFunction: EASE,
      transitionDelay: `${delay + index * stagger}s`,
      willChange: "opacity, transform",
    };
  };

  const Tag = as as React.ElementType;

  return (
    <Tag ref={rootRef} className={cn(className)} aria-label={text}>
      {units.map((unit, index) => {
        // chars: a lone space becomes a normal-width non-breaking space so the
        // glyph box exists to animate. words: a real breakable space is placed
        // between word spans (outside them) so lines still wrap naturally.
        const content = by === "chars" && unit === " " ? "\u00A0" : unit;
        return (
          <span key={index}>
            <span aria-hidden="true" style={unitStyle(index)}>
              {content}
            </span>
            {by === "words" && index < units.length - 1 ? " " : ""}
          </span>
        );
      })}
    </Tag>
  );
}
