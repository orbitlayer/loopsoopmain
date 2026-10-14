import "server-only";
import { cache } from "react";
import { query } from "./db";

/*
 * Site settings — a small key/value store backed by the `site_settings` table.
 *
 * The READ path is fail-safe: if the table is missing or the DB is unreachable,
 * it returns empty/defaults so the public site keeps working normally (control
 * switches simply read as OFF). Only the admin WRITE path (setSetting) can throw,
 * and its callers surface a friendly error.
 */

export const SETTING = {
  MAINTENANCE: "maintenance_mode",
  MAINTENANCE_MESSAGE: "maintenance_message",
  KILL_CONTACT: "kill_contact",
  // JSON array of editing-category slugs hidden from the public site.
  CATEGORIES_HIDDEN: "categories_hidden",
} as const;

export const DEFAULT_MAINTENANCE_MESSAGE =
  "We're making some improvements and will be back shortly. Thanks for your patience.";

type SettingRow = { key: string; value: string | null };

/** Resolve `p`, but give up with `fallback` after `ms` (also on rejection). */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        console.error("[settings] read failed (non-fatal, using defaults):", err);
        resolve(fallback);
      },
    );
  });
}

// Memoised per request (React cache): several surfaces read settings on the
// same request (layout controls, category visibility, footer), so they share a
// single DB round-trip instead of querying site_settings each.
export const getAllSettings = cache(async (): Promise<Record<string, string>> => {
  // The public site reads this on every request (the layout is force-dynamic).
  // Bound it so a slow/hung DB can't block page rendering: on timeout, error,
  // or a missing table we fall back to defaults and every control reads OFF.
  const rows = await withTimeout<SettingRow[] | null>(
    query<SettingRow>("SELECT `key`, `value` FROM site_settings"),
    2500,
    null,
  );
  if (!rows) return {};
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value ?? "";
  return out;
});

export async function setSetting(
  key: string,
  value: string,
  updatedBy?: string | null,
): Promise<void> {
  await query(
    "INSERT INTO site_settings (`key`, `value`, updated_by) VALUES (?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_by = VALUES(updated_by)",
    [key, value, updatedBy ?? null],
  );
}

/** Slugs of editing categories the admin has hidden from the public site.
    Fail-safe: no setting / bad JSON / DB error → empty set (all categories show). */
export async function getHiddenCategorySlugs(): Promise<Set<string>> {
  const s = await getAllSettings();
  const raw = s[SETTING.CATEGORIES_HIDDEN];
  if (!raw) return new Set();
  try {
    const arr = JSON.parse(raw);
    return new Set(
      Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [],
    );
  } catch {
    return new Set();
  }
}

export type SiteControls = {
  maintenance: boolean;
  maintenanceMessage: string;
  killContact: boolean;
};

/** Resolved control state with safe defaults (everything OFF). Never throws.
    Memoised per request (React cache) so the layout + page share one read. */
export const getSiteControls = cache(async (): Promise<SiteControls> => {
  const s = await getAllSettings();
  return {
    maintenance: s[SETTING.MAINTENANCE] === "on",
    maintenanceMessage:
      s[SETTING.MAINTENANCE_MESSAGE]?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    killContact: s[SETTING.KILL_CONTACT] === "on",
  };
});
