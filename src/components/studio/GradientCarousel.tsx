"use client";

/**
 * GradientCarousel — an auto-scrolling, infinitely looping horizontal carousel
 * of project cards on light (a "gradient carousel"). The list is duplicated
 * back-to-back and a single rAF loop translates the track leftward at a constant
 * px/sec, wrapping by exactly one group width for a seamless loop. Hovering
 * pauses the drift; a click-drag / touch-swipe scrubs the track and auto-scroll
 * resumes on release (a short drag is suppressed so cards stay clickable links).
 * The edges fade to the page background via a symmetric mask.
 *
 * Each card is the same dark video tile as WorkShowcase (grayscale cover + scrim
 * or a graphite placeholder with a faint index, overlaid category / index /
 * title / "View project" / play glyph), so the two sections read as one system.
 *
 * SSR / correctness: the server (and the first client render, and reduced-motion,
 * and no-JS) always emits a readable, native horizontally-scrollable snap row —
 * the exact same cards — so there is no hydration mismatch and the content is
 * fully crawlable. The animated mode is enabled only after mount when motion is
 * allowed. The rAF runs only while the section is on-screen (IntersectionObserver)
 * AND the tab is visible (visibilitychange), and is measured with a
 * ResizeObserver (seamless across resizes / late font loads). Everything is torn
 * down on cleanup. The track lives inside an overflow-hidden/overflow-x-auto
 * viewport, so the max-content track never causes horizontal page overflow.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./GradientCarousel.module.css";

export interface GradientCarouselProject {
  id: string;
  title: string;
  category: string;
  thumb?: string;
  href?: string;
  index: number;
}

export interface GradientCarouselProps {
  projects: GradientCarouselProject[];
  className?: string;
  /** Auto-scroll speed in px/sec. Default 36. */
  speed?: number;
}

type Mode = "fallback" | "auto";

/** Below this pointer travel a drag is treated as a click (cards stay links). */
const DRAG_THRESHOLD = 6;

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

const isInternal = (href: string) => href.startsWith("/");

/** Keep the offset within (-G, 0] so the loop stays seamless in both directions. */
const normalizeOffset = (x: number, g: number): number => {
  if (g <= 0) return 0;
  let nx = x % g;
  if (nx > 0) nx -= g;
  return nx;
};

/** Renders the card as a next/link, external <a>, or non-interactive article.
 *  Duplicated (non-interactive) copies are hidden from AT and taken out of the
 *  tab order so each project is announced / focusable only once. */
function CardShell({
  href,
  title,
  interactive,
  className,
  children,
}: {
  href?: string;
  title: string;
  interactive: boolean;
  className: string;
  children: ReactNode;
}) {
  const a11y = interactive
    ? { "aria-label": `View project: ${title}` }
    : { "aria-hidden": true, tabIndex: -1 };

  if (!href) {
    return (
      <article className={className} aria-hidden={interactive ? undefined : true}>
        {children}
      </article>
    );
  }
  if (isInternal(href)) {
    return (
      <Link href={href} className={className} {...a11y}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      {...a11y}
    >
      {children}
    </a>
  );
}

function ProjectCard({
  project,
  interactive,
  snap,
}: {
  project: GradientCarouselProject;
  interactive: boolean;
  snap: boolean;
}) {
  const hasThumb = Boolean(project.thumb);
  const n = pad2(project.index);
  return (
    <CardShell
      href={project.href}
      title={project.title}
      interactive={interactive}
      className={cn(
        styles.card,
        "group relative block shrink-0 overflow-hidden rounded-[20px] bg-[#121212] outline-none ring-1 ring-black/10 shadow-[0_22px_55px_-22px_rgba(17,17,17,0.45)] transition-shadow hover:ring-black/25 focus-visible:ring-black/25",
        "w-[clamp(300px,30vw,440px)] me-4 md:me-6",
        snap && "snap-start",
      )}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px]">
        {hasThumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- intentional raw <img> with native lazy loading; no next/image domain config in this design system
          <img
            src={project.thumb}
            alt={project.title}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={cn(
              styles.cover,
              "absolute inset-0 h-full w-full object-cover",
            )}
          />
        ) : (
          <>
            <div aria-hidden className={cn(styles.placeholder, "absolute inset-0")} />
            <span
              aria-hidden
              className="font-display pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 select-none text-[26vw] font-normal leading-none tracking-[-0.04em] text-white/10 md:text-[clamp(7rem,12vw,13rem)]"
            >
              {n}
            </span>
          </>
        )}

        {/* Legibility scrim. */}
        <div aria-hidden className={cn(styles.scrim, "absolute inset-0")} />

        {/* Play glyph on media / reel tiles. */}
        {hasThumb ? (
          <span
            aria-hidden
            className={cn(
              styles.play,
              "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-1 ring-white/40 backdrop-blur-sm md:h-16 md:w-16",
            )}
          >
            <svg width="15" height="18" viewBox="0 0 15 18" fill="none" aria-hidden>
              <path d="M0.75 1.3v15.4L14 9 0.75 1.3Z" fill="#ffffff" />
            </svg>
          </span>
        ) : null}

        {/* Overlaid content. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2.5 p-5 md:gap-3 md:p-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.7rem] uppercase tracking-[0.25em] text-white/55">
              {project.category}
            </span>
            <span
              aria-hidden
              className="font-display text-[0.8rem] tabular-nums tracking-[0.08em] text-white/45"
            >
              {n}
            </span>
          </div>
          <h3 className="font-display text-[clamp(1.5rem,3.2vw,2.5rem)] font-normal leading-[0.98] tracking-[-0.02em] text-white">
            {project.title}
          </h3>
          {project.href ? (
            <span
              className={cn(
                styles.view,
                "mt-1 inline-flex w-fit items-center gap-2 text-sm text-white/70",
              )}
            >
              <span className={styles.viewLabel}>View project</span>
              <span aria-hidden className={styles.viewArrow}>
                &#8599;
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </CardShell>
  );
}

export function GradientCarousel({
  projects,
  className,
  speed = 36,
}: GradientCarouselProps) {
  const [mode, setMode] = useState<Mode>("fallback");
  const [copies, setCopies] = useState(2);

  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstGroupRef = useRef<HTMLDivElement>(null);

  // Shared animation state — read/written by both the rAF loop and the pointer
  // handlers (same thread, no race). Kept in a ref so neither triggers renders.
  const anim = useRef({
    x: 0,
    g: 0,
    hoverPaused: false,
    dragging: false,
    moved: false,
    startX: 0,
    startOffset: 0,
  });

  const total = projects.length;

  const applyTransform = useCallback(() => {
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${anim.current.x.toFixed(2)}px, 0, 0)`;
    }
  }, []);

  // Decide animated vs. fallback after mount, and keep it live as the
  // reduced-motion preference changes. SSR + first render stay "fallback".
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => setMode(reduce.matches ? "fallback" : "auto");
    evaluate();
    reduce.addEventListener("change", evaluate);
    return () => reduce.removeEventListener("change", evaluate);
  }, []);

  // Auto mode: continuous leftward drift (single rAF, gated + measured + cleaned).
  useEffect(() => {
    if (mode !== "auto") return;
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const group = firstGroupRef.current;
    if (!root || !viewport || !track || !group) return;

    const a = anim.current;
    let raf = 0;
    let last = 0;
    let onscreen = true;
    let visible = typeof document === "undefined" ? true : !document.hidden;

    const measure = () => {
      a.g = group.getBoundingClientRect().width;
      const vw = viewport.clientWidth;
      if (a.g > 0) {
        // Enough copies that (copies - 1) full groups always cover the viewport,
        // so wrapping by one group width never reveals a gap.
        const needed = Math.max(2, Math.ceil(vw / a.g) + 1);
        if (needed !== copies) {
          setCopies(needed); // re-runs this effect with the new copy count
          return;
        }
      }
      a.x = normalizeOffset(a.x, a.g);
      applyTransform();
    };

    const tick = (t: number) => {
      if (last === 0) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.1) dt = 0.1; // clamp long gaps (throttled / returned-to tab)
      if (a.g > 0 && !a.hoverPaused && !a.dragging) {
        a.x = normalizeOffset(a.x - speed * dt, a.g);
        applyTransform();
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !onscreen || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const sync = () => {
      if (onscreen && visible) start();
      else stop();
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);
    ro.observe(group);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onscreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(root);

    const onVisibility = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    measure();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode, copies, speed, applyTransform]);

  const auto = mode === "auto";

  const onMouseEnter = useCallback(() => {
    anim.current.hoverPaused = true;
  }, []);
  const onMouseLeave = useCallback(() => {
    anim.current.hoverPaused = false;
  }, []);

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const a = anim.current;
    a.dragging = true;
    a.moved = false;
    a.startX = e.clientX;
    a.startOffset = a.x;
    const vp = viewportRef.current;
    if (vp) {
      vp.classList.add(styles.grabbing);
      try {
        vp.setPointerCapture(e.pointerId);
      } catch {
        /* setPointerCapture can throw on stale pointer ids; ignore. */
      }
    }
  }, []);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const a = anim.current;
      if (!a.dragging) return;
      const dx = e.clientX - a.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) a.moved = true;
      a.x = normalizeOffset(a.startOffset + dx, a.g);
      applyTransform();
    },
    [applyTransform],
  );

  const endDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const a = anim.current;
    if (!a.dragging) return;
    a.dragging = false; // rAF resumes the drift from the current offset
    const vp = viewportRef.current;
    if (vp) {
      vp.classList.remove(styles.grabbing);
      try {
        vp.releasePointerCapture(e.pointerId);
      } catch {
        /* already released; ignore. */
      }
    }
  }, []);

  // Suppress the click that ends a real drag so scrubbing never navigates.
  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (anim.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      anim.current.moved = false;
    }
  }, []);

  return (
    <section
      ref={rootRef}
      aria-label="Selected work carousel"
      aria-roledescription="carousel"
      className={cn(styles.root, "relative w-full bg-[#f6f6f4] text-ink", className)}
    >
      <div
        ref={viewportRef}
        className={cn(
          styles.viewport,
          "relative w-full",
          auto
            ? cn(styles.autoViewport, "overflow-hidden")
            : "no-scrollbar snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
        )}
        onMouseEnter={auto ? onMouseEnter : undefined}
        onMouseLeave={auto ? onMouseLeave : undefined}
        onPointerDown={auto ? onPointerDown : undefined}
        onPointerMove={auto ? onPointerMove : undefined}
        onPointerUp={auto ? endDrag : undefined}
        onPointerCancel={auto ? endDrag : undefined}
        onClickCapture={auto ? onClickCapture : undefined}
      >
        <div
          ref={trackRef}
          className={cn(
            styles.track,
            "flex items-stretch py-2",
            auto ? "w-max" : "px-5 md:px-8",
          )}
        >
          {auto
            ? Array.from({ length: copies }).map((_, g) => (
                <div
                  key={g}
                  ref={g === 0 ? firstGroupRef : undefined}
                  className={styles.group}
                  aria-hidden={g === 0 ? undefined : true}
                >
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      interactive={g === 0}
                      snap={false}
                    />
                  ))}
                </div>
              ))
            : projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  interactive
                  snap
                />
              ))}
        </div>
      </div>

      {/* Count is announced for AT only; the drift itself is silent. */}
      <span className="sr-only">{total} featured projects.</span>
    </section>
  );
}
