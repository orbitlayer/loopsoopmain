import "server-only";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { query } from "./db";

/*
 * Media library. Files are written to UPLOADS_DIR (a persistent folder OUTSIDE
 * the Git deploy on Hostinger — set the env var to keep uploads across deploys)
 * and served by the /media/<filename> route. Row metadata lives in `media`.
 * If UPLOADS_DIR is unset we fall back to <repo>/public/uploads (fine for local
 * dev, but wiped on each production deploy — so set UPLOADS_DIR in production).
 */

const FALLBACK_DIR = path.join(process.cwd(), "public", "uploads");

export function uploadsDir(): string {
  const dir = process.env.UPLOADS_DIR?.trim();
  return dir && dir.length > 0 ? dir : FALLBACK_DIR;
}

// mime -> extension for the image types we accept. SVG is intentionally
// excluded: it can embed scripts and would be an inline stored-XSS vector.
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function contentTypeForExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

export type MediaItem = {
  id: string;
  filename: string;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
  uploaded_by: string | null;
};

export async function saveUpload(
  file: File,
  uploadedBy: string | null,
): Promise<{ ok: true; item: MediaItem } | { error: string }> {
  const ext = ALLOWED[file.type];
  if (!ext) {
    return {
      error: "Unsupported file type. Upload a JPG, PNG, WebP, GIF or AVIF image.",
    };
  }
  if (file.size > MAX_BYTES) return { error: "File is too large (max 5MB)." };

  const dir = uploadsDir();
  const id = randomUUID();
  const filename = `${id}.${ext}`;
  const original = (file.name || "upload").slice(0, 255);

  try {
    await fs.mkdir(dir, { recursive: true });
    const buf = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(dir, filename), buf);
  } catch (err) {
    console.error("[media] write failed:", err);
    return {
      error:
        "Could not save the file on the server. Check that UPLOADS_DIR is writable.",
    };
  }

  try {
    await query(
      "INSERT INTO media (id, filename, original_name, mime, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [id, filename, original, file.type, file.size, uploadedBy],
    );
  } catch (err) {
    console.error("[media] db insert failed:", err);
    // Roll back the just-written file so we don't orphan it.
    try {
      await fs.unlink(path.join(dir, filename));
    } catch {
      // ignore
    }
    return {
      error:
        "Could not record the upload. Make sure the media table exists (run mysql/007_media.sql).",
    };
  }

  return {
    ok: true,
    item: {
      id,
      filename,
      original_name: original,
      mime: file.type,
      size: file.size,
      created_at: "",
      uploaded_by: uploadedBy,
    },
  };
}

export async function listMedia(): Promise<MediaItem[]> {
  return await query<MediaItem>(
    "SELECT id, filename, original_name, mime, size, created_at, uploaded_by FROM media ORDER BY created_at DESC",
  );
}

export async function deleteMedia(id: string): Promise<void> {
  const rows = await query<{ filename: string }>(
    "SELECT filename FROM media WHERE id = ? LIMIT 1",
    [id],
  );
  const filename = rows[0]?.filename;
  await query("DELETE FROM media WHERE id = ?", [id]);
  if (filename) {
    try {
      await fs.unlink(path.join(uploadsDir(), filename));
    } catch {
      // File already gone — ignore.
    }
  }
}
