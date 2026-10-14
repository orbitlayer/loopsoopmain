"use client";

/**
 * StickyProcess — a light process / timeline section.
 *
 * Desktop: a two-column grid whose LEFT column is position:sticky (eyebrow,
 * heading, a large live step number and a vertical progress rail) while the
 * RIGHT column scrolls a stack of step cards. A single IntersectionObserver with
 * a centre band (rootMargin) marks whichever card is crossing the viewport
 * middle as active — brightening it and advancing the sticky number + rail — and
 * a second observer reveals each card as it enters.
 *
 * Mobile: the left column stacks on top (static) and the cards form a vertical
 * timeline with a connecting line and reveal-on-scroll.
 *
 * SSR renders the final, readable frame (all cards bright, step 01 current); the
 * dim/reveal are armed only after mount and only when motion is allowed, so
 * no-JS and reduced-motion show complete static content with no layout shift.
 * No rAF / scroll-jacking — the pin is pure CSS sticky; observers are disconnected
 * on cleanup. Prop-driven; nothing overflows the page.
 */

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./StickyProcess.module.css";

export interface ProcessStep {
  n: string;
  title: string;
  description: string;
}

export interface StickyProcessProps {
  steps: ProcessStep[];
  heading?: string;
  eyebrow?: string;
  className?: string;
}

export function StickyProcess({
  steps,
  heading = "How we work",
  eyebrow = "Process",
  className,
}: StickyProcessProps) {
  const headingId = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [active, setActive] = useState(0);

  const listRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);

  const total = steps.length;
  const current = steps[active] ?? steps[0];
  // Progress for the rail: fraction of steps completed (clamped above 0).
  const progress = total > 0 ? (active + 1) / total : 0;

  // Enhance only when motion is allowed. Kept live as the preference changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => setEnhanced(!reduce.matches);
    evaluate();
    reduce.addEventListener("change", evaluate);
    return () => reduce.removeEventListener("change", evaluate);
  }, []);

  // Reveal each card on entry + track the active (centre-band) step.
  useEffect(() => {
    if (!enhanced) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLLIElement[];
    if (cards.length === 0) return;

    // Reveal-on-scroll: arm hidden, then reveal once when entering view.
    cards.forEach((c) => c.setAttribute("data-armed", "true"));
    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            revealIO.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );
    cards.forEach((c) => revealIO.observe(c));

    // Active step: a 0px band at the viewport centre. Track which cards cross
    // it and pick the topmost; never clear to "none" so the number stays put.
    const visible = new Set<number>();
    const bandIO = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (entry.isIntersecting) visible.add(idx);
          else visible.delete(idx);
        }
        if (visible.size > 0) {
          setActive(Math.min(...visible));
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    cards.forEach((c) => bandIO.observe(c));

    return () => {
      revealIO.disconnect();
      bandIO.disconnect();
      cards.forEach((c) => {
        c.removeAttribute("data-armed");
        c.removeAttribute("data-revealed");
      });
    };
  }, [enhanced, total]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        styles.section,
        "relative w-full bg-[#f6f6f4] px-5 py-14 text-[#111111] sm:px-8 md:py-20 lg:px-12",
        className,
      )}
    >
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-12 lg:gap-20">
        {/* ---------------------------------------------------- sticky left */}
        <div className={styles.sticky}>
          <span className="text-[0.7rem] uppercase tracking-[0.25em] text-[#8a8a85]">
            {eyebrow}
          </span>
          <h2
            id={headingId}
            className="font-display mt-4 max-w-[12ch] text-[clamp(2.5rem,6vw,4.5rem)] font-normal leading-[0.95] tracking-[-0.03em]"
          >
            {heading}
          </h2>

          <div className="mt-10 hidden items-center gap-6 md:flex">
            <div
              className={styles.rail}
              style={{ height: "clamp(6rem, 18vh, 11rem)" }}
              aria-hidden
            >
              <span
                className={styles.railFill}
                style={{ ["--p" as string]: progress }}
              />
            </div>
            <div aria-hidden>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(styles.bigNum, "font-display text-[clamp(3.5rem,8vw,6.5rem)]")}
                >
                  {current?.n ?? "01"}
                </span>
                <span className="font-display text-[clamp(1rem,2vw,1.5rem)] tabular-nums text-[#8a8a85]">
                  / {String(total).padStart(2, "0")}
                </span>
              </div>
              {/* Live readout of the step currently crossing the viewport. */}
              <p
                key={active}
                className={cn(
                  styles.readout,
                  "font-display mt-1 text-[clamp(1.1rem,1.7vw,1.6rem)] font-normal tracking-[-0.01em] text-ink",
                )}
              >
                {current?.title ?? ""}
              </p>
            </div>
          </div>

          {/* Accessible live status of the current step (desktop). */}
          <p className="sr-only" aria-live="polite">
            {current
              ? `Step ${current.n} of ${total}: ${current.title}`
              : undefined}
          </p>
        </div>

        {/* --------------------------------------------------- scrolling right */}
        <ol
          ref={listRef}
          data-enhanced={enhanced}
          className={cn(styles.list, "relative m-0 flex list-none flex-col gap-5 p-0 md:gap-8")}
        >
          {/* Connecting line — mobile timeline only. */}
          <span aria-hidden className={cn(styles.timelineLine, "md:hidden")} />

          {steps.map((step, i) => (
            <li
              key={step.n + step.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              data-index={i}
              data-active={enhanced ? active === i : undefined}
              className={cn(
                styles.card,
                "relative ml-7 p-6 md:ml-0 md:p-8 lg:p-10",
              )}
            >
              {/* Timeline node — sits on the connecting line (mobile). */}
              <span
                aria-hidden
                className={cn(
                  styles.node,
                  "absolute -left-[calc(1.75rem+1px)] top-7 md:hidden",
                )}
              />

              <div className="flex items-center justify-between gap-6">
                <span
                  aria-hidden
                  className={cn(
                    styles.cardNum,
                    "font-display text-[clamp(1.75rem,4vw,3rem)] font-normal leading-none",
                  )}
                >
                  {step.n}
                </span>
                <span className="text-[0.62rem] uppercase tracking-[0.25em] text-[#8a8a85]">
                  Step
                </span>
              </div>

              <h3 className="font-display mt-5 text-[clamp(1.4rem,3vw,2.1rem)] font-normal leading-[1.05] tracking-[-0.02em]">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[52ch] text-[0.98rem] leading-relaxed text-[#6b6b6b]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
