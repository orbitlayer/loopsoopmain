"use client";

/*
 * RotatingText — an original recreation of reactbits.dev's "Rotating Text".
 * Shows one word of `words` at a time and cycles through them on an interval.
 * Each change animates the outgoing word up + blur-out and the incoming word
 * up + blur-in (framer-motion AnimatePresence with popLayout). The clip box is
 * inline-block with overflow hidden and animates its width to the current word
 * (layout animation), so the surrounding text doesn't jump awkwardly.
 *
 * SSR renders words[0] (real, readable text) so there's no hydration mismatch.
 * The current word is mirrored into a visually-hidden aria-live region for
 * screen readers while the animated copy is aria-hidden. prefers-reduced-motion
 * keeps cycling the text but swaps instantly with no transform or blur. The
 * interval and matchMedia listener are cleaned up on unmount.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type RotatingTextTag =
  | "span"
  | "div"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "strong"
  | "em";

export type RotatingTextProps = {
  words: string[];
  className?: string;
  /** Milliseconds each word is shown before rotating. Default 2200. */
  interval?: number;
  /** Semantic wrapper element. Default "span". */
  as?: RotatingTextTag;
};

const EASE = [0.16, 1, 0.3, 1] as const;

export function RotatingText({
  words,
  className,
  interval = 2200,
  as = "span",
}: RotatingTextProps) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  const count = words.length;
  const current = count ? words[index % count] : "";

  // Advance through the words. Runs under reduced motion too (instant swap).
  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, Math.max(interval, 200));
    return () => window.clearInterval(id);
  }, [count, interval]);

  // Track the reduced-motion preference.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const Tag = as as React.ElementType;

  return (
    <Tag className={cn("inline-flex", className)}>
      <span className="sr-only" aria-live="polite">
        {current}
      </span>

      {reduced ? (
        <span aria-hidden="true" style={{ display: "inline-block" }}>
          {current}
        </span>
      ) : (
        <motion.span
          layout
          aria-hidden="true"
          style={{
            display: "inline-block",
            overflow: "hidden",
            position: "relative",
            verticalAlign: "bottom",
            whiteSpace: "nowrap",
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={`${index}-${current}`}
              className="inline-block"
              initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
              animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
              exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              {current}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      )}
    </Tag>
  );
}
