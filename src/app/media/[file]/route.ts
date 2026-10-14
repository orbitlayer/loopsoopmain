import { promises as fs } from "fs";
import path from "path";
import { uploadsDir, contentTypeForExt } from "@/lib/media";

/*
 * Serves uploaded media from UPLOADS_DIR at /media/<filename>. Files live
 * outside the public/ build output, so they're streamed here. Filenames are
 * validated (uuid.ext only) and the resolved path is confined to UPLOADS_DIR
 * to prevent traversal. Public (media are public assets).
 */
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
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
  try {
    const buf = await fs.readFile(full);
    const ext = file.split(".").pop() ?? "";
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentTypeForExt(ext),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
