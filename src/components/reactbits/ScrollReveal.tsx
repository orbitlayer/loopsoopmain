"use client";

/*
 * ScrollReveal — an original recreation of reactbits.dev's "Scroll Reveal".
 * Splits a string into words that de-blur and fade up from (opacity 0.12,
 * blur 4px) to (opacity 1, blur 0) as the element scrolls through the viewport,
 * each word resolving slightly after the one before it.
 *
 * SSR renders the full, readable text at full opacity (good for SEO and no-JS);
 * the root carries aria-label={text} and the word spans are aria-hidden. A
 * single passive scroll/resize listener schedules at most one rAF at a time and
 * writes styles straight to the word nodes (no per-frame React render, one
 * getBoundingClientRect read then writes → no layout thrash). Under
 * prefers-reduced-motion every word stays at full opacity with no blur and no
 * listeners are attached. Everything is cleaned up on unmount.
 */

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/cn";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type ScrollRevealTag = "span" | "h1" | "h2" | "h3" | "p" | "div";

export type ScrollRevealProps = {
  text: string;
  as?: ScrollRevealTag;
  className?: string;
};

const MIN_OPACITY = 0.12;
const MAX_BLUR = 4; // px
// Width (in words) of the soft reveal head; higher = gentler trailing blur.
const SOFT = 4;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function ScrollReveal({ text, as = "p", className }: ScrollRevealProps) {
  const rootRef = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLSpanElement[]>([]);

  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);

  useIsoLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // Drop any stale node refs left over from a longer previous text.
    wordsRef.current.length = words.length;
    const nodes = wordsRef.current;
    const n = nodes.length;
    if (n === 0) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      for (const el of nodes) {
        if (!el) continue;
        el.style.opacity = "1";
        el.style.filter = "none";
      }
      return; // no listeners under reduced motion
    }

    let rafId = 0;

    const render = () => {
      rafId = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // 0 as the top edge reaches the bottom of the viewport, 1 once it has
      // travelled up to the top quarter — so the block reveals while scrolling.
      const p = clamp01((vh - rect.top) / (vh * 0.75));
      const head = p * (n + SOFT);
      for (let i = 0; i < n; i++) {
        const el = nodes[i];
        if (!el) continue;
        const wp = clamp01((head - i) / SOFT);
        el.style.opacity = String(MIN_OPACITY + (1 - MIN_OPACITY) * wp);
        const b = (1 - wp) * MAX_BLUR;
        el.style.filter = b > 0.05 ? `blur(${b}px)` : "none";
      }
    };

    const onScroll = () => {
      if (rafId) return; // coalesce: one scheduled rAF at a time
      rafId = requestAnimationFrame(render);
    };

    render(); // set the initial state before first paint
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [words]);

  const Tag = as as React.ElementType;

  return (
    <Tag ref={rootRef} className={cn(className)} aria-label={text}>
      {words.map((word, index) => (
        <span key={index}>
          <span
            aria-hidden="true"
            ref={(el: HTMLSpanElement | null) => {
              if (el) wordsRef.current[index] = el;
            }}
            style={{ display: "inline-block", willChange: "opacity, filter" }}
          >
            {word}
          </span>
          {index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
