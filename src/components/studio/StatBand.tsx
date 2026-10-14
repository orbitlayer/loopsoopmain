"use client";

/*
 * StatBand — a responsive grid of oversized stats on light. Each stat's leading
 * number counts up from 0 to its real value the first time the band scrolls
 * into view (the non-numeric suffix such as "+", "M+", "x" is preserved), with
 * a small uppercase label beneath.
 *
 * SSR / accessibility: the final value string is what renders in server HTML
 * and in the first client render, so there is no hydration mismatch and the
 * page is fully readable with JS off or crawled. The count-up runs by writing
 * textContent on each number via a ref (no React re-render, so no flicker and
 * cheap 60fps), reset to 0 inside a layout effect before paint and animated
 * once on intersection, then snapped back to the exact original string. Under
 * reduced motion, or without IntersectionObserver, the final values simply
 * stay put. Hairline dividers use a 1px grid-gap technique (background shows
 * through the gaps) to dodge the global border-color override — no border
 * utilities relied on. rAF and the observer are torn down on cleanup.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export interface Stat {
  value: string;
  label: string;
}

export interface StatBandProps {
  stats: Stat[];
  className?: string;
}

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Parsed {
  target: number;
  decimals: number;
  suffix: string;
  prefix: string;
}

function parseStat(value: string): Parsed | null {
  const match = /^(\D*)([\d,]*\.?\d+)(.*)$/.exec(value.trim());
  if (!match) return null;
  const [, prefix, rawNum, suffix] = match;
  const numeric = Number.parseFloat(rawNum.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const dot = rawNum.indexOf(".");
  const decimals = dot === -1 ? 0 : rawNum.length - dot - 1;
  return { target: numeric, decimals, suffix, prefix };
}

function formatValue(current: number, p: Parsed): string {
  const rounded =
    p.decimals > 0
      ? Number(current.toFixed(p.decimals))
      : Math.round(current);
  const body = rounded.toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
  });
  return `${p.prefix}${body}${p.suffix}`;
}

export function StatBand({ stats, className }: StatBandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const numberRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || typeof IntersectionObserver === "undefined") return;

    const parsed = stats.map((s) => parseStat(s.value));

    // Reset to zero before paint; unparseable stats keep their final string.
    parsed.forEach((p, i) => {
      const el = numberRefs.current[i];
      if (el && p) el.textContent = formatValue(0, p);
    });

    let raf = 0;
    const duration = 1600;

    const run = () => {
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(1, elapsed / duration);
        // easeOutExpo
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
        parsed.forEach((p, i) => {
          const el = numberRefs.current[i];
          if (el && p) el.textContent = formatValue(p.target * eased, p);
        });
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          // Snap to the exact original string to preserve formatting.
          parsed.forEach((p, i) => {
            const el = numberRefs.current[i];
            if (el && p) el.textContent = stats[i].value;
          });
          raf = 0;
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect();
            run();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );
    io.observe(container);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [stats]);

  if (!stats || stats.length === 0) return null;

  const mdCols =
    stats.length >= 4
      ? "md:grid-cols-4"
      : stats.length === 3
        ? "md:grid-cols-3"
        : "md:grid-cols-2";

  return (
    <div
      ref={containerRef}
      className={cn(
        "grid grid-cols-2 overflow-hidden rounded-[20px]",
        mdCols,
        className,
      )}
    >
      {stats.map((stat, i) => (
        // Overlapping 1px rings (not borders) draw crisp hairline dividers for
        // any number of cells — sidesteps the global border-color override.
        <div
          key={i}
          className="flex flex-col items-start gap-3 bg-[#ffffff] px-6 py-10 ring-1 ring-[rgba(17,17,17,0.08)] sm:px-8 sm:py-14"
        >
          <span
            ref={(el) => {
              numberRefs.current[i] = el;
            }}
            className="font-display text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[0.95] tracking-tight text-ink tabular-nums"
          >
            {stat.value}
          </span>
          <span className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
