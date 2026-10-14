"use client";

/*
 * Cursor — a custom pointer for fine-pointer (mouse/trackpad) devices. A small
 * solid dot tracks the pointer exactly while a larger ring trails it with an
 * eased lerp in a single rAF loop; the ring grows smoothly over interactive
 * targets (a, button, [data-cursor], form controls). Both use mix-blend-mode
 * difference so they read white-on-anything. Fixed, z-[90], pointer-events-none.
 *
 * It only mounts when matchMedia("(pointer: fine)") matches AND reduced motion
 * is off — otherwise it renders nothing (touch/coarse devices keep the native
 * cursor). While active the native cursor is hidden via an injected stylesheet
 * + a body class (covering links that set their own cursor), both removed on
 * cleanup. The rAF pauses when the tab is hidden and is cancelled on unmount,
 * along with every listener and the injected style. SSR renders null.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type CursorProps = {
  className?: string;
};

const INTERACTIVE =
  "a, button, [data-cursor], input, textarea, select, label, summary, [role='button']";

export function Cursor({ className }: CursorProps) {
  const [active, setActive] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Decide eligibility, and keep it live if the device/preference changes
  // (e.g. a mouse is plugged into a tablet, or reduced motion is toggled).
  useEffect(() => {
    if (!window.matchMedia) return;
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => setActive(fine.matches && !reduce.matches);
    evaluate();
    fine.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      fine.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // Hide the native cursor everywhere (links/buttons set their own cursor, so
    // a scoped "* { cursor: none }" rule is needed, not just body.style).
    const style = document.createElement("style");
    style.setAttribute("data-loopsoop-cursor", "");
    style.textContent =
      ".loopsoop-cursor-none, .loopsoop-cursor-none * { cursor: none !important; }";
    document.head.appendChild(style);
    document.body.classList.add("loopsoop-cursor-none");

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let scale = 1;
    let hovering = false;
    let shown = false;
    let raf = 0;
    let docVisible = !document.hidden;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      if (!shown) {
        shown = true;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target;
      hovering = t instanceof Element && t.closest(INTERACTIVE) !== null;
    };
    const hide = () => {
      shown = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const frame = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      scale += ((hovering ? 1.9 : 1) - scale) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && docVisible) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const onVis = () => {
      docVisible = !document.hidden;
      if (docVisible) start();
      else stop();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", onVis);
    start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVis);
      document.body.classList.remove("loopsoop-cursor-none");
      style.remove();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-[90]", className)}
      aria-hidden="true"
    >
      <div
        ref={ringRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "40px",
          height: "40px",
          borderRadius: "9999px",
          border: "1.5px solid #ffffff",
          opacity: 0,
          mixBlendMode: "difference",
          transition: "opacity 0.25s ease",
          willChange: "transform",
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "7px",
          height: "7px",
          borderRadius: "9999px",
          background: "#ffffff",
          opacity: 0,
          mixBlendMode: "difference",
          transition: "opacity 0.25s ease",
          willChange: "transform",
        }}
      />
    </div>
  );
}
