"use client";

/*
 * HeroCards — an interactive deck of blank "proof" cards standing in for the
 * studio's video work. One card faces front; the others fan behind it. The deck
 * auto-advances, and Prev / Play-Pause / Next controls (plus clicking the front
 * card) shuffle it: the front card rotates back into the pile while the next
 * card rises to the front (framer-motion springs between per-depth slots).
 *
 * The card look (white stock, crop marks, a soft tonal "image" area with a play
 * glyph) and the grain/marks live in HeroCards.module.css. The cards are
 * decorative; the three labelled buttons are the accessible controls. Autoplay
 * pauses off-screen and under reduced motion, where the shuffle is instant.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./HeroCards.module.css";

const paper =
  "absolute inset-0 overflow-hidden rounded-[1.25cqw] border border-line bg-surface";
const shadowFront =
  "shadow-[0_1px_1px_rgba(17,17,17,0.04),0_4px_8px_-4px_rgba(17,17,17,0.08),0_16px_32px_-12px_rgba(17,17,17,0.12),0_40px_80px_-32px_rgba(17,17,17,0.22)]";
const shadowBack =
  "shadow-[0_1px_1px_rgba(17,17,17,0.05),0_4px_10px_-4px_rgba(17,17,17,0.09),0_20px_40px_-18px_rgba(17,17,17,0.2)]";

const light =
  "radial-gradient(120% 90% at 12% 0%, rgba(255,255,255,0.55), transparent 58%), radial-gradient(110% 70% at 92% 100%, rgba(17,17,17,0.08), transparent 70%)";

/* One tonal "poster" per card — subtly different so the shuffle reads clearly. */
const TONES = [
  `radial-gradient(90% 70% at 88% 0%, rgba(196,181,253,0.18), transparent 65%), ${light}, linear-gradient(180deg, #d3d3ce 0%, #b3b3ac 100%)`,
  `${light}, linear-gradient(180deg, #e4e4e0 0%, #d0d0cb 100%)`,
  `${light}, linear-gradient(180deg, #e2e2de 0%, #cecec9 100%)`,
];

/* Resting transform per depth (0 = front). The front card is upright and
   centred; the two behind it fan out and sit a touch lower. */
const SLOTS = [
  { x: "0%", y: "0%", rotate: 0, scale: 1 },
  { x: "33%", y: "5%", rotate: 8, scale: 0.9 },
  { x: "-33%", y: "7%", rotate: -8, scale: 0.88 },
];

const AUTOPLAY_MS = 3600;

function Face({ tone }: { tone: string }) {
  return (
    <>
      <div
        className={cn(
          styles.grain,
          "absolute inset-x-[7cqw] top-[7cqw] bottom-[15cqw] overflow-hidden rounded-[0.4cqw] shadow-[inset_0_0_0_1px_rgba(17,17,17,0.06)]",
        )}
        style={{ background: tone }}
      >
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 ring-1 ring-black/25 backdrop-blur-[1px]"
          style={{ width: "20cqw", height: "20cqw" }}
        >
          <svg
            viewBox="0 0 14 16"
            className="translate-x-[0.6cqw] w-[7cqw]"
            fill="rgba(17,17,17,0.72)"
            aria-hidden
          >
            <path d="M0.6 1 L13 8 L0.6 15 Z" />
          </svg>
        </span>
      </div>
      <div className={styles.marks} />
    </>
  );
}

function Control({
  onClick,
  label,
  primary,
  children,
}: {
  onClick: () => void;
  label: string;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-300",
        primary
          ? "h-12 w-12 bg-ink text-white hover:scale-105 focus-visible:scale-105"
          : "h-11 w-11 border border-line bg-white text-ink hover:border-ink focus-visible:border-ink",
      )}
    >
      {children}
    </button>
  );
}

export function HeroCards({ className }: { className?: string }) {
  const n = TONES.length;
  const reduce = useReducedMotion() === true;
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => setActive((a) => (a + 1) % n), [n]);
  const prev = useCallback(() => setActive((a) => (a - 1 + n) % n), [n]);

  // Auto-advance while playing, on-screen and motion is allowed.
  useEffect(() => {
    if (reduce || !playing || !inView) return;
    const id = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [reduce, playing, inView, next]);

  // Pause autoplay when the deck scrolls off-screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={rootRef} className={cn("w-full", className)}>
      <div
        role="group"
        aria-label="Showreel preview"
        className={cn(
          styles.stage,
          "@container relative mx-auto aspect-[4/5] w-[clamp(140px,40vw,300px)] lg:w-[320px]",
        )}
      >
        <div
          aria-hidden
          className={cn(
            styles.floor,
            "pointer-events-none absolute -inset-x-[40%] -bottom-[7%] h-[14%] bg-[radial-gradient(closest-side,rgba(17,17,17,0.12),transparent)]",
          )}
        />

        {TONES.map((tone, i) => {
          const depth = (i - active + n) % n;
          const slot = SLOTS[depth];
          const isFront = depth === 0;
          return (
            <motion.div
              key={i}
              aria-hidden
              onClick={isFront ? next : undefined}
              className={cn(
                "absolute inset-0 rounded-[1.25cqw]",
                isFront && "cursor-pointer",
              )}
              style={{ zIndex: n - depth }}
              initial={false}
              animate={{
                x: slot.x,
                y: slot.y,
                rotate: slot.rotate,
                scale: slot.scale,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 260, damping: 28 }
              }
            >
              <div className={cn(paper, isFront ? shadowFront : shadowBack)}>
                <Face tone={tone} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Controls — move back / pause-play / move forward. */}
      <div className="mt-7 flex items-center justify-center gap-3">
        <Control onClick={prev} label="Previous preview">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Control>
        <Control
          onClick={() => setPlaying((p) => !p)}
          label={playing ? "Pause autoplay" : "Play autoplay"}
          primary
        >
          {playing ? (
            <Pause className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          ) : (
            <Play className="h-5 w-5 translate-x-[1px]" strokeWidth={1.8} aria-hidden />
          )}
        </Control>
        <Control onClick={next} label="Next preview">
          <ChevronRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
        </Control>
      </div>
    </div>
  );
}
