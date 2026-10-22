import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";
import { uploadsDir, contentTypeForExt } from "@/lib/media";

/*
 * Serves uploaded media from UPLOADS_DIR at /media/<filename>. Files live
 * outside the public/ build output, so they're streamed here. Filenames are
 * validated (uuid.ext only) and the resolved path is confined to UPLOADS_DIR
 * to prevent traversal. Supports HTTP Range requests so self-hosted videos can
 * seek and stream without buffering the whole file into memory.
 */
export const dynamic = "force-dynamic";

function webStream(nodeStream: ReturnType<typeof createReadStream>) {
  // Node's web stream type differs slightly from the DOM one Response expects.
  return Readable.toWeb(nodeStream) as unknown as ReadableStream<Uint8Array>;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  if (!/^[a-f0-9-]+\.[a-z0-9]+$/i.test(file)) {
    return new Response("Not found", { status: 404 });
  }
  const dir = path.resolve(uploadsDir());
  const full = path.resolve(dir, file);
  if (full !== dir && !full.startsWith(dir + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  let size: number;
  try {
    const s = await stat(full);
    if (!s.isFile()) return new Response("Not found", { status: 404 });
    size = s.size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const ext = file.split(".").pop() ?? "";
  const type = contentTypeForExt(ext);
  const immutable = "public, max-age=31536000, immutable";

  const range = req.headers.get("range");
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (m) {
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : size - 1;
    if (!Number.isFinite(start)) start = 0;
    if (!Number.isFinite(end) || end >= size) end = size - 1;
    if (start > end || start < 0 || start >= size) {
      return new Response("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}`, "Accept-Ranges": "bytes" },
      });
    }
    return new Response(webStream(createReadStream(full, { start, end })), {
      status: 206,
      headers: {
        "Content-Type": type,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": immutable,
      },
    });
  }

  return new Response(webStream(createReadStream(full)), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(size),
      "Accept-Ranges": "bytes",
      "Cache-Control": immutable,
    },
  });
}
