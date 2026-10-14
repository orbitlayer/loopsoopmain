"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  /* Above-the-fold mode: render server-visible with a CSS-only fade instead of
     gating on client hydration + whileInView. Use for hero content so the LCP
     element paints immediately (and still shows if JS never loads). */
  immediate?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
  immediate = false,
  ...rest
}: RevealProps) {
  if (immediate) {
    // Plain element (no framer-motion): SSR renders it fully visible, then the
    // `.reveal-up` CSS animation fades it in with no JavaScript dependency.
    // prefers-reduced-motion (globals.css) neutralizes the animation.
    return (
      <div
        className={cn(className, "reveal-up")}
        style={delay ? { animationDelay: `${delay}s` } : undefined}
      >
        {children}
      </div>
    );
  }
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
