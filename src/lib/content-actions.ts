"use server";

import { requireAdmin } from "@/lib/auth";
import {
  saveDraft,
  publishBlock,
  discardDraft,
  isContentKey,
} from "@/lib/content";
import { logAudit } from "@/lib/audit";

/*
 * Server Actions for the admin CMS. Every mutation calls requireAdmin() and is
 * audit-logged; the block key is validated against the registry. Errors are
 * returned as friendly messages rather than thrown.
 */

type Result = { ok: true } | { error: string };

const HINT =
  "Could not save. Make sure the content_blocks table exists (run mysql/005_content_blocks.sql).";

export async function saveContentDraftAction(
  key: string,
  value: unknown,
): Promise<Result> {
  const session = await requireAdmin();
  if (!isContentKey(key)) return { error: "Unknown content block." };
  try {
    await saveDraft(key, value, session.email);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "content.draft",
      resourceType: "content_block",
      resourceId: key,
      summary: `Saved a draft for "${key}"`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[content] saveDraft failed:", err);
    return { error: HINT };
  }
}

export async function publishContentAction(key: string): Promise<Result> {
  const session = await requireAdmin();
  if (!isContentKey(key)) return { error: "Unknown content block." };
  try {
    await publishBlock(key, session.email);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "content.publish",
      resourceType: "content_block",
      resourceId: key,
      summary: `Published "${key}" to the live site`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[content] publish failed:", err);
    return { error: HINT };
  }
}

export async function discardContentDraftAction(key: string): Promise<Result> {
  const session = await requireAdmin();
  if (!isContentKey(key)) return { error: "Unknown content block." };
  try {
    await discardDraft(key, session.email);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "content.discard",
      resourceType: "content_block",
      resourceId: key,
      summary: `Discarded unpublished changes for "${key}"`,
    });
    return { ok: true };
  } catch (err) {
    console.error("[content] discard failed:", err);
    return { error: HINT };
  }
}
