"use client";

/**
 * ScrollStack — a scroll-driven stacking-cards section (mirrors reactbits
 * "scroll stack"): a vertical list of large white panels where, as you scroll,
 * each card pins near the top and the following cards slide up and stack over
 * it, each slightly scaled down so a tidy pile builds.
 *
 * Mechanics: pinning is pure CSS `position: sticky` (each card pins a little
 * lower than the last for a peeking pile edge — see the .module.css). The
 * "recede as covered" effect is a single rAF that reads the list's own
 * bounding rect once per frame and sets each card's scale/opacity from how far
 * it has been covered (its depth in the pile), capped so deep cards stay
 * readable. The frozen rect of a pinned card can't report its own coverage, so
 * depth is derived from the non-frozen list rect and each card's measured
 * in-flow offset — stable under sticky and cheap to recompute.
 *
 * SSR / no-JS: the server renders every card's full content at rest (scale 1,
 * full opacity) as a sticky pile — complete, readable, no hydration mismatch.
 * Reduced motion OR no sticky support → a plain static vertical stack (CSS
 * fallback), and the rAF never mounts. The loop is rAF-throttled, paused when
 * the section is offscreen (IntersectionObserver) or the tab is hidden, remeasured
 * via ResizeObserver, and fully torn down (listeners, observers, inline styles)
 * on cleanup. Prop-driven; the centered, max-width column never overflows.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./ScrollStack.module.css";

export interface ScrollStackItem {
  eyebrow?: string;
  title: string;
  description: string;
}

export interface ScrollStackProps {
  items: ScrollStackItem[];
  className?: string;
}

/** Sticky top ≈ 14vh; each later card pins STAGGER px lower (the pile edge). */
const STACK_TOP_RATIO = 0.14;
const STAGGER = 18;
/** Per covering card: scale shrinks SCALE_STEP, opacity dims OPACITY_STEP. */
const SCALE_STEP = 0.05;
const OPACITY_STEP = 0.04;
/** Deepest buried card never recedes past MAX_DEPTH steps (stays readable). */
const MAX_DEPTH = 5;

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

export function ScrollStack({ items, className }: ScrollStackProps) {
  const [enhanced, setEnhanced] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const cardRefs = useRef<Array<HTMLLIElement | null>>([]);

  const total = items.length;

  // Enhance only when motion is allowed AND sticky is supported; kept live as
  // the motion preference changes. Otherwise the CSS fallback (plain stack)
  // stands and the scroll-linked effect below never runs.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const supportsSticky =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("position", "sticky");
    const evaluate = () => setEnhanced(!reduce.matches && supportsSticky);
    evaluate();
    reduce.addEventListener("change", evaluate);
    return () => reduce.removeEventListener("change", evaluate);
  }, []);

  // Scroll-linked scale/opacity for the pile depth.
  useEffect(() => {
    if (!enhanced) return;
    const list = listRef.current;
    if (!list) return;
    const cards = cardRefs.current.filter(Boolean) as HTMLLIElement[];
    if (cards.length === 0) return;

    // Scroll position (into the section) at which each card pins, and the
    // scroll distance between consecutive pins (used to normalise depth).
    let pinAt: number[] = [];
    let pitch: number[] = [];
    let raf = 0;
    let ticking = false;
    let visible = true;
    let docVisible = typeof document === "undefined" ? true : !document.hidden;

    const paint = () => {
      // The list rect is NOT frozen by sticky, so it reports true scroll depth.
      const scrolled = -list.getBoundingClientRect().top;
      for (let i = 0; i < cards.length; i++) {
        const depth = clamp((scrolled - pinAt[i]) / pitch[i], 0, MAX_DEPTH);
        const scale = 1 - depth * SCALE_STEP;
        const opacity = 1 - depth * OPACITY_STEP;
        const el = cards[i];
        el.style.transform = `scale(${scale.toFixed(4)})`;
        el.style.opacity = opacity.toFixed(3);
      }
    };

    const measure = () => {
      const stackTop = Math.round(window.innerHeight * STACK_TOP_RATIO);
      // Keep the CSS sticky `top` in exact px sync with the depth timing.
      list.style.setProperty("--stack-top", `${stackTop}px`);
      list.style.setProperty("--stack-step", `${STAGGER}px`);
      // offsetTop is the in-flow position (unaffected by the sticky shift),
      // so these thresholds stay valid even while cards are pinned.
      pinAt = cards.map((card, i) => card.offsetTop - (stackTop + i * STAGGER));
      pitch = cards.map((card, i) => {
        if (i < cards.length - 1) return Math.max(1, pinAt[i + 1] - pinAt[i]);
        if (i > 0) return Math.max(1, pinAt[i] - pinAt[i - 1]);
        return Math.max(1, card.offsetHeight);
      });
      paint();
    };

    const onScroll = () => {
      if (!visible || !docVisible || ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        ticking = false;
        paint();
      });
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    cards.forEach((c) => ro.observe(c));

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible && docVisible) paint();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(list);

    const onVisibility = () => {
      docVisible = !document.hidden;
      if (docVisible && visible) paint();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("visibilitychange", onVisibility);

    measure();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVisibility);
      list.style.removeProperty("--stack-top");
      list.style.removeProperty("--stack-step");
      cards.forEach((c) => {
        c.style.transform = "";
        c.style.opacity = "";
      });
    };
  }, [enhanced, total]);

  if (!items || items.length === 0) return null;

  return (
    <div className={cn("w-full px-4 sm:px-6 lg:px-8", className)}>
      <ol
        ref={listRef}
        data-enhanced={enhanced ? "true" : undefined}
        className={cn(styles.stack, "mx-auto w-full max-w-[1440px]")}
      >
        {items.map((item, i) => (
          <li
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            style={{ ["--i" as string]: i, zIndex: i + 1 }}
            className={cn(
              styles.card,
              "relative flex min-h-[clamp(300px,52vh,460px)] flex-col justify-center overflow-hidden rounded-[24px] border border-line bg-white p-7 md:min-h-[clamp(380px,62vh,620px)] md:p-14",
            )}
          >
            {/* Sequence number beside the title (side-wise), description below. */}
            <div className="flex items-start gap-4 md:gap-6">
              <span
                aria-hidden
                className={cn(
                  styles.index,
                  "font-display shrink-0 text-[clamp(1.6rem,4vw,3rem)] font-normal leading-none text-ink/25",
                )}
              >
                {pad2(i + 1)}
              </span>
              <div className="min-w-0">
                {item.eyebrow ? (
                  <span className="mb-2 block text-[0.7rem] uppercase tracking-[0.3em] text-[#8a8a85]">
                    {item.eyebrow}
                  </span>
                ) : null}
                <h3 className="font-display max-w-[16ch] text-[clamp(1.9rem,4.5vw,3.2rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink">
                  {item.title}
                </h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-[#6b6b6b] md:mt-4 md:text-lg">
                  {item.description}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
