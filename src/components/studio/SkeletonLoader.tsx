"use client";

/*
 * SkeletonLoader — a once-per-session intro for the light motion-studio shell.
 * Instead of a counter, it shows SKELETON SCREENS: a fixed off-white overlay
 * (#f6f6f4, z-100) filled with grey rounded placeholder blocks that mimic the
 * real page layout — a top nav row, a two-column hero (eyebrow, decreasing
 * heading bars, a short paragraph, two button pills + a tall media block) and a
 * bottom row of three card blocks. Every block carries a diagonal CSS shimmer
 * sweep so the shell reads as "loading". After a short beat the whole overlay
 * fades + slides up and unmounts on transitionend. This REPLACES the old
 * Preloader.
 *
 * SSR-safe: renders null on the server and on the first client paint, then an
 * effect decides whether to play. It only plays on the FIRST load of a browser
 * session (sessionStorage "loopsoop:skeleton") and never under reduced motion —
 * both skip cases render nothing at all (no hydration mismatch, real content is
 * in the server HTML underneath). While active the body is scroll-locked; the
 * lock is ALWAYS restored (effect cleanup + onTransitionEnd), so scrolling is
 * never trapped once the overlay is gone. Shimmer runs via CSS keyframes only.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./SkeletonLoader.module.css";

const STORAGE_KEY = "loopsoop:skeleton";
const VISIBLE_MS = 1100; // how long the skeleton holds before it exits

/** A single shimmering placeholder block. */
function Bar({ className, shade }: { className?: string; shade?: boolean }) {
  return (
    <span
      className={cn(styles.block, shade && styles.shade, "block", className)}
    />
  );
}

const NAV_LINKS = ["w-14", "w-16", "w-14", "w-12", "w-16"];

export function SkeletonLoader() {
  const [shown, setShown] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  const prevOverflow = useRef<string>("");

  // Client-only decision: play only on the first load of a session, and never
  // under reduced motion. Both skip cases leave the component rendering null.
  useEffect(() => {
    const decide = () => {
      if (typeof window === "undefined") return;
      const reduced =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let seen = false;
      try {
        seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        seen = false;
      }
      if (!reduced && !seen) setShown(true);
    };
    decide();
  }, []);

  // Once mounted: lock scroll, hold the skeleton, then trigger the exit. The
  // cleanup always restores the scroll lock, so it can never be trapped.
  useEffect(() => {
    if (!shown) return;

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* storage may be blocked; the intro simply replays next load */
      }
      setExiting(true);
    }, VISIBLE_MS);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = prevOverflow.current;
    };
  }, [shown]);

  const handleExitEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    document.body.style.overflow = prevOverflow.current;
    setDone(true);
  };

  if (!shown || done) return null;

  return (
    <div
      aria-hidden="true"
      onTransitionEnd={handleExitEnd}
      className={cn(
        styles.root,
        exiting && styles.rootExit,
        "fixed inset-0 z-[100] overflow-hidden",
      )}
    >
      <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col gap-9 px-6 py-6 md:gap-14 md:px-10 md:py-8">
        {/* Nav row: logo, link blocks, CTA pill (+ a menu block on mobile). */}
        <div className="flex items-center justify-between gap-4">
          <Bar className="h-5 w-28 rounded-md sm:h-6 sm:w-32" />
          <div className="hidden items-center gap-5 md:flex lg:gap-7">
            {NAV_LINKS.map((w, i) => (
              <Bar key={i} shade className={cn("h-3 rounded-sm", w)} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Bar className="h-9 w-24 rounded-full sm:w-28" />
            <Bar shade className="h-5 w-8 rounded-sm md:hidden" />
          </div>
        </div>

        {/* Hero: text column + tall media block (media hidden below lg). */}
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-14">
          <div className="flex flex-col">
            {/* Eyebrow. */}
            <div className="mb-7 flex items-center gap-3">
              <Bar className="h-5 w-10 rounded-md" />
              <Bar shade className="h-3 w-40 rounded-sm" />
            </div>

            {/* Heading bars, decreasing width. */}
            <div className="flex flex-col gap-3 sm:gap-4">
              <Bar className="h-[clamp(2.1rem,6.2vw,4.4rem)] w-[88%] rounded-lg" />
              <Bar
                shade
                className="h-[clamp(2.1rem,6.2vw,4.4rem)] w-[66%] rounded-lg"
              />
              <Bar className="h-[clamp(2.1rem,6.2vw,4.4rem)] w-[44%] rounded-lg" />
            </div>

            {/* Paragraph. */}
            <div className="mt-7 flex max-w-md flex-col gap-2.5">
              <Bar shade className="h-3 w-[92%] rounded-sm" />
              <Bar shade className="h-3 w-[70%] rounded-sm" />
            </div>

            {/* Button pills. */}
            <div className="mt-9 flex flex-wrap gap-4">
              <Bar className="h-12 w-40 rounded-full" />
              <Bar shade className="h-12 w-44 rounded-full" />
            </div>
          </div>

          <div className="hidden lg:block">
            <Bar className="h-[clamp(320px,52vh,540px)] w-full rounded-[22px]" />
          </div>
        </div>

        {/* Bottom row: three wide card blocks. */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {[0, 1, 2].map((i) => (
            <Bar
              key={i}
              shade={i % 2 === 1}
              className="h-[clamp(150px,22vh,250px)] w-full rounded-[18px] sm:rounded-[20px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
