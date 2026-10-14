/*
 * OrbitRings — a calm, premium 2D motion accent for light sections.
 * Concentric hairline ink rings (varying alpha) with small dots/markers that
 * orbit at different radii and speeds, plus a faint crosshair and a ring of tick
 * marks. Pure inline SVG + CSS @keyframes (no JS): each orbit is a nested <g>
 * rotated about the viewBox centre, so it is cheap, crisp and SSR-safe as a
 * server component. Monochrome only — ink at low alpha on near-white.
 *
 * Reduced motion (CSS @media in the module) freezes every orbit into a static,
 * composed frame. Decorative, so the root SVG is aria-hidden and scales to its
 * box (viewBox + width/height 100%, kept square by preserveAspectRatio).
 */

import { cn } from "@/lib/cn";
import styles from "./OrbitRings.module.css";

export type OrbitRingsProps = {
  className?: string;
};

const CENTER = 200;
const TICK_R0 = 178;
const TICK_R1 = 187;

// Deterministic ring of tick marks around the outer edge (computed once at
// import — no Math.random, no per-render work, so SSR output is stable).
const TICKS = Array.from({ length: 24 }, (_, i) => {
  const a = (i / 24) * Math.PI * 2;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    x1: round(CENTER + TICK_R0 * cos),
    y1: round(CENTER + TICK_R0 * sin),
    x2: round(CENTER + TICK_R1 * cos),
    y2: round(CENTER + TICK_R1 * sin),
  };
});

export function OrbitRings({ className }: OrbitRingsProps) {
  return (
    <svg
      className={cn(styles.root, className)}
      viewBox="0 0 400 400"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="orbit-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(17,17,17,0.05)" />
          <stop offset="60%" stopColor="rgba(17,17,17,0.02)" />
          <stop offset="100%" stopColor="rgba(17,17,17,0)" />
        </radialGradient>
      </defs>

      {/* Soft ink glow pooled at the centre */}
      <circle cx={CENTER} cy={CENTER} r={150} fill="url(#orbit-glow)" />

      {/* Faint crosshair */}
      <g stroke="rgba(17,17,17,0.05)" strokeWidth={1}>
        <line x1={CENTER} y1={26} x2={CENTER} y2={374} />
        <line x1={26} y1={CENTER} x2={374} y2={CENTER} />
      </g>

      {/* Concentric hairline rings (varying alpha) */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={72}
        stroke="rgba(17,17,17,0.2)"
        strokeWidth={1.25}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={120}
        stroke="rgba(17,17,17,0.1)"
        strokeWidth={1.25}
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={170}
        stroke="rgba(17,17,17,0.06)"
        strokeWidth={1.25}
      />

      {/* Tick ring around the outer edge */}
      <g stroke="rgba(17,17,17,0.08)" strokeWidth={1}>
        {TICKS.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
        ))}
      </g>

      {/* Static centre dot */}
      <circle cx={CENTER} cy={CENTER} r={2.5} fill="rgba(17,17,17,0.7)" />

      {/* Orbit 1 — inner ring, faster */}
      <g className={styles.spin}>
        <circle
          cx={CENTER}
          cy={CENTER - 72}
          r={7}
          fill="rgba(17,17,17,0.06)"
        />
        <circle cx={CENTER} cy={CENTER - 72} r={3} fill="rgba(17,17,17,0.9)" />
      </g>

      {/* Orbit 2 — mid ring, reversed, with a small marker tick */}
      <g className={styles.spinRev}>
        <line
          x1={CENTER + 112}
          y1={CENTER}
          x2={CENTER + 128}
          y2={CENTER}
          stroke="rgba(17,17,17,0.28)"
          strokeWidth={1.25}
        />
        <circle
          cx={CENTER + 120}
          cy={CENTER}
          r={2.5}
          fill="rgba(17,17,17,0.5)"
        />
      </g>

      {/* Orbit 3 — outer ring, slow, two opposed markers */}
      <g className={styles.spinSlow}>
        <circle
          cx={CENTER}
          cy={CENTER - 170}
          r={2}
          fill="rgba(17,17,17,0.33)"
        />
        <circle
          cx={CENTER}
          cy={CENTER + 170}
          r={2}
          fill="rgba(17,17,17,0.22)"
        />
      </g>
    </svg>
  );
}
