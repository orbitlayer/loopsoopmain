"use client";

/*
 * Magnet — a recreation of reactbits.dev's "Magnet".
 * While the pointer is over the element, the inner wrapper is translated toward
 * the pointer, scaled by how far the pointer sits from the element's centre and
 * capped at `strength` px. On pointer leave it eases back to rest. A short
 * transition handles the follow; a slightly longer one handles the return.
 *
 * The transform is written straight to the DOM node in the pointer handlers (no
 * per-frame React state), so it stays cheap. All window/DOM access lives inside
 * the handlers and an effect, so it is SSR-safe. prefers-reduced-motion disables
 * the pull entirely and the element never moves.
 */

import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/cn";

export type MagnetProps = {
  children: React.ReactNode;
  /** Maximum pull distance in px. Default 14. */
  strength?: number;
  /** Activation radius in px from the element centre. Default 120. */
  radius?: number;
  className?: string;
};

const FOLLOW = "transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)";
const RETURN = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";

export function Magnet({
  children,
  strength = 14,
  radius = 120,
  className,
}: MagnetProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onChange = () => {
      reducedRef.current = mq.matches;
      if (mq.matches && innerRef.current) {
        innerRef.current.style.transition = RETURN;
        innerRef.current.style.transform = "translate3d(0, 0, 0)";
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedRef.current) return;
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      inner.style.transform = "translate3d(0, 0, 0)";
      return;
    }

    // Pull grows with distance from centre up to the activation radius, capped
    // at `strength`, and always aimed at the pointer.
    const magnitude = (Math.min(dist, radius) / radius) * strength;
    const tx = (dx / dist) * magnitude;
    const ty = (dy / dist) * magnitude;

    inner.style.transition = FOLLOW;
    inner.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  };

  const handleLeave = () => {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.transition = RETURN;
    inner.style.transform = "translate3d(0, 0, 0)";
  };

  return (
    <div
      ref={wrapRef}
      className={cn("inline-block", className)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div ref={innerRef} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
