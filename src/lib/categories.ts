import "server-only";
import { editingCategories, type EditingCategory } from "./data";
import { getHiddenCategorySlugs } from "./settings";

/*
 * Public-facing editing categories, with any admin-hidden ones removed.
 * Single source of truth for every public surface that lists categories
 * (Our Work cards, home "What We Do", portfolio filters, footer services).
 *
 * Fail-safe: getHiddenCategorySlugs never throws and defaults to an empty set,
 * so a missing/unreachable settings table simply shows every category.
 */
export async function getVisibleCategories(): Promise<EditingCategory[]> {
  const hidden = await getHiddenCategorySlugs();
  return editingCategories.filter((c) => !hidden.has(c.slug));
}

/** Visible category display names (e.g. for the portfolio filter chips). */
export async function getVisibleCategoryNames(): Promise<string[]> {
  return (await getVisibleCategories()).map((c) => c.name);
}
