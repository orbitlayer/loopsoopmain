"use client";

/*
 * Preloader — a once-per-session cinematic intro for the light motion-studio
 * shell. A fixed off-white panel covers the viewport while a huge count 0 → 100
 * (bottom-right, font-display) ticks up and a hairline progress bar fills; the
 * "LOOPSOOP" wordmark (font-logo) fades in top-left. When the count lands the
 * panel slides up with the house expo easing, revealing the site, then unmounts.
 *
 * SSR-safe: renders null on the server and on the first client paint, then an
 * effect decides whether to play. It only plays on the FIRST load of a browser
 * session (sessionStorage "loopsoop:intro") and never when the user prefers
 * reduced motion — both cases render nothing at all. While active the body is
 * scroll-locked; the lock (and every rAF/timer) is always restored/cleared, so
 * scrolling is never trapped once the intro is gone. The count is written
 * straight to the DOM via refs to avoid a re-render per frame.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./Preloader.module.css";

const STORAGE_KEY = "loopsoop:intro";
const COUNT_MS = 1500; // time the 0 → 100 ramp takes
const HOLD_MS = 160; // tiny beat at 100 before the panel leaves

// Decelerating ramp so the counter eases into 100.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function Preloader() {
  const [play, setPlay] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  const counterRef = useRef<HTMLSpanElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const prevOverflow = useRef<string>("");

  // Client-only decision: play only on the first load of a session, and never
  // under reduced motion. Both skip cases leave the component rendering null.
  useEffect(() => {
    const decide = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      let seen = false;
      try {
        seen = sessionStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        seen = false;
      }
      if (!reduced && !seen) setPlay(true);
    };
    decide();
  }, []);

  // Runs once the overlay is mounted (play === true): lock scroll, ramp the
  // counter via a single rAF, then hand off to the exit transition.
  useEffect(() => {
    if (!play) return;

    prevOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    let raf = 0;
    let exitTimer = 0;
    let startTs = 0;
    let finished = false;

    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const p = Math.min(1, (now - startTs) / COUNT_MS);
      const eased = easeOutExpo(p);
      if (counterRef.current) {
        counterRef.current.textContent = String(Math.round(eased * 100));
      }
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${eased})`;
      }
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!finished) {
        finished = true;
        exitTimer = window.setTimeout(() => {
          try {
            sessionStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* storage may be blocked; the intro simply replays next load */
          }
          setExiting(true);
        }, HOLD_MS);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      if (exitTimer) clearTimeout(exitTimer);
      document.body.style.overflow = prevOverflow.current;
    };
  }, [play]);

  const finish = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform") return;
    document.body.style.overflow = prevOverflow.current;
    setDone(true);
  };

  if (!play || done) return null;

  return (
    <div
      className={cn(styles.root, "fixed inset-0 z-[100] overflow-hidden")}
      aria-hidden="true"
    >
      <div
        className={cn(styles.panel, exiting && styles.panelExit)}
        style={{ pointerEvents: exiting ? "none" : "auto" }}
        onTransitionEnd={finish}
      >
        <div
          className={cn(
            styles.content,
            exiting && styles.contentExit,
            "absolute inset-0 flex flex-col justify-between p-6 sm:p-10",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <span
              className={cn(
                styles.enter,
                "font-logo text-lg tracking-tight text-[#111111]",
              )}
              style={{ animationDelay: "40ms" }}
            >
              LOOPSOOP
            </span>
            <span
              className={cn(
                styles.enter,
                "text-[0.7rem] uppercase tracking-[0.25em]",
              )}
              style={{ color: "rgba(17,17,17,0.5)", animationDelay: "140ms" }}
            >
              Loading
            </span>
          </div>

          <div className="flex flex-col gap-5 sm:gap-7">
            <div className="flex items-end justify-end leading-none">
              <span
                ref={counterRef}
                className={cn(
                  styles.enter,
                  "font-display tabular-nums leading-[0.8] text-[#111111] text-[clamp(4.5rem,22vw,16rem)]",
                )}
                style={{ animationDelay: "80ms" }}
              >
                0
              </span>
            </div>
            <div className={styles.lineTrack}>
              <div ref={fillRef} className={styles.lineFill} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
