"use client";

import { MotionConfig } from "framer-motion";

/* Makes every framer-motion animation on the site respect the user's
   "prefers-reduced-motion" OS setting (framer-motion doesn't do this by default). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
