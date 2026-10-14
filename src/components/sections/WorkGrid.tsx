"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { categoryNameToSlug, workFilters, type Project } from "@/lib/data";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ProjectCard } from "@/components/sections/ProjectCard";

/* A titled group of project cards (Long-form or Short-form). */
function Subsection({
  title,
  items,
  orientation,
}: {
  title: string;
  items: Project[];
  orientation: "landscape" | "portrait";
}) {
  const portrait = orientation === "portrait";
  return (
    <div>
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="font-display text-lg font-medium text-ink md:text-xl">
          {title}
        </h2>
        <span className="text-sm text-muted">{items.length}</span>
      </div>
      <motion.div
        layout
        className={cn(
          "grid gap-6",
          portrait
            ? "grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        <AnimatePresence mode="popLayout">
          {items.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectCard project={p} orientation={orientation} showArrow />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function WorkGrid({
  initialCategory = "All Work",
  className,
  projects = [],
  loadError = false,
  heading,
  intro,
  filters = workFilters,
}: {
  initialCategory?: string;
  className?: string;
  projects?: Project[];
  loadError?: boolean;
  heading?: string;
  intro?: string;
  filters?: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<string>(initialCategory);

  // Filter-bar order is seeded from the arrival category (deep link) once at
  // mount, so it doesn't reshuffle when selecting filters within Our Work.
  const [arrivalCategory] = useState<string>(initialCategory);
  const orderedFilters =
    arrivalCategory === "All Work"
      ? filters
      : [arrivalCategory, ...filters.filter((f) => f !== arrivalCategory)];

  const inCategory =
    active === "All Work"
      ? projects
      : projects.filter((p) => p.filter === active);
  const longform = inCategory.filter((p) => p.type === "long");
  const shortform = inCategory.filter((p) => p.type === "short");
  const isEmpty = longform.length === 0 && shortform.length === 0;

  const handleFilter = (name: string) => {
    setActive(name);
    const slug = name === "All Work" ? null : categoryNameToSlug(name);
    router.replace(slug ? `${pathname}?category=${slug}` : pathname, {
      scroll: false,
    });
  };

  return (
    <section className={cn("pb-8", className)}>
      <Container>
        {/* Page heading (SEO H1 + crawlable intro) — rendered only when passed */}
        {heading && (
          <Reveal immediate className="mb-10 max-w-2xl">
            <SectionLabel className="mb-4">Portfolio</SectionLabel>
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight sm:text-5xl">
              {heading}
            </h1>
            {intro && (
              <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
                {intro}
              </p>
            )}
          </Reveal>
        )}

        {/* Category filters */}
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto border-b border-line px-6 pb-4 md:mx-0 md:px-0">
          {orderedFilters.map((f) => {
            const isActive = active === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => handleFilter(f)}
                aria-pressed={isActive}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-white"
                    : "text-muted hover:bg-subtle hover:text-ink",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="work-filter-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{f}</span>
              </button>
            );
          })}
        </div>

        {/* Long-form + Short-form subsections (each hidden when empty) */}
        {loadError ? (
          <div className="mt-16 text-center">
            <p className="text-muted">
              Unable to load portfolio projects right now.
            </p>
            <p className="mt-1 text-sm text-faint">
              Please refresh the page or try again shortly.
            </p>
          </div>
        ) : isEmpty ? (
          <p className="mt-16 text-center text-muted">
            No projects in this category yet - check back soon.
          </p>
        ) : (
          <div className="mt-12 space-y-14 md:space-y-16">
            {longform.length > 0 && (
              <Subsection
                title="Long-form Videos"
                items={longform}
                orientation="landscape"
              />
            )}
            {shortform.length > 0 && (
              <Subsection
                title="Short-form Videos"
                items={shortform}
                orientation="portrait"
              />
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
