"use client";

/*
 * DecryptedText — a recreation of reactbits.dev's "Decrypt Text".
 * The final text is rendered server-side (real, readable, SEO-friendly). On
 * trigger the non-space characters scramble through random glyphs and then
 * resolve left-to-right into the real text, classic decrypt style. Spaces are
 * never scrambled, so word shape is preserved.
 *
 * The visible, animated copy is aria-hidden; the real string is exposed to
 * assistive tech via aria-label on the wrapper. prefers-reduced-motion skips
 * the scramble entirely and shows the final text. Math.random is only ever
 * called inside effects/handlers (never at module scope or during render) to
 * avoid hydration mismatches.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export type DecryptedTextProps = {
  text: string;
  className?: string;
  /** Milliseconds per scramble tick. Default 45. */
  speed?: number;
  /** When to run: once on scroll into view, or on each pointer enter. */
  trigger?: "view" | "hover";
  /** Pool of glyphs used while scrambling. */
  chars?: string;
};

const DEFAULT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*()_+-=[]{}|;:,.<>?/";

/** Ticks spent scrambling before each successive character locks in. */
const TICKS_PER_CHAR = 2;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function DecryptedText({
  text,
  className,
  speed = 45,
  trigger = "view",
  chars = DEFAULT_CHARS,
}: DecryptedTextProps) {
  // Server + first client render both show the final text -> no mismatch.
  const [display, setDisplay] = useState(text);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    runningRef.current = false;
  }, []);

  const run = useCallback(() => {
    if (runningRef.current) return;
    if (prefersReducedMotion()) {
      setDisplay(text);
      return;
    }
    runningRef.current = true;
    const total = text.length;
    let tick = 0;

    intervalRef.current = window.setInterval(() => {
      tick += 1;
      const revealed = Math.floor(tick / TICKS_PER_CHAR);
      let out = "";
      for (let i = 0; i < total; i += 1) {
        const ch = text[i];
        if (ch === " ") {
          out += " ";
        } else if (i < revealed) {
          out += ch;
        } else {
          out += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      }
      setDisplay(out);
      if (revealed >= total) {
        setDisplay(text);
        stop();
      }
    }, speed);
  }, [text, speed, chars, stop]);

  // trigger === "view": run once when scrolled into view. Under reduced motion
  // we simply never observe — the final text is already what's rendered.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (trigger !== "view") return;
    if (prefersReducedMotion()) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [trigger, run]);

  // Keep the resting text in sync if the prop changes while idle.
  useEffect(() => {
    if (!runningRef.current) setDisplay(text);
  }, [text]);

  // Clear any pending interval on unmount.
  useEffect(() => stop, [stop]);

  const onHover = trigger === "hover" ? run : undefined;

  return (
    <span
      ref={wrapRef}
      className={cn(className)}
      aria-label={text}
      onPointerEnter={onHover}
    >
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
