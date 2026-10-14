"use client";

/**
 * ServicesHover — a light, agency-style services list. Each service is one large
 * row that is a real link: a big tabular index (01, 02…), the service name
 * (font-display), and a short description that is always present in the DOM
 * (readable in SSR HTML / with no JS / for screen readers) but collapses until
 * hover on hover-capable desktops. Hovering a row keeps it bright while the
 * others dim, expands its description, and sweeps a hairline underneath — all in
 * CSS (:has/:hover/:focus-within), so it works without JS.
 *
 * The only JS enhancement is a floating monochrome preview panel (a #ffffff tile
 * with a hairline border, a big index, the service name, and a slowly rotating
 * ink sheen + grain) that follows the cursor — enabled only on fine-pointer, hover,
 * motion-OK desktops, updated through a single rAF, and fully torn down on
 * cleanup. Touch / reduced-motion never see cursor-follow: descriptions stay
 * open and nothing moves. Prop-driven; nothing here can overflow the page.
 */

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import styles from "./ServicesHover.module.css";

export interface ServiceItem {
  name: string;
  description: string;
  href: string;
}

export interface ServicesHoverProps {
  services: ServiceItem[];
  heading?: string;
  className?: string;
}

const EYEBROW = "Capabilities";

const pad2 = (n: number) => String(n).padStart(2, "0");

const isInternal = (href: string) => href.startsWith("/");

function RowLink({
  href,
  label,
  className,
  onEnter,
  children,
}: {
  href: string;
  label: string;
  className: string;
  onEnter: () => void;
  children: React.ReactNode;
}) {
  const shared = {
    className,
    "aria-label": label,
    onMouseEnter: onEnter,
    onFocus: onEnter,
  };
  if (isInternal(href)) {
    return (
      <Link href={href} {...shared}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...shared}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function ServicesHover({
  services,
  heading = "What we do",
  className,
}: ServicesHoverProps) {
  const headingId = useId();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Live pointer target + current eased position, shared across rAF frames.
  const pointer = useRef({ x: 0, y: 0 });
  const activeRef = useRef<number | null>(null);

  // Enable the cursor-follow panel only on hover-capable, fine-pointer,
  // motion-allowed desktops. Kept live as device / preference change.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const desktop = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const evaluate = () => setEnabled(desktop.matches && !reduce.matches);
    evaluate();
    desktop.addEventListener("change", evaluate);
    reduce.addEventListener("change", evaluate);
    return () => {
      desktop.removeEventListener("change", evaluate);
      reduce.removeEventListener("change", evaluate);
    };
  }, []);

  // Cursor-follow: one rAF, started on pointer entry, stopped when idle / on
  // cleanup / when the tab is hidden. Reads the panel size once per frame.
  useEffect(() => {
    if (!enabled) return;
    const list = listRef.current;
    const panel = panelRef.current;
    if (!list || !panel) return;

    let raf = 0;
    let running = false;
    // Start eased position where the pointer is so it doesn't fly in.
    let px = pointer.current.x;
    let py = pointer.current.y;
    let primed = false;

    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const frame = () => {
      if (!running) return;
      const { x, y } = pointer.current;
      if (!primed) {
        px = x;
        py = y;
        primed = true;
      } else {
        px += (x - px) * 0.18;
        py += (y - py) * 0.18;
      }
      // Offset beside the cursor, clamped into the viewport.
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      let left = px + 28;
      let top = py - h / 2;
      left = Math.min(left, window.innerWidth - w - 12);
      top = Math.min(Math.max(top, 12), window.innerHeight - h - 12);
      panel.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(
        1,
      )}px, 0) scale(1)`;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      if (!running && activeRef.current !== null) start();
    };
    const onEnter = () => start();
    const onLeave = () => {
      setActive(null);
      stop();
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (activeRef.current !== null) start();
    };

    list.addEventListener("pointermove", onMove, { passive: true });
    list.addEventListener("pointerenter", onEnter);
    list.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      list.removeEventListener("pointermove", onMove);
      list.removeEventListener("pointerenter", onEnter);
      list.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      // Reset so a re-enable doesn't flash a stale transform.
      panel.style.transform = "translate3d(-9999px, -9999px, 0) scale(0.9)";
    };
  }, [enabled]);

  // Mirror active into a ref so listeners read it without re-subscribing.
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const panelIndex = active ?? 0;
  const panelService = services[panelIndex];

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        styles.section,
        "relative w-full bg-[#f6f6f4] px-5 py-20 text-[#111111] sm:px-8 md:py-28 lg:px-12",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <header className="mb-10 flex flex-col gap-4 md:mb-16">
          <span className="text-[0.7rem] uppercase tracking-[0.25em] text-[#8a8a85]">
            {EYEBROW}
          </span>
          <h2
            id={headingId}
            className="font-display max-w-[16ch] text-[clamp(2.5rem,7vw,5.5rem)] font-normal leading-[0.95] tracking-[-0.03em]"
          >
            {heading}
          </h2>
        </header>

        <ul ref={listRef} className={styles.list}>
          {services.map((service, i) => {
            const n = pad2(i + 1);
            return (
              <li key={service.href + service.name} className={styles.row}>
                <RowLink
                  href={service.href}
                  label={`${service.name} — ${service.description}`}
                  className={cn(styles.link, "group")}
                  onEnter={() => setActive(i)}
                >
                  <span
                    aria-hidden
                    className={cn(
                      styles.index,
                      "font-display text-[clamp(0.8rem,1.4vw,1rem)]",
                    )}
                  >
                    {n}
                  </span>
                  <span
                    className={cn(
                      styles.name,
                      "font-display text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[1.02] tracking-[-0.025em]",
                    )}
                  >
                    {service.name}
                  </span>
                  <span
                    aria-hidden
                    className={cn(styles.arrow, "text-[clamp(1.1rem,2vw,1.6rem)]")}
                  >
                    &#8599;
                  </span>
                  <span className={cn(styles.desc, "text-[0.95rem] leading-relaxed")}>
                    {service.description}
                  </span>
                </RowLink>
                <span aria-hidden className={styles.sweep} />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Floating cursor preview — decorative, desktop + motion only. */}
      {enabled && panelService ? (
        <div
          ref={panelRef}
          aria-hidden
          className={styles.panel}
          data-open={active !== null}
        >
          <span className={styles.panelGrad} />
          <span className={styles.panelGrain} />
          <div className={styles.panelInner}>
            <span className={cn(styles.panelTag, "font-display")}>
              {EYEBROW}
            </span>
            <div className="flex flex-col gap-2">
              <span className={cn(styles.panelNum, "font-display")}>
                {pad2(panelIndex + 1)}
              </span>
              <span className={cn(styles.panelName, "font-display")}>
                {panelService.name}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
