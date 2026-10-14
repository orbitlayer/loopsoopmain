"use client";

import { useEffect, useState } from "react";
import Aurora from "./Aurora";

/*
 * Refined hero backdrop for LOOPSOOP. Places the Aurora effect as a soft,
 * low-opacity wash across the top of a hero, faded into the off-white page via
 * a bottom mask. Sits behind hero content (give the content `relative z-10`).
 * Respects prefers-reduced-motion (renders nothing) and only mounts client-side
 * so there's no SSR/WebGL mismatch.
 */
export function HeroAurora() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setEnabled(!mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  if (!enabled) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px] opacity-50 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_92%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_92%)]"
    >
      <Aurora
        colorStops={["#a5b4fc", "#c4b5fd", "#93c5fd"]}
        amplitude={0.85}
        blend={0.5}
        speed={0.5}
      />
    </div>
  );
}
