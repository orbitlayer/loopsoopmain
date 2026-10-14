"use client";

/*
 * TiltedCard — a monochrome recreation of reactbits.dev's "Tilted Card".
 * On pointermove the card rotates toward the cursor (rotateX / rotateY under a
 * ~900px perspective) and lifts with an optional scale; on leave it eases back
 * to flat. An optional soft white glare highlight tracks the cursor across the
 * surface. Tracking is driven by CSS custom properties set on the element via a
 * ref (no per-frame React state), so it stays cheap.
 *
 * The children render fully on the server (SSR-safe) at the flat resting state
 * — the transform reads from --rx/--ry/--s which default to 0deg/0deg/1. The
 * glare is decorative (aria-hidden). Under prefers-reduced-motion there is no
 * tilt, no glare and no pointer tracking; the card renders flat and static.
 * will-change:transform is only set while hovered to avoid wasting layers.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";

export type TiltedCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Maximum tilt in degrees on each axis. Default 8. */
  max?: number;
  /** Render a moving glare highlight. Default true. */
  glare?: boolean;
  /** Scale applied while hovered. Default 1.0 (no scale). */
  scale?: number;
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

export function TiltedCard({
  children,
  className,
  max = 8,
  glare = true,
  scale = 1.0,
}: TiltedCardProps) {
  const innerRef = useRef<HTMLDivElement>(null);
  // false on the server + under reduced motion → flat, no tracking, no glare.
  const [reduced, setReduced] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const setVar = (name: string, value: string) => {
    innerRef.current?.style.setProperty(name, value);
  };

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = innerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width; // 0..1
    const py = (event.clientY - rect.top) / rect.height; // 0..1
    setVar("--rx", `${(0.5 - py) * 2 * max}deg`);
    setVar("--ry", `${(px - 0.5) * 2 * max}deg`);
    setVar("--gx", `${px * 100}%`);
    setVar("--gy", `${py * 100}%`);
  };

  const handleEnter = () => {
    setHovering(true);
    setVar("--s", `${scale}`);
  };

  const handleLeave = () => {
    setHovering(false);
    setVar("--rx", "0deg");
    setVar("--ry", "0deg");
    setVar("--s", "1");
  };

  // Perspective lives in the transform itself (first function) so the card is a
  // single layout-neutral root — no wrapper that could disturb grid/flex flow.
  const innerStyle: CSSProperties = {
    transform:
      "perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) scale(var(--s, 1))",
    transformStyle: "preserve-3d",
    transition: hovering
      ? "transform 120ms ease-out"
      : `transform 500ms ${EASE}`,
    willChange: hovering ? "transform" : "auto",
  };

  const glareStyle: CSSProperties = {
    opacity: hovering ? 1 : 0,
    background:
      "radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,0.28), transparent 60%)",
  };

  return (
    <div
      ref={innerRef}
      onPointerMove={reduced ? undefined : handleMove}
      onPointerEnter={reduced ? undefined : handleEnter}
      onPointerLeave={reduced ? undefined : handleLeave}
      className={cn("relative rounded-[24px]", className)}
      style={reduced ? undefined : innerStyle}
    >
      {children}
      {glare && !reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
          style={glareStyle}
        />
      )}
    </div>
  );
}
