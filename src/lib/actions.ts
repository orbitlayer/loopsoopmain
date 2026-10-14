"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { query, hasDbEnv } from "@/lib/db";
import {
  authenticate,
  startSession,
  endSession,
  getSession,
  requireAdmin,
} from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { ITEM_COLUMNS, type PortfolioItem } from "@/components/admin/types";

function itemLabel(input: ItemInput): string {
  return input.title.trim() || input.subtitle?.trim() || "Untitled";
}

/*
 * Server Actions — the ONLY way the admin reads/writes data now (MySQL can't be
 * touched from the browser). Every mutation calls requireAdmin() first, which is
 * the security boundary that Supabase RLS used to provide.
 */

const SELECT_ITEM = `SELECT ${ITEM_COLUMNS} FROM portfolio_items`;

function normalizeItem(r: Record<string, unknown>): PortfolioItem {
  return {
    ...(r as PortfolioItem),
    is_active: Boolean(r.is_active),
    is_featured: Boolean(r.is_featured),
  };
}

export type ItemInput = {
  category_id: string;
  title: string;
  subtitle: string | null;
  video_provider: "youtube" | "google_drive";
  video_url: string;
  youtube_id: string | null;
  youtube_url: string | null;
  thumbnail_url: string | null;
  video_type: "long" | "short";
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
};

/* ------------------------------------------------------------------- Auth */
export async function loginAction(
  _prev: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let user: { id: string; email: string } | null;
  try {
    user = await authenticate(email, password);
  } catch (e) {
    console.error("[login] error:", e);
    return {
      error: "Server error - the database may be unreachable. Please try again.",
    };
  }
  if (!user) return { error: "Invalid email or password." };
  await startSession(user);
  await logAudit({
    actorId: user.id,
    actorEmail: user.email,
    action: "login",
    summary: "Signed in to the admin panel",
  });
  redirect("/admin/dashboard");
}

/*
 * Demo sign-in — only for the no-database preview. When no DB is configured the
 * `users` table can't be reached, so normal login is impossible; this starts a
 * signed session for a stand-in admin so the browser-storage CMS can be used.
 * It refuses once a real database is configured (then use proper credentials).
 */
export async function demoLoginAction(): Promise<void> {
  // Refuse once a real database is configured — use proper credentials then.
  if (hasDbEnv()) redirect("/admin/login");
  await startSession({ id: "demo-admin", email: "demo@loopsoop.local" });
  redirect("/admin/dashboard");
}

export async function logoutAction() {
  const session = await getSession();
  await endSession();
  if (session) {
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "logout",
      summary: "Signed out of the admin panel",
    });
  }
  return { ok: true as const };
}

/* -------------------------------------------------------------------- Read */
export async function listItems(categoryId: string): Promise<PortfolioItem[]> {
  await requireAdmin();
  const rows = await query(
    `${SELECT_ITEM} WHERE category_id = ? ORDER BY sort_order ASC`,
    [categoryId],
  );
  return rows.map(normalizeItem);
}

/* ------------------------------------------------------------------ Writes */
function toValues(input: ItemInput) {
  return [
    input.category_id,
    input.title,
    input.subtitle,
    input.video_provider,
    input.video_url,
    input.youtube_id,
    input.youtube_url,
    input.thumbnail_url,
    input.video_type,
    Number.isFinite(input.sort_order) ? input.sort_order : 0,
    input.is_active ? 1 : 0,
    input.is_featured ? 1 : 0,
  ];
}

export async function createItem(input: ItemInput) {
  const session = await requireAdmin();
  const id = randomUUID();
  await query(
    `INSERT INTO portfolio_items
       (id, category_id, title, subtitle, video_provider, video_url, youtube_id,
        youtube_url, thumbnail_url, video_type, sort_order, is_active, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, ...toValues(input)],
  );
  await logAudit({
    actorId: session.uid,
    actorEmail: session.email,
    action: "item.create",
    resourceType: "portfolio_item",
    resourceId: id,
    summary: `Added video "${itemLabel(input)}"`,
    meta: { category_id: input.category_id, video_type: input.video_type },
  });
  return { ok: true as const };
}

export async function updateItem(id: string, input: ItemInput) {
  const session = await requireAdmin();
  await query(
    `UPDATE portfolio_items SET
       category_id = ?, title = ?, subtitle = ?, video_provider = ?, video_url = ?,
       youtube_id = ?, youtube_url = ?, thumbnail_url = ?, video_type = ?,
       sort_order = ?, is_active = ?, is_featured = ?
     WHERE id = ?`,
    [...toValues(input), id],
  );
  await logAudit({
    actorId: session.uid,
    actorEmail: session.email,
    action: "item.update",
    resourceType: "portfolio_item",
    resourceId: id,
    summary: `Edited video "${itemLabel(input)}"`,
  });
  return { ok: true as const };
}

export async function deleteItem(id: string) {
  const session = await requireAdmin();
  await query("DELETE FROM portfolio_items WHERE id = ?", [id]);
  await logAudit({
    actorId: session.uid,
    actorEmail: session.email,
    action: "item.delete",
    resourceType: "portfolio_item",
    resourceId: id,
    summary: "Deleted a portfolio video",
  });
  return { ok: true as const };
}

export async function setActive(id: string, isActive: boolean) {
  const session = await requireAdmin();
  await query("UPDATE portfolio_items SET is_active = ? WHERE id = ?", [
    isActive ? 1 : 0,
    id,
  ]);
  await logAudit({
    actorId: session.uid,
    actorEmail: session.email,
    action: "item.toggle",
    resourceType: "portfolio_item",
    resourceId: id,
    summary: isActive
      ? "Showed a video on the portfolio"
      : "Hid a video from the portfolio",
  });
  return { ok: true as const };
}

/** Swap the sort_order of two items (used by move up/down). */
export async function swapOrder(
  aId: string,
  aOrder: number,
  bId: string,
  bOrder: number,
) {
  await requireAdmin();
  await query("UPDATE portfolio_items SET sort_order = ? WHERE id = ?", [
    bOrder,
    aId,
  ]);
  await query("UPDATE portfolio_items SET sort_order = ? WHERE id = ?", [
    aOrder,
    bId,
  ]);
  return { ok: true as const };
}
