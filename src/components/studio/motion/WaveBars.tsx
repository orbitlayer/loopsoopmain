/*
 * WaveBars — a monochrome audio-waveform equalizer.
 * A row of vertical bars scale their height up and down on a loop, each with a
 * deterministic (index-derived) duration, delay, amplitude and alpha so the
 * row ripples symmetrically like a sound meter. Pure CSS @keyframes → server
 * component, and every per-bar value is derived from its index (no
 * Math.random, so SSR and client match). prefers-reduced-motion freezes a
 * composed static waveform. Decorative (aria-hidden).
 */
import { cn } from "@/lib/cn";
import styles from "./WaveBars.module.css";

const SLOT = 12; // horizontal space per bar (viewBox units)
const BAR_W = 5;
const VBH = 100; // bars are full-height and scaled about their centre

export function WaveBars({
  bars = 32,
  className,
  height = 72,
}: {
  bars?: number;
  className?: string;
  height?: number;
}) {
  const count = Math.max(1, Math.floor(bars));
  const vbW = count * SLOT;

  return (
    <svg
      className={cn(styles.root, className)}
      style={{ height }}
      viewBox={`0 0 ${vbW} ${VBH}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {Array.from({ length: count }, (_, i) => {
        // Deterministic per-bar motion + resting shape, all derived from index.
        const hi = 0.55 + ((i * 37) % 46) / 100; // peak scaleY 0.55–1.00
        const lo = 0.12 + ((i * 17) % 20) / 100; // trough scaleY 0.12–0.31
        const mid =
          0.28 + 0.6 * (0.5 + 0.5 * Math.sin((i / count) * Math.PI * 3)); // static frame
        const dur = 0.85 + ((i * 13) % 9) * 0.09; // 0.85–1.57s
        const delay = -(((i * 7) % 11) * 0.13); // negative stagger
        const opacity = 0.35 + ((i * 31) % 66) / 100; // 0.35–1.00
        const style = {
          "--lo": lo,
          "--hi": hi,
          "--dur": `${dur}s`,
          "--delay": `${delay}s`,
          transform: `scaleY(${mid.toFixed(4)})`,
          opacity,
        } as React.CSSProperties;
        return (
          <rect
            key={i}
            className={styles.bar}
            x={i * SLOT + (SLOT - BAR_W) / 2}
            y={0}
            width={BAR_W}
            height={VBH}
            rx={BAR_W / 2}
            style={style}
          />
        );
      })}
    </svg>
  );
}
