"use client";

/*
 * ClickSpark — a recreation of reactbits.dev's "Click Spark".
 * Wraps children in a relative container with a pointer-events-none canvas
 * overlay. On pointer-down inside the container, `count` short spark lines
 * radiate from the click point, flying outward and fading over ~450ms. A rAF
 * loop drives the animation and runs ONLY while sparks are alive (it stops the
 * moment none remain), so there is no idle frame work.
 *
 * SSR-safe: all canvas/window access is inside effects and handlers. The canvas
 * is sized to the container via ResizeObserver with devicePixelRatio capped at
 * 2, aria-hidden (decorative), and pointer-events:none so children stay fully
 * clickable. prefers-reduced-motion suppresses sparks entirely (children remain
 * interactive). Everything is torn down on unmount.
 */

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";

export type ClickSparkProps = {
  children: React.ReactNode;
  className?: string;
  /** Spark colour (any CSS colour). Default "#111". */
  sparkColor?: string;
  /** Number of spark lines per click. Default 8. */
  count?: number;
  /** Base spark length / reach in px. Default 10. */
  size?: number;
};

type Spark = { x: number; y: number; angle: number; start: number };

const DURATION = 450;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function ClickSpark({
  children,
  className,
  sparkColor = "#111",
  count = 8,
  size = 10,
}: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Keep the latest draw params without re-subscribing the loop.
  const paramsRef = useRef({ sparkColor, count, size });
  useEffect(() => {
    paramsRef.current = { sparkColor, count, size };
  }, [sparkColor, count, size]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Stop any in-flight loop when the tab is hidden; clear sparks so nothing
    // runs in the background.
    const onVisibility = () => {
      if (document.hidden) {
        sparksRef.current = [];
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, sizeRef.current.w, sizeRef.current.h);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      sparksRef.current = [];
    };
  }, []);

  const draw = (now: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      rafRef.current = null;
      return;
    }

    const { w, h } = sizeRef.current;
    const { sparkColor: color, size: reach } = paramsRef.current;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, reach / 8);

    const travel = reach * 2.5;
    const alive: Spark[] = [];

    for (const s of sparksRef.current) {
      const t = (now - s.start) / DURATION;
      if (t >= 1) continue;
      alive.push(s);

      const eased = easeOut(t);
      const dist = eased * travel;
      const len = reach * (1 - eased);
      const cos = Math.cos(s.angle);
      const sin = Math.sin(s.angle);

      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.moveTo(s.x + cos * dist, s.y + sin * dist);
      ctx.lineTo(s.x + cos * (dist + len), s.y + sin * (dist + len));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    sparksRef.current = alive;
    rafRef.current = alive.length > 0 ? requestAnimationFrame(draw) : null;
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedRef.current) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { count: n } = paramsRef.current;

    const base = Math.random() * Math.PI * 2;
    const start = performance.now();
    for (let i = 0; i < n; i += 1) {
      sparksRef.current.push({
        x,
        y,
        angle: base + (i * Math.PI * 2) / n,
        start,
      });
    }

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(draw);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onPointerDown={handlePointerDown}
    >
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      />
    </div>
  );
}
