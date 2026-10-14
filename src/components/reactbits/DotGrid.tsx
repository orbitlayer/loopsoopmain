"use client";

/*
 * DotGrid — an original recreation of reactbits.dev's "Dot Grid".
 * A full-bleed canvas draws an evenly spaced grid of dots. Dots within `radius`
 * of the pointer scale up and brighten, interpolating dotColor -> activeColor
 * and growing in size by their proximity, for a subtle interactive section
 * background that works on light OR dark surfaces (the caller passes colours).
 *
 * Conventions borrowed from ParticleText.tsx: the rAF loop is paused whenever
 * the canvas is scrolled out of view (IntersectionObserver) or the tab is
 * hidden (visibilitychange), the canvas is sized to its box via ResizeObserver
 * with devicePixelRatio capped at 2, and prefers-reduced-motion draws the grid
 * once with no pointer reaction. The pointer is tracked through a *window*
 * pointermove listener mapped to the canvas rect, so it still reacts even though
 * the canvas is pointer-events-none. Everything is torn down on unmount.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type DotGridProps = {
  className?: string;
  /** Grid spacing in px. Default 28. */
  gap?: number;
  /** Resting dot colour (rgba / rgb / hex). Default "rgba(17,17,17,0.18)". */
  dotColor?: string;
  /** Colour of dots under the pointer. Default "rgba(17,17,17,0.5)". */
  activeColor?: string;
  /** Pointer influence radius in px. Default 140. */
  radius?: number;
};

type Rgba = [number, number, number, number];

// Parse rgba()/rgb()/#rgb/#rrggbb/#rrggbbaa into [r,g,b,a]. Falls back to the
// default ink dot colour on anything unrecognised.
function parseRgba(input: string): Rgba {
  const s = input.trim();
  if (s.charCodeAt(0) === 35 /* # */) {
    let hex = s.slice(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if (![r, g, b].some(Number.isNaN)) return [r, g, b, a];
    }
  }
  const m = s.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(",").map((v) => parseFloat(v.trim()));
    return [p[0] || 0, p[1] || 0, p[2] || 0, p[3] === undefined ? 1 : p[3]];
  }
  return [17, 17, 17, 0.18];
}

export function DotGrid({
  className,
  gap = 28,
  dotColor = "rgba(17,17,17,0.18)",
  activeColor = "rgba(17,17,17,0.5)",
  radius = 140,
}: DotGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const base = parseRgba(dotColor);
    const active = parseRgba(activeColor);
    const step = Math.max(6, gap);
    const influence = Math.max(1, radius);
    const BASE_R = 1.4; // resting dot radius (css px)
    const ACTIVE_R = 3.4; // dot radius right under the pointer

    let w = 0;
    let h = 0;
    let dpr = 1;
    let dirty = true; // only repaint when something changed
    // Pointer position in canvas-local css px; active flags whether it is near.
    const mouse = { x: -9999, y: -9999, active: false };

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      dirty = true;
      if (reduced) draw(); // single static paint, no loop
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cols = Math.max(1, Math.floor(w / step));
      const rows = Math.max(1, Math.floor(h / step));
      const offX = (w - (cols - 1) * step) / 2;
      const offY = (h - (rows - 1) * step) / 2;
      const r2 = influence * influence;

      for (let gy = 0; gy < rows; gy++) {
        const py = offY + gy * step;
        for (let gx = 0; gx < cols; gx++) {
          const px = offX + gx * step;

          let t = 0;
          if (mouse.active && !reduced) {
            const dx = px - mouse.x;
            const dy = py - mouse.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < r2) t = 1 - Math.sqrt(d2) / influence;
          }

          const cr = base[0] + (active[0] - base[0]) * t;
          const cg = base[1] + (active[1] - base[1]) * t;
          const cb = base[2] + (active[2] - base[2]) * t;
          const ca = base[3] + (active[3] - base[3]) * t;
          const rad = BASE_R + (ACTIVE_R - BASE_R) * t;

          ctx.beginPath();
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${ca})`;
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // --- rAF loop, paused offscreen / when the tab is hidden -----------------
    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;

    const frame = () => {
      if (dirty) {
        draw();
        dirty = false;
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!running && !reduced && w > 0) {
        running = true;
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
    io.observe(canvas);
    const onVis = () => {
      docVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    // --- pointer via window (canvas is pointer-events-none) ------------------
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      // Only react when the pointer is within the box + a radius margin.
      if (
        mx >= -influence &&
        mx <= w + influence &&
        my >= -influence &&
        my <= h + influence
      ) {
        mouse.x = mx;
        mouse.y = my;
        mouse.active = true;
        dirty = true;
      } else if (mouse.active) {
        mouse.active = false;
        dirty = true; // settle back to the resting grid once
      }
    };
    const onLeaveWindow = () => {
      if (mouse.active) {
        mouse.active = false;
        dirty = true;
      }
    };
    if (!reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeaveWindow);
      window.addEventListener("blur", onLeaveWindow);
    }

    // --- build now and on resize ---------------------------------------------
    build();
    sync();
    const ro = new ResizeObserver(() => {
      build();
      sync();
    });
    ro.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeaveWindow);
      window.removeEventListener("blur", onLeaveWindow);
    };
  }, [gap, dotColor, activeColor, radius]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
