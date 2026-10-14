"use client";

/*
 * Threads — an original recreation of reactbits.dev's "Threads" (Canvas2D).
 * A full-bleed canvas draws several smooth horizontal sine-wave lines that
 * drift and undulate over time — a calm, premium monochrome motion-graphic
 * backdrop. Each line is pinned to the left/right edges (a sine envelope tapers
 * its amplitude to zero at the sides) so the lines read as woven threads, and
 * two slowly-detuned harmonics give each one an organic, non-repetitive flow.
 *
 * Conventions borrowed from ParticleText.tsx: the rAF loop is paused whenever
 * the canvas is scrolled out of view (IntersectionObserver) or the tab is
 * hidden (visibilitychange), the canvas is sized to its box via ResizeObserver
 * with devicePixelRatio capped at 2, and prefers-reduced-motion draws the
 * gently-curved lines once with no animation. Decorative, so aria-hidden and
 * pointer-events-none. Everything is torn down on unmount.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export type ThreadsProps = {
  className?: string;
  /** Stroke colour (rgba / rgb / hex). Default "rgba(17,17,17,0.12)". */
  color?: string;
  /** Number of flowing lines. Default 5. */
  lineCount?: number;
  /** Peak wave height in px (at mid-span). Default 18. */
  amplitude?: number;
  /** Flow speed multiplier. Default 0.6. */
  speed?: number;
};

const TWO_PI = Math.PI * 2;

export function Threads({
  className,
  color = "rgba(17,17,17,0.12)",
  lineCount = 5,
  amplitude = 18,
  speed = 0.6,
}: ThreadsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const count = Math.max(1, Math.round(lineCount));
    const SEG = 6; // horizontal sampling step in css px — lower = smoother

    let w = 0;
    let h = 0;
    let dpr = 1;
    let startTime = 0;

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (reduced) draw(0); // single static paint, no loop
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.strokeStyle = color;

      for (let i = 0; i < count; i++) {
        const baseY = (h * (i + 1)) / (count + 1);
        // Per-line detuning so the threads never march in lock-step.
        const freq = 1.2 + i * 0.35;
        const freq2 = freq * 1.7;
        const phase = i * 0.9;
        const sp = speed * (0.6 + i * 0.12);
        const dir = i % 2 === 0 ? 1 : -1;

        ctx.beginPath();
        for (let x = 0; x <= w; x += SEG) {
          const u = w === 0 ? 0 : x / w;
          const envelope = Math.sin(Math.PI * u); // 0 at edges, 1 at mid-span
          const wave =
            Math.sin(u * freq * TWO_PI + dir * t * sp + phase) * 0.6 +
            Math.sin(u * freq2 * TWO_PI - dir * t * sp * 0.7 + phase * 2) * 0.4;
          const y = baseY + envelope * amplitude * wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    // --- rAF loop, paused offscreen / when the tab is hidden -----------------
    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;

    const frame = (now: number) => {
      if (!startTime) startTime = now;
      draw((now - startTime) / 1000);
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
    };
  }, [color, lineCount, amplitude, speed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
