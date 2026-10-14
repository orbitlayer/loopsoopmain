"use client";

import { useState } from "react";
import { setCategoryVisibilityAction } from "@/lib/settings-actions";
import { Switch } from "./ui";

/*
 * Categories — show or hide each editing category on the public website.
 * Toggling is immediate and reversible (low-risk), optimistic with revert on
 * error, and every change is audit-logged server-side. Hiding a category removes
 * it from the Our Work cards, the home "What We Do" list, the portfolio filter
 * chips and the footer services — everywhere it is listed publicly.
 */

type Category = {
  slug: string;
  name: string;
  description: string;
  image: string;
  visible: boolean;
};

export function CategoriesClient({ initial }: { initial: Category[] }) {
  const [cats, setCats] = useState<Category[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const visibleCount = cats.filter((c) => c.visible).length;

  async function toggle(slug: string, next: boolean) {
    setError(null);
    setNotice(null);
    setPending(slug);
    // Optimistic update.
    setCats((cur) => cur.map((c) => (c.slug === slug ? { ...c, visible: next } : c)));
    const res = await setCategoryVisibilityAction(slug, next);
    setPending(null);
    if ("error" in res) {
      // Revert.
      setCats((cur) => cur.map((c) => (c.slug === slug ? { ...c, visible: !next } : c)));
      setError(res.error);
      return;
    }
    const cat = cats.find((c) => c.slug === slug);
    setNotice(
      `${cat?.name ?? "Category"} is now ${next ? "visible on" : "hidden from"} the website.`,
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
        Categories
      </h1>
      <p className="mt-1 text-sm text-faint">
        Show or hide each editing category on the public website. Hidden
        categories disappear from Our Work, the home page, the portfolio filters
        and the footer.
      </p>

      {notice && (
        <p className="mt-6 rounded-xl border border-line bg-subtle px-4 py-2.5 text-sm text-ink">
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {visibleCount === 0 && (
        <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-sm text-amber-700">
          All categories are hidden — the Our Work grid and category lists will be
          empty on the public site.
        </p>
      )}

      <p className="mt-6 text-xs font-medium uppercase tracking-[0.12em] text-faint">
        {visibleCount} of {cats.length} visible
      </p>

      <div className="mt-3 space-y-3">
        {cats.map((c) => (
          <div
            key={c.slug}
            className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt=""
                aria-hidden
                className={`h-14 w-11 shrink-0 rounded-lg object-cover transition-opacity ${
                  c.visible ? "" : "opacity-40 grayscale"
                }`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-sm font-semibold text-ink">
                    {c.name}
                  </h2>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em] ${
                      c.visible
                        ? "bg-subtle text-muted ring-1 ring-line"
                        : "bg-red-500/10 text-red-600 ring-1 ring-red-500/30"
                    }`}
                  >
                    {c.visible ? "Visible" : "Hidden"}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 max-w-md text-xs leading-relaxed text-faint">
                  {c.description}
                </p>
              </div>
            </div>
            <Switch
              checked={c.visible}
              onChange={(next) => toggle(c.slug, next)}
              disabled={pending === c.slug}
              srLabel={`Toggle ${c.name} visibility`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
