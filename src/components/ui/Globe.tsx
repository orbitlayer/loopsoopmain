"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { GLOBE_LAND_B64 } from "@/lib/globe-land";

/*
 * Globe — a dotted world globe in the spirit of reactbits.dev's Globe, drawn on
 * a 2D canvas (no WebGL) so it renders consistently everywhere and stays light.
 * The dots trace real continents: an even sphere sampling filtered to land (see
 * src/lib/globe-land.ts), projected orthographically and faded with depth.
 * City markers and faint great-circle arcs between them say "connecting
 * countries." It auto-rotates, can be dragged to spin, and — per Aurora.tsx —
 * the loop is torn down when scrolled offscreen or the tab is hidden. Under
 * prefers-reduced-motion it draws once, still, with no interaction.
 */

const TILT = 0.4; // fixed lean, radians
const DEG = Math.PI / 180;

// City markers (lat, lng). Index 0 (Mumbai) is the hub the arcs fan out from.
const CITIES: [number, number][] = [
  [19.07, 72.87], // Mumbai (hub)
  [40.71, -74.0], // New York
  [51.51, -0.12], // London
  [1.35, 103.82], // Singapore
  [-33.87, 151.21], // Sydney
  [-23.55, -46.63], // São Paulo
  [34.05, -118.24], // Los Angeles
  [25.2, 55.27], // Dubai
  [35.68, 139.69], // Tokyo
];

type V3 = { x: number; y: number; z: number };

function latLngToV3(lat: number, lng: number): V3 {
  const a = lat * DEG;
  const o = lng * DEG;
  return {
    x: Math.cos(a) * Math.cos(o),
    y: Math.sin(a),
    z: Math.cos(a) * Math.sin(o),
  };
}

// Decode the packed land dataset (Int16 pairs: lat*100, lng*100) → unit vectors.
function decodeLand(): V3[] {
  const bin = atob(GLOBE_LAND_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const i16 = new Int16Array(bytes.buffer);
  const out: V3[] = [];
  for (let i = 0; i < i16.length; i += 2) {
    out.push(latLngToV3(i16[i] / 100, i16[i + 1] / 100));
  }
  return out;
}

// Great-circle arc points between two unit vectors, bowed slightly outward.
function arcPoints(a: V3, b: V3, steps: number): V3[] {
  const dot = Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z));
  const omega = Math.acos(dot);
  const so = Math.sin(omega) || 1e-6;
  const pts: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k0 = Math.sin((1 - t) * omega) / so;
    const k1 = Math.sin(t * omega) / so;
    const lift = 1 + 0.16 * Math.sin(Math.PI * t); // arch above the surface
    pts.push({
      x: (a.x * k0 + b.x * k1) * lift,
      y: (a.y * k0 + b.y * k1) * lift,
      z: (a.z * k0 + b.z * k1) * lift,
    });
  }
  return pts;
}

export function Globe({ className }: { className?: string }) {
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

    const land = decodeLand();
    const cities = CITIES.map(([la, ln]) => latLngToV3(la, ln));
    const arcs = cities.slice(1).map((c) => arcPoints(cities[0], c, 36));

    let size = 0;
    let dpr = 1;
    // Start with India facing the viewer, then auto-spin eastward from there.
    // A point's longitude faces front when phi = lng - 90deg (India ~77degE).
    let phi = 77 * DEG - Math.PI / 2;
    let theta = TILT; // pitch — auto-drifts and is draggable
    let t = 0;
    const drag = { active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 };

    const resize = () => {
      size = Math.round(wrap.clientWidth);
      if (!size) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      if (reduced) draw();
    };

    // Yaw (phi) around the vertical axis, then pitch (theta) around the
    // horizontal axis — free rotation in every direction. z > 0 → front.
    const rot = (p: V3): V3 => {
      const sy = Math.sin(phi);
      const cy = Math.cos(phi);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const sp = Math.sin(theta);
      const cp = Math.cos(theta);
      // Project with north UP (canvas y grows downward, so negate y) and east to
      // the RIGHT (negate x). Without this the map renders upside-down and
      // mirrored, and the auto-spin reads as running backwards.
      return { x: -x1, y: -(p.y * cp - z1 * sp), z: p.y * sp + z1 * cp };
    };

    const draw = () => {
      const c = size / 2;
      const R = size * 0.4;
      const u = R / 150; // scale unit
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // Soft halo.
      const halo = ctx.createRadialGradient(c, c, R * 0.6, c, c, R * 1.3);
      halo.addColorStop(0, "rgba(17,17,17,0.05)");
      halo.addColorStop(1, "rgba(17,17,17,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Continents — the facing hemisphere reads bright and solid, fading back.
      for (const p of land) {
        const v = rot(p);
        const depth = (v.z + 1) / 2; // 0 back … 1 front
        if (depth < 0.08) continue; // drop the far back face
        const alpha = 0.1 + 0.8 * depth;
        const s = Math.max(0.7, (0.6 + 1.3 * depth) * u);
        ctx.fillStyle = `rgba(17,17,17,${alpha})`;
        ctx.fillRect(c + v.x * R - s / 2, c + v.y * R - s / 2, s, s);
      }

      // Connection arcs from the hub, front hemisphere only, with a travelling
      // pulse to suggest live links.
      for (let ai = 0; ai < arcs.length; ai++) {
        const pts = arcs[ai];
        ctx.lineWidth = 1 * u;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = rot(pts[i]);
          const b = rot(pts[i + 1]);
          const d = (a.z + b.z) / 2;
          if (d <= -0.1) continue;
          const alpha = 0.05 + 0.3 * Math.max(0, d);
          ctx.strokeStyle = `rgba(17,17,17,${alpha})`;
          ctx.beginPath();
          ctx.moveTo(c + a.x * R, c + a.y * R);
          ctx.lineTo(c + b.x * R, c + b.y * R);
          ctx.stroke();
        }
        // Travelling highlight.
        const tp = (t * 0.004 + ai * 0.17) % 1;
        const idx = Math.floor(tp * (pts.length - 1));
        const hv = rot(pts[idx]);
        if (hv.z > 0) {
          ctx.fillStyle = `rgba(17,17,17,${0.5 + 0.3 * hv.z})`;
          ctx.beginPath();
          ctx.arc(c + hv.x * R, c + hv.y * R, 1.5 * u, 0, 6.283);
          ctx.fill();
        }
      }

      // City markers with a gentle pulse.
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.05);
      for (let mi = 0; mi < cities.length; mi++) {
        const v = rot(cities[mi]);
        if (v.z <= 0.02) continue;
        const x = c + v.x * R;
        const y = c + v.y * R;
        const hub = mi === 0;
        ctx.beginPath();
        ctx.arc(x, y, (2.2 + pulse * 2.8) * u, 0, 6.283);
        ctx.fillStyle = `rgba(17,17,17,${0.1 + 0.12 * (1 - pulse)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, (hub ? 2.4 : 1.7) * u, 0, 6.283);
        ctx.fillStyle = "rgba(17,17,17,0.9)";
        ctx.fill();
      }
    };

    const step = () => {
      if (!drag.active) {
        phi += 0.003 + drag.vx; // yaw auto-spin + fling momentum
        drag.vx *= 0.94;
        theta += drag.vy;
        drag.vy *= 0.94;
        // Gentle auto pitch drift so the poles rotate into view over time.
        const target = 0.35 * Math.sin(t * 0.0009);
        theta += (target - theta) * 0.006;
      }
      t += 1;
      draw();
    };

    // --- RAF loop, paused offscreen / tab hidden -----------------------------
    let raf = 0;
    let running = false;
    let inView = true;
    let docVisible = !document.hidden;
    const frame = () => {
      step();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!running && !reduced && size > 0) {
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

    const ro = new ResizeObserver(() => {
      resize();
      sync();
    });
    ro.observe(wrap);

    // --- drag to spin (skipped under reduced motion) -------------------------
    const onDown = (e: PointerEvent) => {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      drag.vx = 0;
      drag.vy = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = (e.clientX - drag.lastX) * 0.006; // horizontal → yaw
      const dy = (e.clientY - drag.lastY) * 0.006; // vertical → pitch
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      // Yaw is negated to match the mirrored projection, so dragging right spins
      // the globe to the right (natural) rather than backwards.
      phi -= dx;
      theta += dy;
      drag.vx = -dx;
      drag.vy = dy;
    };
    const onUp = (e: PointerEvent) => {
      drag.active = false;
      canvas.releasePointerCapture?.(e.pointerId);
      canvas.style.cursor = "grab";
    };
    if (!reduced) {
      canvas.style.cursor = "grab";
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);
    }

    resize();
    sync();
    if (reduced) draw();

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label="Rotating world globe connecting the places we work"
      className={cn("relative mx-auto aspect-square w-full", className)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden
        className="h-full w-full cursor-grab [touch-action:pan-y]"
      />
    </div>
  );
}
