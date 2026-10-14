"use client";

/*
 * LogoLoop — an original recreation of reactbits.dev's "Logo Loop".
 * A seamless, infinitely scrolling horizontal marquee. The children are
 * rendered twice back-to-back in a flex track; a rAF transform loop drifts the
 * track at `speed` px/sec and wraps by exactly one set width + gap, so the two
 * copies line up perfectly and there is no visible seam. Optional edge-fade
 * mask and pause-on-hover.
 *
 * SSR-safe (all measurement happens in an effect). The first copy carries the
 * real content; the duplicate is aria-hidden so assistive tech doesn't read the
 * logos twice. prefers-reduced-motion leaves the track static (no scroll), and
 * the loop is paused when scrolled offscreen (IntersectionObserver) or when the
 * tab is hidden. ResizeObserver keeps the wrap distance correct on resize.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type LogoLoopProps = {
  children: React.ReactNode[];
  /** Scroll speed in px/sec. Default 40. */
  speed?: number;
  /** Travel direction. Default "left". */
  direction?: "left" | "right";
  /** Gap between items (and between the two copies) in px. Default 64. */
  gap?: number;
  /** Pause while hovered. Default true. */
  pauseOnHover?: boolean;
  /** Soft fade at the left/right edges. Default true. */
  fade?: boolean;
  className?: string;
};

export function LogoLoop({
  children,
  speed = 40,
  direction = "left",
  gap = 64,
  pauseOnHover = true,
  fade = true,
  className,
}: LogoLoopProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const set = setRef.current;
    if (!track || !set) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      track.style.transform = "translate3d(0,0,0)";
      return; // static, no loop
    }

    // The wrap distance is one set width + one gap, so item i+N lands exactly
    // where item i was (the gap between the two copies matches the inner gap).
    let period = 0;
    let pos = 0;
    const measure = () => {
      period = set.offsetWidth + gap;
    };
    measure();

    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;
    let last = 0;

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-switch jumps
      last = now;
      if (!pausedRef.current && period > 0) {
        pos = (pos + speed * dt) % period;
        const x = direction === "left" ? -pos : pos - period;
        track.style.transform = `translate3d(${x}px,0,0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };
    const sync = () => (inView && docVisible ? start() : stop());

    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(track);
    const onVis = () => {
      docVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    const ro = new ResizeObserver(() => measure());
    ro.observe(set);

    sync();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [children, speed, direction, gap]);

  const fadeStyle: CSSProperties | undefined = fade
    ? {
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%)",
      }
    : undefined;

  const handleEnter =
    pauseOnHover === false ? undefined : () => (pausedRef.current = true);
  const handleLeave =
    pauseOnHover === false ? undefined : () => (pausedRef.current = false);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={fadeStyle}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <div
        ref={trackRef}
        className="flex w-max will-change-transform"
        style={{ gap: `${gap}px` }}
      >
        <div ref={setRef} className="flex shrink-0 items-center" style={{ gap: `${gap}px` }}>
          {children.map((child, i) => (
            <span key={i} className="flex shrink-0 items-center">
              {child}
            </span>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="flex shrink-0 items-center"
          style={{ gap: `${gap}px` }}
        >
          {children.map((child, i) => (
            <span key={i} className="flex shrink-0 items-center">
              {child}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
