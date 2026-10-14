"use client";

/*
 * MarqueeReviews — testimonials rendered as two continuous marquee rows of
 * review cards travelling in opposite directions (top row left, bottom row
 * right) for a lively, award-site feel. Each card is a white panel with a
 * hairline border, a quote, and a name / role / brand footer.
 *
 * Motion is CSS (see the module), so no per-frame JS; a single effect only
 * flips animation-play-state to pause both rows while hovered, while the band
 * is off-screen (IntersectionObserver), or while the tab is hidden
 * (visibilitychange). Reduced motion / no-JS fall back to native horizontal
 * swipe strips (handled purely in CSS). Content renders fully in server HTML
 * (SEO / no-JS); the duplicated loop group is aria-hidden so assistive tech and
 * crawlers see each testimonial once. The band is overflow-hidden, so the
 * max-content track never causes horizontal page overflow.
 */

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "./MarqueeReviews.module.css";

export interface Review {
  quote: string;
  name: string;
  role: string;
  brand: string;
}

export interface MarqueeReviewsProps {
  reviews: Review[];
  className?: string;
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure
      className="flex w-[300px] shrink-0 flex-col justify-between rounded-[18px] bg-[#ffffff] p-6 border border-line shadow-[0_20px_50px_-30px_rgba(17,17,17,0.18)] sm:w-[360px]"
    >
      <span
        aria-hidden="true"
        className="font-display text-4xl leading-none text-ink/15"
      >
        &ldquo;
      </span>
      <blockquote className="mt-2 text-[0.95rem] leading-relaxed text-ink/80">
        {review.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/5 font-display text-sm text-ink/70 ring-1 ring-black/5"
        >
          {review.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">
            {review.name}
          </span>
          <span className="block truncate text-[0.7rem] uppercase tracking-[0.18em] text-muted">
            {review.role} · {review.brand}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

export function MarqueeReviews({ reviews, className }: MarqueeReviewsProps) {
  const bandRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const band = bandRef.current;
    if (!band) return;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return; // CSS renders the static swipe fallback.

    let hovered = false;
    let onscreen = true;
    let visible = typeof document === "undefined" ? true : !document.hidden;

    const apply = () => {
      const state = hovered || !onscreen || !visible ? "paused" : "running";
      for (const track of trackRefs.current) {
        if (track) track.style.animationPlayState = state;
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onscreen = entry.isIntersecting;
        apply();
      },
      { threshold: 0 },
    );
    io.observe(band);

    const onVisibility = () => {
      visible = !document.hidden;
      apply();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onEnter = () => {
      hovered = true;
      apply();
    };
    const onLeave = () => {
      hovered = false;
      apply();
    };
    band.addEventListener("pointerenter", onEnter);
    band.addEventListener("pointerleave", onLeave);

    apply();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      band.removeEventListener("pointerenter", onEnter);
      band.removeEventListener("pointerleave", onLeave);
    };
  }, [reviews.length]);

  if (!reviews || reviews.length === 0) return null;

  // Two visually distinct rows: the second is rotated so the loops don't line up.
  const rowA = reviews;
  const rowB =
    reviews.length > 1
      ? [...reviews.slice(Math.floor(reviews.length / 2)), ...reviews.slice(0, Math.floor(reviews.length / 2))]
      : reviews;

  const renderRow = (row: Review[], index: number, reverse: boolean) => {
    // Constant-ish speed: longer rows take proportionally longer.
    const duration = Math.max(28, row.length * 7);
    const group = (hidden: boolean) => (
      <div className={styles.group} aria-hidden={hidden ? "true" : undefined}>
        {row.map((review, i) => (
          <ReviewCard key={i} review={review} />
        ))}
      </div>
    );
    return (
      <div className={styles.row}>
        <div
          ref={(el) => {
            trackRefs.current[index] = el;
          }}
          className={cn(styles.track, reverse && styles.reverse)}
          style={{ "--msr-duration": `${duration}s` } as CSSProperties}
        >
          {group(false)}
          {group(true)}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={bandRef}
      className={cn(styles.band, className)}
      role="region"
      aria-label="Client testimonials"
    >
      {renderRow(rowA, 0, false)}
      {renderRow(rowB, 1, true)}
    </div>
  );
}
