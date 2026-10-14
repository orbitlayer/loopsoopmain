"use client";

/*
 * GlowCard — a monochrome recreation of the border-glow from reactbits.dev's
 * "Magic Bento" cards. A rounded card whose BORDER lights up and follows the
 * cursor: an inset overlay paints a radial-gradient at the tracked --x/--y and
 * is masked (border-box minus content-box, via mask-composite) down to a thin
 * ring, so only the edge glows. Tracking uses CSS custom properties set via a
 * ref (no per-frame React state).
 *
 * Because globals.css overrides border-color globally, the glow is drawn with a
 * masked gradient (not border-color): a hairline resting border/ring plus the
 * moving highlight on top. Light variant glows ink; dark variant glows white on
 * a near-black surface with a subtle ring. Children render fully on the server
 * (SSR-safe); the glow layer is decorative (aria-hidden). Under
 * prefers-reduced-motion there is no tracking — just the static subtle border.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "light" | "dark";
};

export function GlowCard({
  children,
  className,
  variant = "light",
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  // false on the server + under reduced motion → static border, no tracking.
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
  const glow = isDark ? "rgba(255,255,255,0.6)" : "rgba(17,17,17,0.45)";

  // Masked ring: the gradient fills the whole box, then the content-box is
  // excluded from the border-box mask, leaving only the ~1.5px padding edge.
  const glowStyle: CSSProperties = {
    opacity: active ? 1 : 0,
    padding: "1.5px",
    background: `radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), ${glow}, transparent 62%)`,
    WebkitMask:
      "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
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
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={glowStyle}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
