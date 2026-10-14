"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import type { EditingCategory } from "@/lib/data";

/*
 * Our Work category card with a cursor-following spotlight (ReactBits Spotlight
 * Card, MIT — adapted). A soft white radial glow tracks the pointer and fades
 * in on hover over the dark image card; content stays crisp above it. The
 * effect is hover-only, so it needs no reduced-motion special-casing.
 */
export function CategoryCard({
  category,
  index,
}: {
  category: EditingCategory;
  index: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  function handleMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <Link
      ref={ref}
      href={`/portfolio?category=${category.slug}`}
      aria-label={`View ${category.name} projects`}
      onMouseMove={handleMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[20px] border border-line/50 bg-dark transition-colors duration-300 hover:border-white/25"
    >
      <MediaPlaceholder
        seed={category.seed}
        src={category.image}
        alt={category.name}
        className="absolute inset-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {/* Spotlight — follows the cursor, fades in on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-500"
        style={{
          opacity,
          background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.18), transparent 70%)`,
        }}
      />

      <span className="absolute left-6 top-6 z-20 font-display text-sm text-white/60">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="absolute inset-x-0 bottom-0 z-20 p-6">
        <h3 className="font-display text-2xl font-medium text-white">
          {category.name}
        </h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/70">
          {category.description}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white">
          View Projects
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
