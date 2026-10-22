"use client";

import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Copy,
  Trash2,
  Check,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { uploadMediaAction, deleteMediaAction } from "@/lib/media-actions";
import { Button, IconButton } from "./ui";

type MediaItem = {
  id: string;
  filename: string;
  original_name: string;
  mime: string;
  size: number;
  created_at: string;
  uploaded_by: string | null;
};

type Filter = "all" | "images" | "videos";

const isVideo = (mime: string) => mime.toLowerCase().startsWith("video/");

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/*
 * Media library. Images are uploaded here (served via /media/<file>); videos
 * are uploaded from the Portfolio form's "Upload to hosting" source and also
 * land in this library. Browse (filter by images / videos), preview, copy the
 * URL for use in content/SEO fields, and delete.
 */
export function MediaClient({ initial }: { initial: MediaItem[] }) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [filter, setFilter] = useState<Filter>("all");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const videoCount = useMemo(
    () => items.filter((i) => isVideo(i.mime)).length,
    [items],
  );
  const imageCount = items.length - videoCount;
  // The filter bar only mounts while videoCount > 0. If every video is deleted
  // the bar disappears, so fall back to "all" rather than let a stale
  // "videos"/"images" selection strand the user on an empty view they can't
  // navigate out of.
  const activeFilter: Filter = videoCount > 0 ? filter : "all";
  const visible = useMemo(() => {
    if (activeFilter === "images") return items.filter((i) => !isVideo(i.mime));
    if (activeFilter === "videos") return items.filter((i) => isVideo(i.mime));
    return items;
  }, [items, activeFilter]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadMediaAction(fd);
        if ("error" in res) {
          setError(res.error);
          break;
        }
        setItems((prev) => [res.item, ...prev]);
      }
    } catch {
      setError("Upload failed. Your session may have expired — reload the page.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function copy(item: MediaItem) {
    const url = `${window.location.origin}/media/${item.filename}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((c) => (c === item.id ? null : c)), 1500);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function remove(id: string) {
    setPendingId(id);
    setError(null);
    try {
      const res = await deleteMediaAction(id);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
      setConfirmId(null);
    } catch {
      setError("Could not delete. Your session may have expired.");
    } finally {
      setPendingId(null);
    }
  }

  const FILTERS: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: items.length },
    { value: "images", label: "Images", count: imageCount },
    { value: "videos", label: "Videos", count: videoCount },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-subtle text-muted">
            <ImageIcon className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
              Media
            </h1>
            <p className="text-sm text-faint">
              {items.length} {items.length === 1 ? "file" : "files"}
              {videoCount > 0
                ? ` · ${imageCount} image${imageCount === 1 ? "" : "s"}, ${videoCount} video${videoCount === 1 ? "" : "s"}`
                : " · images up to 5MB"}
            </p>
          </div>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload image"}
          </Button>
        </div>
      </div>

      {/* Image / video filter — shown once there's at least one uploaded video. */}
      {videoCount > 0 && (
        <div className="mt-6 inline-flex rounded-xl border border-line bg-subtle p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === f.value
                  ? "bg-surface text-ink shadow-sm"
                  : "text-muted hover:text-ink"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-faint">{f.count}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="mt-8 flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-line px-4 py-16 text-center outline-none transition-colors hover:border-ink/25 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ink/20"
        >
          <Upload className="h-6 w-6 text-faint" strokeWidth={1.5} />
          <span className="mt-2 text-sm text-muted">
            Upload your first image
          </span>
          <span className="text-xs text-faint">JPG, PNG, WebP, GIF or AVIF</span>
        </button>
      ) : visible.length === 0 ? (
        <div className="mt-8 flex w-full flex-col items-center gap-1 rounded-2xl border border-dashed border-line px-4 py-16 text-center">
          <Film className="h-6 w-6 text-faint" strokeWidth={1.5} />
          <span className="mt-2 text-sm text-muted">
            No {activeFilter === "videos" ? "videos" : "images"} yet
          </span>
          {activeFilter === "videos" && (
            <span className="text-xs text-faint">
              Upload a video from the Portfolio form (“Upload to hosting”).
            </span>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {visible.map((item) => (
            <li
              key={item.id}
              className="overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div className="relative aspect-square bg-subtle">
                {isVideo(item.mime) ? (
                  <>
                    <video
                      src={`/media/${item.filename}`}
                      controls
                      muted
                      playsInline
                      preload="metadata"
                      className="h-full w-full bg-black object-contain"
                    />
                    <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                      <Film className="h-3 w-3" strokeWidth={2} /> Video
                    </span>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/media/${item.filename}`}
                    alt={item.original_name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium text-ink" title={item.original_name}>
                  {item.original_name}
                </p>
                <p className="mt-0.5 text-[0.65rem] text-faint">
                  {fmtSize(item.size)}
                </p>
                {confirmId === item.id ? (
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => remove(item.id)}
                      disabled={pendingId === item.id}
                      className="rounded-lg bg-red-500 px-2 py-1 text-[0.65rem] font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {pendingId === item.id ? "…" : "Delete"}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-lg px-2 py-1 text-[0.65rem] text-muted hover:text-ink"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-0.5">
                    <button
                      onClick={() => copy(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-line px-2 py-1 text-[0.65rem] text-muted transition-colors hover:border-ink/20 hover:text-ink"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3 w-3" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy URL
                        </>
                      )}
                    </button>
                    <IconButton label="Delete" danger onClick={() => setConfirmId(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconButton>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
