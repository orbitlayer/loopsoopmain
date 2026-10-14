"use client";

/*
 * SpotlightCard — a monochrome recreation of reactbits.dev's "Spotlight Card".
 * A rounded card that, on pointermove, tracks the cursor via --x/--y CSS vars
 * (set from getBoundingClientRect) and paints a soft radial spotlight overlay
 * at that point. The spotlight fades in on hover and out on leave.
 *
 * Light variant: a faint ink spotlight on a white surface with a hairline
 * border. Dark variant: a faint white spotlight on a near-black surface with a
 * subtle ring (border-color is overridden globally, so dark uses ring, not
 * border). The card renders its children fully on the server (SSR-safe); the
 * overlay is decorative (aria-hidden) and only appears client-side. Under
 * prefers-reduced-motion the pointer tracking and spotlight are disabled and
 * the card renders as a plain resting card.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type SpotlightCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
};

export function SpotlightCard({
  children,
  className,
  variant = "light",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  // false on the server + under reduced motion → no tracking, no spotlight.
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  const isDark = variant === "dark";
  const spot = isDark ? "rgba(255,255,255,0.08)" : "rgba(17,17,17,0.05)";

  const overlayStyle: CSSProperties = {
    opacity: active ? 1 : 0,
    background: `radial-gradient(260px circle at var(--x, 50%) var(--y, 50%), ${spot}, transparent 72%)`,
  };

  return (
    <div
      ref={ref}
      onPointerMove={reduced ? undefined : handleMove}
      onPointerEnter={reduced ? undefined : () => setActive(true)}
      onPointerLeave={reduced ? undefined : () => setActive(false)}
      className={cn(
        "relative overflow-hidden rounded-[24px]",
        isDark
          ? "bg-dark text-white ring-1 ring-white/10"
          : "border border-line bg-surface text-ink",
        className,
      )}
    >
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={overlayStyle}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
