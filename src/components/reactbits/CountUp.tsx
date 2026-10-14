"use client";

/*
 * CountUp — an original recreation of reactbits.dev's "Count Up".
 * Takes a display string (e.g. "300+", "500M+", "$1.2k", "98%"), parses the
 * LEADING number and keeps the surrounding prefix/suffix, then — the first time
 * the element scrolls into view — animates the number from 0 up to the target
 * with an ease-out over `duration` seconds via requestAnimationFrame.
 *
 * SSR renders the FINAL value string (real number) and that is also the initial
 * client state, so SEO, no-JS and reduced-motion all show the true figure; the
 * value only drops to 0 after mount, once the animation actually starts. The
 * parsed number's decimal places are preserved. The canonical value is exposed
 * to assistive tech via aria-label so screen readers don't read the ticking.
 * prefers-reduced-motion shows the final value with no animation. The rAF and
 * IntersectionObserver are torn down on unmount.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type CountUpProps = {
  /** Display string whose leading number is animated, e.g. "500M+" or "$1.2k". */
  value: string;
  className?: string;
  /** Seconds the 0 → target ramp takes. Default 1.6. */
  duration?: number;
  /** Gate the animation; when false the final value is shown and held. Default true. */
  start?: boolean;
};

type Parsed = {
  ok: boolean;
  prefix: string;
  suffix: string;
  target: number;
  decimals: number;
};

function parseValue(value: string): Parsed {
  // prefix = leading non-digit/non-minus chars, then a signed int/decimal, then
  // whatever remains is the suffix. "$1.2k" → "$" / "1.2" / "k".
  const match = value.match(/^([^0-9-]*)(-?\d*\.?\d+)(.*)$/);
  if (!match) {
    return { ok: false, prefix: "", suffix: "", target: 0, decimals: 0 };
  }
  const [, prefix, numStr, suffix] = match;
  const target = parseFloat(numStr);
  if (Number.isNaN(target)) {
    return { ok: false, prefix: "", suffix: "", target: 0, decimals: 0 };
  }
  const dot = numStr.indexOf(".");
  const decimals = dot === -1 ? 0 : numStr.length - dot - 1;
  return { ok: true, prefix, suffix, target, decimals };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  value,
  className,
  duration = 1.6,
  start = true,
}: CountUpProps) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const { ok, prefix, suffix, target, decimals } = parsed;

  const format = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;
  const finalStr = ok ? format(target) : value;

  // Final value is both the server HTML and the initial client state → no
  // hydration mismatch, real number visible with no JS.
  const [display, setDisplay] = useState(finalStr);
  const [inView, setInView] = useState(false);

  const rootRef = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);
  const ranRef = useRef(false);

  // Observe once; mark in-view when it scrolls onto screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof window === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Run the 0 → target ramp once, when in view and gated on.
  useEffect(() => {
    if (!ok || !inView || start === false || ranRef.current) return;
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return; // final value already shown — no motion

    ranRef.current = true;
    const startTime = performance.now();
    const span = Math.max(duration, 0.0001) * 1000;

    // The first frame runs at t≈0, so the ramp visibly begins from 0 (rather
    // than the final value) without a synchronous setState in the effect body.
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / span, 1);
      if (t < 1) {
        setDisplay(format(target * easeOutCubic(t)));
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(format(target)); // land exactly on target
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // format is derived from prefix/suffix/decimals, which are in the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, inView, start, duration, target, decimals, prefix, suffix]);

  // Keep the resting text in sync if `value` changes while idle.
  useEffect(() => {
    if (rafRef.current === null && !ranRef.current) setDisplay(finalStr);
  }, [finalStr]);

  return (
    <span ref={rootRef} className={cn(className)} aria-label={value}>
      {display}
    </span>
  );
}
