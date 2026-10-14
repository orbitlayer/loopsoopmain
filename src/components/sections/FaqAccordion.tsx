"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { faqs as defaultFaqs } from "@/lib/data";
import { cn } from "@/lib/cn";

type Faq = { q: string; a: string };

export function FaqAccordion({ faqs = defaultFaqs }: { faqs?: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-line border-y border-line">
      {faqs.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              id={`faq-trigger-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${i}`}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="text-base font-medium text-ink md:text-lg">
                {item.q}
              </span>
              <Plus
                className={cn(
                  "h-5 w-5 shrink-0 text-muted transition-transform duration-300",
                  isOpen && "rotate-45 text-ink",
                )}
                strokeWidth={1.75}
                aria-hidden
              />
            </button>
            {/* The answer is ALWAYS in the DOM (server-rendered) so search and
                AI crawlers can read every Q&A; it is only visually collapsed
                via a CSS grid-rows transition. */}
            <div
              id={`faq-panel-${i}`}
              role="region"
              aria-labelledby={`faq-trigger-${i}`}
              aria-hidden={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <p className="max-w-2xl pb-6 text-[0.95rem] leading-relaxed text-muted">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
