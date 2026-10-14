"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./ScrollReel.module.css";

/*
 * ScrollReel — a compact monochrome film-strip that translates horizontally as
 * the section scrolls through the viewport (scroll-linked, no playhead). A
 * single rAF-throttled scroll handler maps the band's progress through the
 * viewport to a translateX on a wide repeating-cell strip. Under
 * prefers-reduced-motion it sits still. Decorative (aria-hidden).
 */

const CELL =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='148' height='116'>` +
      `<g fill='rgba(17,17,17,0.32)'>` +
      `<rect x='14' y='6' width='13' height='9' rx='3'/>` +
      `<rect x='68' y='6' width='13' height='9' rx='3'/>` +
      `<rect x='122' y='6' width='13' height='9' rx='3'/>` +
      `<rect x='14' y='101' width='13' height='9' rx='3'/>` +
      `<rect x='68' y='101' width='13' height='9' rx='3'/>` +
      `<rect x='122' y='101' width='13' height='9' rx='3'/>` +
      `</g>` +
      `<rect x='10' y='26' width='128' height='64' rx='4' fill='rgba(17,17,17,0.03)' stroke='rgba(17,17,17,0.22)' stroke-width='1.5'/>` +
      `</svg>`,
  );

export function ScrollReel({ className }: { className?: string }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const strip = stripRef.current;
    if (!section || !strip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = section.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // progress: 0 as the band enters from the bottom, 1 as it leaves the top.
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
      // The strip is wider than the band; drift it left across the full range.
      const range = strip.scrollWidth - strip.clientWidth;
      strip.style.transform = `translate3d(${(-p * range).toFixed(1)}px,0,0)`;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        raf = requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      aria-hidden
      className={cn("relative w-full overflow-hidden", className)}
    >
      <div
        ref={stripRef}
        className={styles.strip}
        style={{ backgroundImage: `url("${CELL}")` }}
      />
    </div>
  );
}
