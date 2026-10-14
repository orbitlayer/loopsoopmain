"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { testimonials } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

export function Testimonials() {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28">
      <Container>
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-md">
            <SectionLabel className="mb-4">Client Love</SectionLabel>
            <h2 className="font-display text-3xl font-medium leading-[1.05] md:text-[2.6rem]">
              What Our Clients <span className="text-faint">Have To Say.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex items-center justify-between gap-6 md:justify-end">
            <p className="max-w-xs text-sm text-muted">
              We don&apos;t just edit videos, we build relationships and deliver
              results our clients love.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                aria-label="Previous testimonials"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-ink hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                aria-label="Next testimonials"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-black"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        </div>

        <div
          ref={scroller}
          className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2"
        >
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="group w-[85%] shrink-0 snap-start overflow-hidden rounded-[20px] border border-line bg-surface sm:w-[46%] lg:w-[calc((100%-3rem)/3)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <MediaPlaceholder seed={t.seed} vignette className="transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="absolute bottom-4 left-5">
                  <div className="font-display text-lg font-semibold text-white">
                    {t.brand}
                  </div>
                  <div className="text-sm text-white/60">{t.project}</div>
                </div>
              </div>
              <div className="p-6">
                <Quote className="h-6 w-6 text-ink/20" fill="currentColor" strokeWidth={0} />
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink/80">
                  {t.quote}
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                  <span className="media h-10 w-10 shrink-0 rounded-full" aria-hidden />
                  <div>
                    <div className="text-sm font-semibold text-ink">{t.name}</div>
                    <div className="text-xs text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
