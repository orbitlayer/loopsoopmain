import { createWriteStream } from "fs";
import { mkdir, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { uploadsDir } from "@/lib/media";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { VIDEO_UPLOAD_TYPES, VIDEO_UPLOAD_MAX_BYTES } from "@/lib/video";

/*
 * Admin-only streaming upload for self-hosted portfolio videos. The client
 * sends the raw file bytes (so the browser can report XHR upload progress) with
 * the name/type in the query string. The body is streamed straight to
 * UPLOADS_DIR/<uuid>.<ext> (never buffered whole in memory) with a size cap,
 * and a row is recorded in `media` (best-effort). Returns { url, ... }.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 600;

function err(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return err("Unauthorized.", 401);

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") || "").toLowerCase();
  const name = (url.searchParams.get("name") || "video").slice(0, 255);
  const ext = VIDEO_UPLOAD_TYPES[type];
  if (!ext) return err("Unsupported video type. Use MP4, WebM, MOV or MKV.", 415);

  const declared = Number(req.headers.get("content-length") || 0);
  if (declared && declared > VIDEO_UPLOAD_MAX_BYTES) {
    return err("File is too large (max 1GB).", 413);
  }
  if (!req.body) return err("No file received.", 400);

  const id = randomUUID();
  const filename = `${id}.${ext}`;
  const dir = uploadsDir();
  const full = path.join(dir, filename);

  let written = 0;
  let tooBig = false;
  try {
    await mkdir(dir, { recursive: true });
    const ws = createWriteStream(full);
    const reader = req.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      written += value.byteLength;
      if (written > VIDEO_UPLOAD_MAX_BYTES) {
        tooBig = true;
        ws.destroy();
        break;
      }
      if (!ws.write(value)) {
        await new Promise<void>((res) => ws.once("drain", () => res()));
      }
    }
    if (!tooBig) {
      await new Promise<void>((res, rej) =>
        ws.end((e?: Error | null) => (e ? rej(e) : res())),
      );
    }
  } catch (e) {
    console.error("[upload-video] write failed:", e);
    try {
      await unlink(full);
    } catch {
      /* ignore */
    }
    return err("Could not save the video on the server.", 500);
  }

  if (tooBig) {
    try {
      await unlink(full);
    } catch {
      /* ignore */
    }
    return err("File is too large (max 1GB).", 413);
  }

  // Record the upload (no-op in no-DB mode; non-fatal on failure).
  try {
    await query(
      "INSERT INTO media (id, filename, original_name, mime, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [id, filename, name, type, written, session.email ?? null],
    );
  } catch (e) {
    console.error("[upload-video] media insert failed (non-fatal):", e);
  }

  return Response.json({ url: `/media/${filename}`, filename, mime: type, size: written });
}
