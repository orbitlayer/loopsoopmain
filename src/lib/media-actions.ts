"use server";

import { requireAdmin } from "@/lib/auth";
import {
  saveUpload,
  deleteMedia,
  listVideoMedia,
  type MediaItem,
} from "@/lib/media";
import { logAudit } from "@/lib/audit";

/* Media upload/delete. Admin-gated + audit-logged. */

/* Self-hosted videos in the library, for the portfolio form's "Choose from
   library" picker. Admin-gated; returns [] in no-DB mode or on error. */
export async function listVideoMediaAction(): Promise<MediaItem[]> {
  await requireAdmin();
  try {
    return await listVideoMedia();
  } catch {
    return [];
  }
}

export async function uploadMediaAction(
  formData: FormData,
): Promise<{ ok: true; item: MediaItem } | { error: string }> {
  const session = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file." };
  }
  const res = await saveUpload(file, session.email);
  if ("error" in res) return { error: res.error };
  await logAudit({
    actorId: session.uid,
    actorEmail: session.email,
    action: "media.upload",
    resourceType: "media",
    resourceId: res.item.id,
    summary: `Uploaded "${res.item.original_name}"`,
  });
  return { ok: true, item: res.item };
}

export async function deleteMediaAction(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await requireAdmin();
  try {
    await deleteMedia(id);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "media.delete",
      resourceType: "media",
      resourceId: id,
      summary: "Deleted a media file",
    });
    return { ok: true };
  } catch (err) {
    console.error("[media] delete failed:", err);
    return { error: "Could not delete the file." };
  }
}
