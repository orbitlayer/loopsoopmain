"use client";

/**
 * MenuNav — fixed, light top navigation for the Loopsoop motion studio.
 *
 * Desktop (lg+): the logo, a centered TubelightNav pill (the animated
 * active-item "tube light"), and a "Let's work together" CTA. Phones/tablets (< lg):
 * the TubelightNav docks at the bottom of the screen as a compact icon bar.
 * There is no separate hamburger/overlay menu — the tubelight pill is the whole
 * navigation.
 *
 * Transparent at the top of the page; past 24px of scroll the header gains a
 * blurred off-white backdrop and a hairline. SSR-safe (links are in the server
 * HTML; window is only touched inside an effect).
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { TubelightNav } from "./TubelightNav";
import styles from "./MenuNav.module.css";

export type MenuNavItem = { label: string; href: string };

export interface MenuNavProps {
  navItems: MenuNavItem[];
  ctaHref?: string;
  /** Kept for API compatibility with the layout; no longer rendered. */
  email?: string;
  className?: string;
}

export function MenuNav({
  navItems,
  ctaHref = "/contact",
  className,
}: MenuNavProps) {
  const [scrolled, setScrolled] = useState(false);

  // Scroll state, throttled to a single rAF frame.
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 24);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[70] transition-[background-color,box-shadow,backdrop-filter] duration-500",
          scrolled
            ? "bg-[#f6f6f4]/70 shadow-[0_1px_0_0_rgba(17,17,17,0.08)] backdrop-blur-xl"
            : "bg-transparent",
          className,
        )}
      >
        <div className="relative mx-auto flex h-16 max-w-[1680px] items-center justify-between px-5 md:h-20 md:px-8">
          <Link
            href="/"
            aria-label="Loopsoop — home"
            className="inline-flex items-center"
          >
            <Image
              src="/loopmark.png"
              alt="Loopsoop"
              width={400}
              height={297}
              priority
              unoptimized
              className="h-8 w-auto md:h-9"
            />
          </Link>

          {/* Centered tubelight pill nav — desktop. */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <TubelightNav
              items={navItems}
              layoutId="tube-desktop"
              className="pointer-events-auto"
            />
          </div>

          <Link
            href={ctaHref}
            className={cn(
              styles.pill,
              "inline-flex rounded-full bg-ink px-4 py-2 text-[0.8rem] font-medium text-white md:px-5 md:py-2.5 md:text-sm",
            )}
          >
            Let&apos;s work together
          </Link>
        </div>
      </header>

      {/* Tubelight pill nav docked at the bottom — phones & tablets. */}
      <div className="fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4 lg:hidden">
        <TubelightNav items={navItems} layoutId="tube-mobile" variant="stack" />
      </div>
    </>
  );
}
