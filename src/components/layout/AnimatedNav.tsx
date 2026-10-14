"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { nav } from "@/lib/data";
import { cn } from "@/lib/cn";
import { LoopMark } from "@/components/ui/Logo";
import { Magnet } from "@/components/reactbits/Magnet";

/*
 * Animated floating nav (adapted from the "AnimatedNavFramer" pattern on
 * 21st.dev). Sits centered near the top as a full pill; as you scroll it
 * collapses (spring) into a compact button, and clicking it expands back.
 * Refined to the LOOPSOOP light theme; reuses the site's nav items, logo and
 * CTA, keeps active states, and has a mobile menu. Reduced-motion is honored
 * via the app's MotionProvider.
 */

const SPRING = { type: "spring" as const, stiffness: 420, damping: 36 };
const EASE = [0.16, 1, 0.3, 1] as const;

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AnimatedNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [manualOpen, setManualOpen] = useState(false); // desktop: expand while scrolled
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu panel
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Reset on navigation.
  useEffect(() => {
    setManualOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Collapse / close when clicking outside or pressing Escape.
  useEffect(() => {
    if (!manualOpen && !menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setManualOpen(false);
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setManualOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [manualOpen, menuOpen]);

  // Desktop shows the full inline nav at the top of the page, or when the user
  // clicks the collapsed pill.
  const expanded = !scrolled || manualOpen;

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 top-4 z-50 flex justify-center px-4"
    >
      <motion.div
        layout
        transition={SPRING}
        className="relative flex items-center gap-1.5 overflow-hidden rounded-full border border-line bg-bg/80 p-1.5 shadow-lg shadow-black/[0.06] backdrop-blur-xl"
      >
        {/* Brand */}
        <Link
          href="/"
          aria-label="Loopsoop - home"
          className="flex items-center gap-2 rounded-full py-1 pl-2 pr-1"
        >
          <LoopMark className="h-[22px] w-auto" />
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.span
                key="wordmark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap font-logo text-lg font-bold tracking-[-0.02em] text-ink"
              >
                Loopsoop
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Desktop inline links */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.nav
              key="links"
              aria-label="Primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden items-center gap-0.5 pl-1 lg:flex"
            >
              {nav.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-subtle font-medium text-ink"
                        : "text-muted hover:bg-subtle hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Desktop CTA */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block"
            >
              <Magnet className="inline-block" strength={8} radius={90}>
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black"
                >
                  Let&apos;s Work Together
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </Link>
              </Magnet>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop collapsed trigger */}
        {!expanded && (
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            aria-label="Open menu"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle lg:flex"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors hover:bg-subtle lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </motion.div>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="absolute inset-x-4 top-full mt-2 lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: EASE }}
          >
            <div className="rounded-2xl border border-line bg-bg/95 p-3 shadow-xl shadow-black/10 backdrop-blur-xl">
              {nav.map((item) => {
                const active = isActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block rounded-xl px-3 py-3 text-base font-medium transition-colors",
                      active
                        ? "bg-subtle text-ink"
                        : "text-muted hover:bg-subtle hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/contact"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-black"
              >
                Let&apos;s Work Together
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
