"use server";

import { requireAdmin } from "@/lib/auth";
import { setSetting, SETTING, getHiddenCategorySlugs } from "@/lib/settings";
import { logAudit } from "@/lib/audit";
import { editingCategories } from "@/lib/data";

/*
 * Server Actions for the admin Controls page (Maintenance Mode + kill switches).
 * Every mutation calls requireAdmin() first (the security boundary) and is
 * audit-logged. Errors are returned as friendly messages rather than thrown.
 */

type Result = { ok: true } | { error: string };

const TABLE_HINT =
  "Could not save. Make sure the site_settings table exists (run mysql/004_site_settings.sql).";

export async function setMaintenanceAction(
  on: boolean,
  message: string,
): Promise<Result> {
  const session = await requireAdmin();
  try {
    await setSetting(SETTING.MAINTENANCE, on ? "on" : "off", session.email);
    if (message.trim()) {
      await setSetting(SETTING.MAINTENANCE_MESSAGE, message.trim(), session.email);
    }
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: on ? "maintenance.enable" : "maintenance.disable",
      resourceType: "site_settings",
      resourceId: SETTING.MAINTENANCE,
      summary: on
        ? "Enabled maintenance mode — public site is offline to visitors"
        : "Disabled maintenance mode — public site restored",
    });
    return { ok: true };
  } catch (err) {
    console.error("[controls] setMaintenance failed:", err);
    return { error: TABLE_HINT };
  }
}

export async function saveMaintenanceMessageAction(
  message: string,
): Promise<Result> {
  const session = await requireAdmin();
  try {
    await setSetting(
      SETTING.MAINTENANCE_MESSAGE,
      message.trim(),
      session.email,
    );
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "maintenance.message",
      resourceType: "site_settings",
      resourceId: SETTING.MAINTENANCE_MESSAGE,
      summary: "Updated the maintenance-mode message",
    });
    return { ok: true };
  } catch (err) {
    console.error("[controls] saveMaintenanceMessage failed:", err);
    return { error: TABLE_HINT };
  }
}

/**
 * Show or hide a single editing category across the public site (Our Work cards,
 * home "What We Do", portfolio filter chips, footer services). Stored as a JSON
 * array of hidden slugs in the existing site_settings table — no new migration.
 */
export async function setCategoryVisibilityAction(
  slug: string,
  visible: boolean,
): Promise<Result> {
  const session = await requireAdmin();
  const category = editingCategories.find((c) => c.slug === slug);
  if (!category) return { error: "Unknown category." };
  try {
    const hidden = await getHiddenCategorySlugs();
    if (visible) hidden.delete(slug);
    else hidden.add(slug);
    await setSetting(
      SETTING.CATEGORIES_HIDDEN,
      JSON.stringify([...hidden]),
      session.email,
    );
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: visible ? "category.show" : "category.hide",
      resourceType: "site_settings",
      resourceId: SETTING.CATEGORIES_HIDDEN,
      summary: visible
        ? `Showed the "${category.name}" category on the public site`
        : `Hid the "${category.name}" category from the public site`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[controls] setCategoryVisibility failed:", err);
    return { error: TABLE_HINT };
  }
}

export async function setKillContactAction(on: boolean): Promise<Result> {
  const session = await requireAdmin();
  try {
    await setSetting(SETTING.KILL_CONTACT, on ? "on" : "off", session.email);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: on ? "killswitch.contact.on" : "killswitch.contact.off",
      resourceType: "site_settings",
      resourceId: SETTING.KILL_CONTACT,
      summary: on
        ? "Kill switch ON — disabled public contact (WhatsApp) channel"
        : "Kill switch OFF — re-enabled public contact (WhatsApp) channel",
    });
    return { ok: true };
  } catch (err) {
    console.error("[controls] setKillContact failed:", err);
    return { error: TABLE_HINT };
  }
}
