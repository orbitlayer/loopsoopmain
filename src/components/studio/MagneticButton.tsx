"use client";

/*
 * MagneticButton — the studio's primary CTA: a rounded-full pill (solid =
 * white on ink, ghost = transparent with a hairline ring) whose arrow nudges
 * on hover and which pulls slightly toward the cursor when the pointer comes
 * within a small radius, easing back to rest on leave. Renders a next/link for
 * internal hrefs, a plain <a> for external ones, or a <button> when there is no
 * href.
 *
 * Motion: a single rAF lerps the pill (and, with a little parallax, its inner
 * content) toward a target derived from a window pointermove listener; the
 * listener is attached only while the button is on-screen (IntersectionObserver)
 * and detached when off-screen or the tab is hidden, and every listener / rAF
 * is removed on cleanup. The magnetic pull is disabled entirely under reduced
 * motion or a coarse (touch) pointer, and the arrow nudge is gated on
 * motion-safe. SSR-safe: no transform until the effect runs, and the label /
 * arrow render statically.
 */

import Link from "next/link";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
  ariaLabel?: string;
}

const MAX_SHIFT = 14; // px, clamp so the pill never flies off
const PULL = 0.32; // fraction of cursor offset the pill follows
const RADIUS = 48; // px of empty space around the pill that still engages it

export function MagneticButton({
  children,
  href,
  onClick,
  variant = "solid",
  className,
  ariaLabel,
}: MagneticButtonProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const setRoot = (el: HTMLElement | null) => {
    rootRef.current = el;
  };

  useEffect(() => {
    const root = rootRef.current;
    const inner = innerRef.current;
    if (!root || !inner) return;

    const mm = typeof window.matchMedia === "function" ? window.matchMedia : null;
    const reduced = mm?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const coarse = mm?.("(pointer: coarse)").matches ?? false;
    if (reduced || coarse) return;

    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;
    let raf = 0;
    let onscreen = true;
    let visible = typeof document === "undefined" ? true : !document.hidden;

    const clamp = (v: number) => Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, v));

    const tick = () => {
      curX += (targetX - curX) * 0.18;
      curY += (targetY - curY) * 0.18;
      root.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px)`;
      inner.style.transform = `translate(${(curX * 0.4).toFixed(2)}px, ${(curY * 0.4).toFixed(2)}px)`;
      const settled =
        Math.abs(targetX - curX) < 0.1 &&
        Math.abs(targetY - curY) < 0.1 &&
        targetX === 0 &&
        targetY === 0;
      if (settled) {
        root.style.transform = "translate(0px, 0px)";
        inner.style.transform = "translate(0px, 0px)";
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const ensureRaf = () => {
      if (!raf && onscreen && visible) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const withinX = Math.abs(dx) < rect.width / 2 + RADIUS;
      const withinY = Math.abs(dy) < rect.height / 2 + RADIUS;
      if (withinX && withinY) {
        targetX = clamp(dx * PULL);
        targetY = clamp(dy * PULL);
      } else {
        targetX = 0;
        targetY = 0;
      }
      ensureRaf();
    };

    const attach = () => window.addEventListener("pointermove", onMove);
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      targetX = 0;
      targetY = 0;
      ensureRaf();
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onscreen = entry.isIntersecting;
        if (onscreen && visible) attach();
        else detach();
      },
      { threshold: 0 },
    );
    io.observe(root);

    const onVisibility = () => {
      visible = !document.hidden;
      if (onscreen && visible) attach();
      else detach();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (onscreen && visible) attach();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const base =
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium outline-none transition-colors duration-300 will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";
  const variantClass =
    variant === "ghost"
      ? "bg-transparent text-ink ring-1 ring-black/15 hover:bg-ink/5 hover:ring-black/30"
      : "bg-ink text-white hover:bg-ink/90";

  const classes = cn(base, variantClass, className);

  const content = (
    <span
      ref={innerRef}
      className="pointer-events-none inline-flex items-center gap-2 will-change-transform"
    >
      <span>{children}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        width="15"
        height="15"
        fill="none"
        className="transition-transform duration-300 ease-out motion-safe:group-hover:translate-x-1"
      >
        <path
          d="M2 8h11M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  const isInternal = !!href && /^\/(?!\/)/.test(href);
  const isExternal = !!href && !isInternal;
  const commonStyle: CSSProperties = { transform: "translate(0px, 0px)" };

  if (isInternal) {
    return (
      <Link
        href={href as string}
        ref={setRoot}
        className={classes}
        style={commonStyle}
        aria-label={ariaLabel}
        onClick={onClick}
      >
        {content}
      </Link>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        ref={setRoot}
        className={classes}
        style={commonStyle}
        aria-label={ariaLabel}
        onClick={onClick}
        rel="noreferrer"
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      ref={setRoot}
      className={classes}
      style={commonStyle}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {content}
    </button>
  );
}
