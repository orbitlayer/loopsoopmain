"use client";

/**
 * TubelightNav — a pill navigation where the active item sits under a glowing
 * "tube light": a small solid bar on top of a soft-lit pill, with the lit pill
 * sliding between items via a shared framer-motion layout animation (the
 * tubelight / lamp effect). Recreated from scratch in the Loopsoop monochrome
 * language (ink glow on off-white), inspired by the 21st.dev "tubelight-navbar".
 *
 * Two layouts via `variant`:
 *   - "inline" (desktop header): a horizontal pill of text labels.
 *   - "stack"  (mobile bottom bar): an icon with its label stacked beneath it.
 *
 * The active item is derived from the current pathname (exact match for "/",
 * prefix match otherwise), so it stays in sync as you navigate. SSR-safe (Links
 * render in the server HTML) and reduced-motion aware (the shared layout spring
 * is softened by the app's MotionConfig reducedMotion="user"). Each mounted
 * instance should pass a distinct `layoutId` so their lamps don't collide.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  Clapperboard,
  LayoutGrid,
  Users,
  Mail,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { MenuNavItem } from "./MenuNav";

/** Icon per route — kept here (client) so only label/href strings cross the
 *  server→client boundary from the layout. */
const ICONS: Record<string, LucideIcon> = {
  "/": Home,
  "/our-work": Clapperboard,
  "/portfolio": LayoutGrid,
  "/about": Users,
  "/contact": Mail,
};

export interface TubelightNavProps {
  items: MenuNavItem[];
  className?: string;
  /** Shared-layout id for the sliding lamp. Give each mounted instance a
   *  distinct id so their layout animations don't fight over the same element. */
  layoutId?: string;
  /** "inline" = text pill (desktop); "stack" = icon + label beneath (mobile). */
  variant?: "inline" | "stack";
}

export function TubelightNav({
  items,
  className,
  layoutId = "tubelight-lamp",
  variant = "inline",
}: TubelightNavProps) {
  const pathname = usePathname() || "/";
  const stack = variant === "stack";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex items-stretch border border-line bg-[#f6f6f4]/70 p-1.5 shadow-[0_1px_2px_rgba(17,17,17,0.04),0_10px_30px_-18px_rgba(17,17,17,0.35)] backdrop-blur-xl",
        stack ? "gap-0.5 rounded-[28px]" : "gap-1 rounded-full",
        className,
      )}
    >
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = ICONS[item.href] ?? Circle;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative transition-colors duration-300",
              active ? "text-ink" : "text-[#8a8a85] hover:text-ink",
              stack
                ? "flex flex-col items-center justify-center gap-1 rounded-[22px] px-2.5 py-1.5"
                : "rounded-full px-4 py-2 text-sm font-medium md:px-5",
            )}
          >
            {stack ? (
              <>
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                <span className="text-[0.6rem] font-medium leading-none tracking-[-0.01em] whitespace-nowrap">
                  {item.label}
                </span>
              </>
            ) : (
              item.label
            )}

            {active && (
              <motion.span
                layoutId={layoutId}
                aria-hidden
                className={cn(
                  "absolute inset-0 -z-10 bg-ink/[0.06]",
                  stack ? "rounded-[22px]" : "rounded-full",
                )}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              >
                {/* The tube: a solid bar on top of the lit pill, plus stacked
                    blurred blobs that read as its glow spilling downward. */}
                <span className="absolute -top-[7px] left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-ink">
                  <span className="absolute -top-1 left-1/2 h-5 w-12 -translate-x-1/2 rounded-full bg-ink/25 blur-md" />
                  <span className="absolute -top-0.5 left-1/2 h-4 w-8 -translate-x-1/2 rounded-full bg-ink/20 blur-md" />
                  <span className="absolute top-0 left-1/2 h-3 w-4 -translate-x-1/2 rounded-full bg-ink/25 blur-sm" />
                </span>
              </motion.span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
