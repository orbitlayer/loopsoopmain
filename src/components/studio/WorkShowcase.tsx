"use client";

/**
 * WorkShowcase — the light featured-work centerpiece: a horizontally-scrolling
 * gallery of large project cards driven by VERTICAL scroll (scroll-pinned).
 *
 * On pointer/hover desktops (>768px, motion allowed) the section is tall, an
 * inner panel pins via `position: sticky`, and the card track translates
 * horizontally from the section's scroll progress — read once per frame from
 * getBoundingClientRect inside a single rAF-throttled handler, paused when the
 * section is offscreen (IntersectionObserver) or the tab is hidden, re-measured
 * with a ResizeObserver, and torn down fully on cleanup.
 *
 * On touch / <=768px / reduced-motion it does NOT scroll-jack: the exact same
 * cards render as a native horizontal snap row (page scrolls normally). The
 * server always emits that readable fallback (no hydration mismatch, good SEO /
 * no-JS), and the pinned mode is enabled only after mount. Prop-driven; the
 * clipped track and native scroll container prevent any horizontal page overflow.
 */

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./WorkShowcase.module.css";

export interface WorkShowcaseProject {
  id: string;
  title: string;
  category: string;
  thumb?: string;
  href?: string;
  index: number;
}

export interface WorkShowcaseProps {
  projects: WorkShowcaseProject[];
  heading?: string;
  className?: string;
}

type Mode = "fallback" | "pinned";

const EYEBROW = "Selected Work";

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");

const isInternal = (href: string) => href.startsWith("/");

/** Renders the card as a next/link, external <a>, or non-interactive article. */
function CardShell({
  href,
  title,
  className,
  children,
}: {
  href?: string;
  title: string;
  className: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return <article className={className}>{children}</article>;
  }
  const label = `View project: ${title}`;
  if (isInternal(href)) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={className}
    >
      {children}
    </a>
  );
}

function ProjectCard({
  project,
  mode,
}: {
  project: WorkShowcaseProject;
  mode: Mode;
}) {
  const hasThumb = Boolean(project.thumb);
  const n = pad2(project.index);
  return (
    <CardShell
      href={project.href}
      title={project.title}
      className={cn(
        styles.card,
        "group relative block shrink-0 overflow-hidden rounded-[20px] bg-[#121212] outline-none ring-1 ring-black/10 shadow-[0_22px_55px_-22px_rgba(17,17,17,0.45)] transition-shadow hover:ring-black/25 focus-visible:ring-black/25",
        "w-[78vw] max-w-[340px] md:w-[clamp(340px,34vw,520px)] md:max-w-none",
        mode === "fallback" && "snap-start",
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
            <svg
              width="15"
              height="18"
              viewBox="0 0 15 18"
              fill="none"
              aria-hidden
            >
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

export function WorkShowcase({
  projects,
  heading = "Work that moves",
  className,
}: WorkShowcaseProps) {
  const headingId = useId();
  const [mode, setMode] = useState<Mode>("fallback");
  const [sectionHeight, setSectionHeight] = useState<number | null>(null);

  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const total = projects.length;

  // Decide pinned vs fallback, and keep it live as device / preference change.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const desktop = window.matchMedia(
      "(min-width: 769px) and (hover: hover) and (pointer: fine)",
    );
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () =>
      setMode(desktop.matches && !reduce.matches ? "pinned" : "fallback");
    evaluate();
    desktop.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      desktop.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
    };
  }, []);

  // Pinned: scroll-driven horizontal translate (single rAF, gated + cleaned up).
  useEffect(() => {
    if (mode !== "pinned") return;
    const root = rootRef.current;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!root || !track || !viewport) return;
    const progressEl = progressRef.current;
    const countEl = countRef.current;

    let travel = 0;
    let raf = 0;
    let ticking = false;
    let visible = true;
    let docVisible = !document.hidden;

    const paint = (p: number) => {
      track.style.transform = `translate3d(${(-p * travel).toFixed(2)}px, 0, 0)`;
      if (progressEl) progressEl.style.transform = `scaleX(${p.toFixed(4)})`;
      if (countEl && total > 0) {
        countEl.textContent = pad2(Math.round(p * (total - 1)) + 1);
      }
    };

    const compute = () => {
      const rect = root.getBoundingClientRect();
      const p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
      paint(p);
    };

    const measure = () => {
      const vw = viewport.clientWidth;
      const trackW = track.scrollWidth;
      travel = Math.max(0, trackW - vw);
      setSectionHeight(
        travel > 0 ? Math.round(window.innerHeight + travel) : null,
      );
      compute();
    };

    const onScroll = () => {
      if (!visible || !docVisible || ticking) return;
      ticking = true;
      raf = requestAnimationFrame(() => {
        ticking = false;
        compute();
      });
    };

    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);
    ro.observe(track);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) compute();
      },
      { rootMargin: "120px 0px" },
    );
    io.observe(root);

    const onVisibility = () => {
      docVisible = !document.hidden;
      if (docVisible && visible) compute();
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
      track.style.transform = "";
      if (progressEl) progressEl.style.transform = "";
      setSectionHeight(null);
    };
  }, [mode, total]);

  // Fallback: reflect the native horizontal scroll position in the indicator.
  useEffect(() => {
    if (mode !== "fallback") return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const progressEl = progressRef.current;
    const countEl = countRef.current;
    let ticking = false;
    const render = () => {
      ticking = false;
      const max = viewport.scrollWidth - viewport.clientWidth;
      const p = max > 0 ? clamp(viewport.scrollLeft / max, 0, 1) : 0;
      if (progressEl) progressEl.style.transform = `scaleX(${p.toFixed(4)})`;
      if (countEl && total > 0) {
        countEl.textContent = pad2(Math.round(p * (total - 1)) + 1);
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(render);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    render();
    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (progressEl) progressEl.style.transform = "";
    };
  }, [mode, total]);

  const pinned = mode === "pinned";

  return (
    <section
      ref={rootRef}
      aria-labelledby={headingId}
      className={cn(
        styles.root,
        "relative w-full bg-[#f6f6f4] text-ink",
        className,
      )}
      style={sectionHeight ? { height: `${sectionHeight}px` } : undefined}
    >
      <div
        className={cn(
          pinned
            ? "sticky top-0 flex h-screen flex-col overflow-hidden"
            : "flex flex-col py-20 md:py-28",
        )}
      >
        {/* Heading. */}
        <header
          className={cn(
            styles.reveal,
            "mx-auto w-full max-w-[1680px] px-5 md:px-8",
            pinned && "pt-[14vh]",
          )}
        >
          <p className="text-[0.7rem] uppercase tracking-[0.25em] text-white/55">
            {EYEBROW}
          </p>
          <div className="mt-5 flex items-end justify-between gap-6">
            <h2
              id={headingId}
              className="font-display max-w-[14ch] text-[clamp(2.5rem,7vw,6.5rem)] font-normal leading-[0.9] tracking-[-0.03em] text-ink"
            >
              {heading}
            </h2>
            <p
              aria-hidden
              className="font-display hidden shrink-0 pb-2 text-sm tabular-nums tracking-[0.08em] text-ink/40 md:block"
            >
              <span ref={countRef}>01</span>
              <span className="mx-1 text-ink/25">/</span>
              {pad2(total)}
            </p>
          </div>

          {/* Scroll progress indicator. */}
          <div
            aria-hidden
            className="relative mt-8 h-px w-full overflow-hidden bg-ink/10 md:mt-10"
          >
            <div
              ref={progressRef}
              className={cn(styles.progressFill, "absolute inset-0 bg-ink")}
            />
          </div>
        </header>

        {/* Card track. */}
        <div
          ref={viewportRef}
          className={cn(
            "relative mt-10 md:mt-12",
            pinned
              ? "min-h-0 flex-1 overflow-hidden"
              : "no-scrollbar snap-x snap-mandatory overflow-x-auto overflow-y-hidden",
          )}
        >
          <div
            ref={trackRef}
            className={cn(
              styles.track,
              "flex gap-4 px-5 md:gap-6 md:px-8",
              pinned ? "h-full items-center" : "items-stretch py-2",
            )}
          >
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} mode={mode} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
