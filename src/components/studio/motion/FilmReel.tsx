/*
 * FilmReel — a looping monochrome film-strip motion graphic.
 * An inline SVG film strip (sprocket perforations top & bottom + frame cells)
 * scrolls continuously behind a static projector-gate, and a centred play
 * glyph gently pulses. Pure CSS @keyframes drive a
 * seamless loop, so this is a server component. prefers-reduced-motion freezes
 * a single composed frame. Decorative (aria-hidden).
 */
import { cn } from "@/lib/cn";
import styles from "./FilmReel.module.css";

const VBW = 480;
const VBH = 160;
const TW = 120; // tile width — one repeating segment of the strip
const TILES = 5; // ceil(VBW / TW) + 1 → one spare tile makes the scroll seamless
const HOLE_CX = [20, 60, 100]; // perforation centres within a tile

export function FilmReel({ className }: { className?: string }) {
  const tiles = Array.from({ length: TILES }, (_, i) => i * TW);
  const rootStyle = {
    "--tw": `${TW}px`,
    "--vbw": `${VBW}px`,
  } as React.CSSProperties;

  return (
    <svg
      className={cn(styles.root, className)}
      style={rootStyle}
      viewBox={`0 0 ${VBW} ${VBH}`}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      {/* static projector-gate rails */}
      <line
        x1="0"
        y1="30"
        x2={VBW}
        y2="30"
        stroke="rgba(17,17,17,0.2)"
        strokeWidth="1.5"
      />
      <line
        x1="0"
        y1="130"
        x2={VBW}
        y2="130"
        stroke="rgba(17,17,17,0.2)"
        strokeWidth="1.5"
      />

      {/* scrolling film strip */}
      <g className={styles.strip}>
        {tiles.map((tx) => (
          <g key={tx} transform={`translate(${tx} 0)`}>
            {/* frame cell */}
            <rect
              x="10"
              y="38"
              width="100"
              height="84"
              rx="4"
              fill="rgba(17,17,17,0.04)"
              stroke="rgba(17,17,17,0.25)"
              strokeWidth="1.5"
            />
            <rect
              x="20"
              y="48"
              width="80"
              height="64"
              rx="2"
              fill="none"
              stroke="rgba(17,17,17,0.08)"
              strokeWidth="1"
            />
            {/* perforations */}
            {HOLE_CX.map((cx) => (
              <g key={cx}>
                <rect
                  x={cx - 7}
                  y="12"
                  width="14"
                  height="12"
                  rx="3"
                  fill="rgba(17,17,17,0.33)"
                />
                <rect
                  x={cx - 7}
                  y="136"
                  width="14"
                  height="12"
                  rx="3"
                  fill="rgba(17,17,17,0.33)"
                />
              </g>
            ))}
          </g>
        ))}
      </g>

      {/* centred play glyph */}
      <g className={styles.pulse}>
        <circle
          cx="240"
          cy="80"
          r="22"
          fill="none"
          stroke="rgba(17,17,17,0.35)"
          strokeWidth="1.5"
        />
        <path d="M233 69 L233 91 L254 80 Z" fill="rgba(17,17,17,0.7)" />
      </g>
    </svg>
  );
}
