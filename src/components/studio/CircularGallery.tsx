"use client";

/**
 * CircularGallery — a curved, infinitely-looping gallery of project cards that
 * BOTH auto-scrolls and can be dragged/swiped by hand (a "circular gallery" in
 * the spirit of reactbits.dev, rebuilt from scratch with CSS 3D + a single rAF
 * loop so it renders everywhere, no WebGL). The list is duplicated back-to-back
 * and the track drifts leftward at a constant px/sec, wrapping by one group
 * width for a seamless loop; each card's rotation / depth / bow is recomputed
 * every frame from its live distance to the centre, so the row reads as a
 * shallow cylinder — the middle card faces front, the sides curve away.
 *
 * Interaction: hover pauses the drift (desktop); click-drag or touch-swipe
 * scrubs the track and the drift resumes on release (a short drag is suppressed
 * so cards stay clickable links). touch-action: pan-y lets vertical swipes
 * scroll the page while horizontal swipes scrub the gallery.
 *
 * SSR / no-JS / reduced-motion render a plain, readable horizontal snap row of
 * the same cards (no 3D), so there is no hydration mismatch and the content is
 * crawlable; the curved animated mode is enabled only after mount when motion
 * is allowed. The rAF runs only while on-screen (IntersectionObserver) and the
 * tab is visible, is remeasured via ResizeObserver, and is fully torn down.
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
import styles from "./CircularGallery.module.css";

export interface CircularGalleryProject {
  id: string;
  title: string;
  category: string;
  thumb?: string;
  href?: string;
  index: number;
}

export interface CircularGalleryProps {
  projects: CircularGalleryProject[];
  className?: string;
  /** Auto-scroll speed in px/sec. Default 42. */
  speed?: number;
}

type Mode = "fallback" | "auto";

const DRAG_THRESHOLD = 6;

// Curve shape: how far cards rotate / recede / bow as they leave the centre.
const MAX_ROT = 30; // deg of yaw at the edge
const MAX_Z = 170; // px pushed back at the edge
const MAX_Y = 26; // px bowed downward at the edge
const MIN_SCALE = 0.8;
const MIN_OPACITY = 0.4;
const SPREAD = 1.35; // half-viewports over which the curve fully develops

const pad2 = (n: number) => String(Math.max(0, n)).padStart(2, "0");
const isInternal = (href: string) => href.startsWith("/");
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

/** Keep the offset within (-g, 0] so the loop stays seamless in both directions. */
const normalizeOffset = (x: number, g: number): number => {
  if (g <= 0) return 0;
  let nx = x % g;
  if (nx > 0) nx -= g;
  return nx;
};

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
      <div className={className} aria-hidden={interactive ? undefined : true}>
        {children}
      </div>
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

function CardContent({
  project,
  interactive,
}: {
  project: CircularGalleryProject;
  interactive: boolean;
}) {
  const hasThumb = Boolean(project.thumb);
  const n = pad2(project.index);
  return (
    <CardShell
      href={project.href}
      title={project.title}
      interactive={interactive}
      className="group block select-none outline-none"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-[#121212] ring-1 ring-black/10 shadow-[0_26px_60px_-28px_rgba(17,17,17,0.5)]">
        {hasThumb ? (
          // eslint-disable-next-line @next/next/no-img-element -- raw <img>: no next/image domain config in this design system
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
          <span
            aria-hidden
            className="font-display pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[28vw] font-normal leading-none tracking-[-0.04em] text-white/10 md:text-[7rem]"
          >
            {n}
          </span>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
        />
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ring-1 ring-white/45 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 md:h-14 md:w-14"
        >
          <svg width="13" height="16" viewBox="0 0 15 18" fill="none" aria-hidden>
            <path d="M0.75 1.3v15.4L14 9 0.75 1.3Z" fill="#ffffff" />
          </svg>
        </span>
        <span
          aria-hidden
          className="font-display absolute right-4 top-3 text-[0.8rem] tabular-nums tracking-[0.08em] text-white/55"
        >
          {n}
        </span>
      </div>

      {/* Caption below the image (circular-gallery style). */}
      <div className="mt-4 text-center">
        <span className="block text-[0.62rem] uppercase tracking-[0.26em] text-[#8a8a85]">
          {project.category}
        </span>
        <h3 className="font-display mt-1 text-[clamp(1.05rem,2.2vw,1.5rem)] font-normal leading-tight tracking-[-0.01em] text-ink">
          {project.title}
        </h3>
      </div>
    </CardShell>
  );
}

export function CircularGallery({
  projects,
  className,
  speed = 42,
}: CircularGalleryProps) {
  const [mode, setMode] = useState<Mode>("fallback");
  const [copies, setCopies] = useState(3);

  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const innerRefs = useRef<Array<HTMLDivElement | null>>([]);

  const anim = useRef({
    x: 0,
    g: 0, // one group width
    base: 0,
    step: 0,
    cardW: 0,
    vpW: 0,
    hoverPaused: false,
    dragging: false,
    moved: false,
    startX: 0,
    startOffset: 0,
  });

  const total = projects.length;
  const auto = mode === "auto";

  const applyTransform = useCallback(() => {
    const a = anim.current;
    const track = trackRef.current;
    if (track) {
      track.style.transform = `translate3d(${a.x.toFixed(2)}px,0,0)`;
    }
    const half = (a.vpW || 1) / 2;
    const inners = innerRefs.current;
    for (let i = 0; i < inners.length; i++) {
      const inner = inners[i];
      if (!inner) continue;
      const center = a.x + a.base + i * a.step + a.cardW / 2;
      const f = clamp((center - half) / (half * SPREAD), -1, 1);
      const af = Math.abs(f);
      const rotateY = -f * MAX_ROT;
      const tz = -af * MAX_Z;
      const ty = af * MAX_Y;
      const scale = 1 - af * (1 - MIN_SCALE);
      const opacity = 1 - af * (1 - MIN_OPACITY);
      inner.style.transform = `translate3d(0,${ty.toFixed(1)}px,${tz.toFixed(1)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      inner.style.opacity = opacity.toFixed(3);
      inner.style.zIndex = String(1000 - Math.round(af * 1000));
    }
  }, []);

  // Decide animated vs. fallback after mount, kept live as the preference changes.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => setMode(reduce.matches ? "fallback" : "auto");
    evaluate();
    reduce.addEventListener("change", evaluate);
    return () => reduce.removeEventListener("change", evaluate);
  }, []);

  useEffect(() => {
    if (mode !== "auto") return;
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track) return;

    const a = anim.current;
    let raf = 0;
    let last = 0;
    let onscreen = true;
    let visible = typeof document === "undefined" ? true : !document.hidden;

    const measure = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      if (!cards.length) return;
      a.cardW = cards[0].offsetWidth;
      a.base = cards[0].offsetLeft;
      a.step =
        cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : a.cardW;
      a.vpW = viewport.clientWidth;
      a.g = total * a.step;
      if (a.g > 0) {
        const needed = Math.max(2, Math.ceil(a.vpW / a.g) + 2);
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
      if (dt > 0.1) dt = 0.1;
      if (a.g > 0 && !a.hoverPaused && !a.dragging) {
        a.x = normalizeOffset(a.x - speed * dt, a.g);
      }
      applyTransform();
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
    const sync = () => (onscreen && visible ? start() : stop());

    const ro = new ResizeObserver(() => measure());
    ro.observe(viewport);

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
  }, [mode, copies, speed, total, applyTransform]);

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
        /* stale pointer id; ignore */
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
    a.dragging = false;
    const vp = viewportRef.current;
    if (vp) {
      vp.classList.remove(styles.grabbing);
      try {
        vp.releasePointerCapture(e.pointerId);
      } catch {
        /* already released; ignore */
      }
    }
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (anim.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      anim.current.moved = false;
    }
  }, []);

  const cardWidth = "w-[clamp(220px,62vw,320px)]";

  return (
    <section
      ref={rootRef}
      aria-roledescription="carousel"
      aria-label="Featured work gallery"
      className={cn("relative w-full", className)}
    >
      <div
        ref={viewportRef}
        className={cn(
          styles.viewport,
          "relative w-full",
          auto
            ? cn(
                styles.autoViewport,
                "h-[clamp(390px,104vw,560px)] overflow-hidden [touch-action:pan-y]",
              )
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
            auto
              ? "flex h-full w-max items-center"
              : "flex items-center gap-5 px-5 py-2 md:gap-8 md:px-8",
          )}
        >
          {auto
            ? Array.from({ length: copies * total }).map((_, k) => {
                const project = projects[k % total];
                const interactive = k < total;
                return (
                  <div
                    key={k}
                    ref={(el) => {
                      cardRefs.current[k] = el;
                    }}
                    aria-hidden={interactive ? undefined : true}
                    className={cn("shrink-0", cardWidth, "me-5 md:me-9")}
                  >
                    <div
                      ref={(el) => {
                        innerRefs.current[k] = el;
                      }}
                      className={styles.item}
                    >
                      <CardContent project={project} interactive={interactive} />
                    </div>
                  </div>
                );
              })
            : projects.map((project) => (
                <div key={project.id} className={cn("shrink-0 snap-start", cardWidth)}>
                  <CardContent project={project} interactive />
                </div>
              ))}
        </div>
      </div>

      <span className="sr-only">{total} featured projects.</span>
    </section>
  );
}
