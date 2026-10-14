"use client";

/*
 * Marquee — a huge, seamless horizontal text marquee (font-display) with a
 * separator glyph between items. Items render twice, back-to-back, and a single
 * rAF loop translates the track at a constant px/sec, wrapping by exactly one
 * group width for a seamless loop; some items are drawn as ink outline for
 * variety (monochrome). Direction and speed are prop-driven.
 *
 * Performance / correctness: the rAF only runs when the band is on-screen
 * (IntersectionObserver) AND the tab is visible (visibilitychange), pauses on
 * hover, and every observer/listener/rAF is torn down on cleanup. The group
 * width is tracked with a ResizeObserver so the loop stays seamless across
 * resizes and late font loads. SSR renders both groups static (no transform set
 * in React, applied only via a ref after mount — no hydration mismatch), and
 * reduced motion / no-JS leave it static and readable. The band is
 * overflow-hidden, so the max-content track never overflows the page.
 */

import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Marquee.module.css";

export interface MarqueeProps {
  items: string[];
  className?: string;
  /** Scroll speed in px/sec. Default 60. */
  speed?: number;
  /** Travel direction. Default "left". */
  direction?: "left" | "right";
  /** Node rendered between items. Default a faint four-point star. */
  separator?: ReactNode;
}

export function Marquee({
  items,
  className,
  speed = 60,
  direction = "left",
  separator = "✦",
}: MarqueeProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const band = bandRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!band || !track || !group) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      track.style.transform = "translateX(0px)";
      return;
    }

    const dir = direction === "right" ? 1 : -1;

    let raf = 0;
    let last = 0;
    let x = 0;
    let width = 0;
    let inited = false;
    let onscreen = true;
    let visible = typeof document === "undefined" ? true : !document.hidden;
    let paused = false;

    const measure = () => {
      width = group.getBoundingClientRect().width;
      if (!inited && width > 0) {
        x = dir < 0 ? 0 : -width;
        inited = true;
        track.style.transform = `translateX(${x}px)`;
      }
    };
    measure();

    const tick = (t: number) => {
      if (last === 0) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.1) dt = 0.1; // clamp long gaps (throttled / returned-to tab)
      if (width > 0 && !paused) {
        x += dir * speed * dt;
        if (dir < 0) {
          if (x <= -width) x += width;
        } else if (x >= 0) {
          x -= width;
        }
        track.style.transform = `translateX(${x}px)`;
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
    ro.observe(group);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onscreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(band);

    const onVisibility = () => {
      visible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    band.addEventListener("pointerenter", onEnter);
    band.addEventListener("pointerleave", onLeave);

    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      band.removeEventListener("pointerenter", onEnter);
      band.removeEventListener("pointerleave", onLeave);
    };
  }, [speed, direction]);

  if (!items || items.length === 0) return null;

  const renderGroup = (groupKey: string, hidden: boolean) => (
    <div
      key={groupKey}
      ref={hidden ? undefined : groupRef}
      className={styles.group}
      aria-hidden={hidden ? "true" : undefined}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          <span
            className={cn(
              styles.item,
              "font-display uppercase tracking-tight",
              i % 2 === 1 ? styles.outline : "text-ink",
            )}
          >
            {item}
          </span>
          <span className={styles.sep} aria-hidden="true">
            {separator}
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div ref={bandRef} className={cn(styles.band, className)}>
      <div
        ref={trackRef}
        className={cn(
          styles.track,
          "font-display text-[clamp(1.5rem,4vw,3rem)] leading-[1.15]",
        )}
      >
        {renderGroup("a", false)}
        {renderGroup("b", true)}
      </div>
    </div>
  );
}
