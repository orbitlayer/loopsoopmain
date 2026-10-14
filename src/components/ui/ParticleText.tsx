"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

/*
 * ParticleText — an original take on reactbits.dev's "Particle Text" effect.
 * The word is rasterised to an offscreen canvas, its opaque pixels are sampled
 * on a grid into particles, and those particles fly in on first paint and then
 * spring to their home position. The pointer repels nearby particles, which
 * ease back when it leaves. Built for the dark footer (light particles on
 * bg-dark).
 *
 * Conventions borrowed from Aurora.tsx: the RAF loop is paused whenever the
 * block is scrolled out of view or the tab is hidden, and prefers-reduced-motion
 * is honoured — there we draw the resting word once and attach no interaction.
 */

type Particle = {
  hx: number; // home position (css px)
  hy: number;
  x: number; // current position
  y: number;
  vx: number;
  vy: number;
  size: number;
};

export function ParticleText({
  text = "Loopsoop",
  color = "#f6f6f4",
  className,
}: {
  text?: string;
  color?: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Resolve the brand font actually in use (next/font exposes it only through
    // a CSS variable, which ctx.font can't read), so the raster matches the UI.
    const probe = getComputedStyle(wrap).fontFamily || "sans-serif";

    const GAP = 4; // sampling grid, css px — lower = denser/heavier
    const DOT = 1.8; // particle draw size
    const EASE = 0.12; // pull back toward home
    const FRICTION = 0.86;
    const MOUSE_R = 92; // repulsion radius, css px
    const MOUSE_F = 0.9; // repulsion strength

    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999, active: false };

    const build = () => {
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      if (w === 0 || h === 0) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Raster the word on a CSS-resolution offscreen canvas, fitted to the box.
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return;

      // Pick the largest bold size that fits both the width (92%) and height.
      let fontSize = Math.min(h * 0.72, 320);
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      const maxW = w * 0.92;
      for (let i = 0; i < 24; i++) {
        octx.font = `700 ${fontSize}px ${probe}`;
        if (octx.measureText(text).width <= maxW) break;
        fontSize *= 0.92;
      }
      octx.fillStyle = "#fff";
      octx.fillText(text, w / 2, h / 2 + fontSize * 0.02);

      const data = octx.getImageData(0, 0, w, h).data;
      const next: Particle[] = [];
      for (let y = 0; y < h; y += GAP) {
        for (let x = 0; x < w; x += GAP) {
          if (data[(y * w + x) * 4 + 3] > 128) {
            next.push({
              hx: x,
              hy: y,
              // Fly in from a random scatter (or start home under reduced motion).
              x: reduced ? x : Math.random() * w,
              y: reduced ? y : Math.random() * h,
              vx: 0,
              vy: 0,
              size: DOT + Math.random() * 0.6,
            });
          }
        }
      }
      particles = next;

      if (reduced) draw(); // single static paint, no loop
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const p of particles) {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    };

    const step = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color;
      for (const p of particles) {
        // Spring toward home.
        p.vx += (p.hx - p.x) * EASE;
        p.vy += (p.hy - p.y) * EASE;
        // Repel from the pointer.
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < MOUSE_R && dist > 0) {
            const f = ((MOUSE_R - dist) / MOUSE_R) * MOUSE_F;
            p.vx += (dx / dist) * f * 14;
            p.vy += (dy / dist) * f * 14;
          }
        }
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    };

    // --- RAF loop, paused offscreen / when the tab is hidden ------------------
    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;
    const frame = () => {
      step();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!running && !reduced && particles.length) {
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
    io.observe(wrap);
    const onVis = () => {
      docVisible = !document.hidden;
      sync();
    };
    document.addEventListener("visibilitychange", onVis);

    // --- pointer (skipped under reduced motion) ------------------------------
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };
    if (!reduced) {
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerleave", onLeave);
    }

    // --- build now (after fonts load) and on resize --------------------------
    let ro: ResizeObserver | null = null;
    const rebuild = () => {
      const wasRunning = running;
      stop();
      build();
      if (wasRunning || (!reduced && inView && docVisible)) sync();
    };
    const init = () => {
      build();
      sync();
      ro = new ResizeObserver(() => rebuild());
      ro.observe(wrap);
    };
    if (document.fonts?.ready) {
      document.fonts.ready.then(init).catch(init);
    } else {
      init();
    }

    return () => {
      stop();
      io.disconnect();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [text, color]);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={text}
      className={cn("font-logo relative w-full select-none", className)}
    >
      <canvas ref={canvasRef} aria-hidden className="h-full w-full" />
    </div>
  );
}
