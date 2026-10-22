"use client";

import { useEffect, useState } from "react";
import { createItem, updateItem } from "@/lib/actions";
import { extractYouTubeId, youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";
import {
  extractDriveId,
  driveThumbnail,
  isValidVideoUrl,
  VIDEO_PROVIDERS,
  VIDEO_UPLOAD_TYPES,
  VIDEO_UPLOAD_MAX_BYTES,
  type VideoProvider,
} from "@/lib/video";
import { Button, Field, SelectInput, Switch, TextInput } from "./ui";
import type { AdminCategory, PortfolioItem, VideoType } from "./types";

type ItemWrite = {
  category_id: string;
  title: string;
  subtitle: string | null;
  video_provider: VideoProvider;
  video_type: VideoType;
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  video_url: string;
  youtube_id: string | null;
  youtube_url: string | null;
  thumbnail_url: string | null;
};

/* Add / edit a portfolio video (YouTube or Google Drive). Handles its own
   Supabase insert/update; calls onSaved() so the dashboard refetches. RLS
   ensures only admins can write. */
export function VideoForm({
  categories,
  item,
  defaultCategoryId,
  defaultType,
  nextSortOrder,
  onClose,
  onSaved,
}: {
  categories: AdminCategory[];
  item: PortfolioItem | null; // null = create
  defaultCategoryId: string;
  defaultType: VideoType;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = Boolean(item);
  const [provider, setProvider] = useState<VideoProvider>(
    item?.video_provider ?? "youtube",
  );
  const [title, setTitle] = useState(item?.title ?? "");
  const [url, setUrl] = useState(item?.video_url ?? item?.youtube_url ?? "");
  const [thumb, setThumb] = useState(item?.thumbnail_url ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [categoryId, setCategoryId] = useState(
    item?.category_id ?? defaultCategoryId,
  );
  const [videoType, setVideoType] = useState<VideoType>(
    item?.video_type ?? defaultType,
  );
  const [order, setOrder] = useState<number>(item?.sort_order ?? nextSortOrder);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Self-hosted upload state (provider === "upload").
  const [uploadedUrl, setUploadedUrl] = useState(
    item?.video_provider === "upload" ? item.video_url ?? "" : "",
  );
  const [uploadName, setUploadName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isDrive = provider === "google_drive";
  const isUpload = provider === "upload";
  const ytId = extractYouTubeId(url);
  const drId = extractDriveId(url);
  const urlValid = isDrive ? Boolean(drId) : Boolean(ytId);

  // Stream the chosen file to our own hosting, reporting live progress.
  function handleFile(file: File) {
    setError(null);
    if (!VIDEO_UPLOAD_TYPES[file.type]) {
      setError("Unsupported file. Upload an MP4, WebM, MOV or MKV video.");
      return;
    }
    if (file.size > VIDEO_UPLOAD_MAX_BYTES) {
      setError("That file is too large (max 1GB).");
      return;
    }
    setUploadName(file.name);
    setUploadedUrl("");
    setUploadPct(0);
    setUploading(true);
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `/api/admin/upload-video?name=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}`,
    );
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable)
        setUploadPct(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const r = JSON.parse(xhr.responseText) as { url: string };
          setUploadedUrl(r.url);
          setUploadPct(100);
        } catch {
          setError("Upload finished but the server response was invalid.");
        }
      } else {
        let msg = "Upload failed.";
        try {
          msg = (JSON.parse(xhr.responseText) as { error?: string }).error || msg;
        } catch {
          /* keep default */
        }
        setError(msg);
      }
    };
    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed - check your connection and try again.");
    };
    xhr.send(file);
  }
  const previewThumb = isDrive
    ? thumb.trim() || (drId ? driveThumbnail(drId) : undefined)
    : ytId
      ? youtubeThumb(ytId)
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Title is optional - only a valid source (link, or uploaded file) is required.
    if (isUpload) {
      if (uploading) {
        setError("Please wait for the upload to finish.");
        return;
      }
      if (!uploadedUrl) {
        setError("Upload a video file first.");
        return;
      }
    } else if (!isValidVideoUrl(provider, url)) {
      setError(
        isDrive
          ? "Enter a valid Google Drive link (…/file/d/FILE_ID/view)."
          : "Enter a valid YouTube URL (watch, youtu.be, embed or shorts link).",
      );
      return;
    }

    setPending(true);

    const ytUrl = ytId ? youtubeWatchUrl(ytId) : null;
    const payload: ItemWrite = {
      category_id: categoryId,
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      video_provider: provider,
      video_type: videoType,
      sort_order: Number.isFinite(order) ? order : nextSortOrder,
      is_active: isActive,
      is_featured: isFeatured,
      video_url: isUpload
        ? uploadedUrl
        : isDrive
          ? `https://drive.google.com/file/d/${drId}/view`
          : ytUrl!,
      youtube_id: isDrive || isUpload ? null : ytId,
      youtube_url: isDrive || isUpload ? null : ytUrl,
      thumbnail_url: isDrive || isUpload ? thumb.trim() || null : null,
    };

    try {
      if (editing) await updateItem(item!.id, payload);
      else await createItem(payload);
      onSaved();
    } catch {
      setError("Could not save. Please try again.");
      setPending(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm transition-opacity duration-200 sm:items-center ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit video" : "Add video"}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className={`my-8 w-full max-w-lg rounded-[20px] border border-line bg-surface p-6 shadow-2xl shadow-black/10 transition-all duration-200 ${
          mounted ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-ink">
          {editing ? "Edit video" : "Add video"}
        </h2>
        <p className="mt-0.5 text-sm text-faint">
          Paste a link - the thumbnail and player are generated for you.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Title (optional)">
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Documentary Editing Sample 01"
              autoFocus
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Video source">
              <SelectInput
                value={provider}
                onChange={(e) => setProvider(e.target.value as VideoProvider)}
              >
                {VIDEO_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Type">
              <SelectInput
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as VideoType)}
              >
                <option value="long">Long Form</option>
                <option value="short">Short Form</option>
              </SelectInput>
            </Field>
          </div>

          {!isUpload && (
            <Field
              label={isDrive ? "Google Drive URL" : "YouTube URL"}
              hint={
                isDrive
                  ? "Share the file as “Anyone with the link can view” so it plays on the site."
                  : undefined
              }
            >
              <TextInput
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  isDrive
                    ? "https://drive.google.com/file/d/FILE_ID/view"
                    : "https://www.youtube.com/watch?v=…"
                }
              />
              {url.trim() && (
                <div className="mt-2.5">
                  {urlValid ? (
                    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-subtle p-2">
                      {previewThumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={previewThumb}
                          alt=""
                          onError={(e) =>
                            (e.currentTarget.style.display = "none")
                          }
                          className="h-10 w-[71px] rounded bg-subtle object-cover"
                        />
                      )}
                      <span className="text-xs text-ink">
                        Valid {isDrive ? "Drive file" : "video"}
                        <span className="ml-1 text-faint">
                          {isDrive ? drId : ytId}
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600">
                      Not a recognizable {isDrive ? "Google Drive" : "YouTube"}{" "}
                      link yet.
                    </p>
                  )}
                </div>
              )}
            </Field>
          )}

          {isUpload && (
            <Field
              label="Video file"
              hint="MP4, WebM, MOV or MKV - up to 1GB. Streamed from your own hosting."
            >
              {!uploadedUrl && !uploading && (
                <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-line bg-subtle px-4 py-6 text-center text-sm text-faint transition-colors hover:border-ink/40 hover:text-ink">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (f) handleFile(f);
                    }}
                  />
                  Click to choose a video to upload
                </label>
              )}
              {uploading && (
                <div className="rounded-xl border border-line bg-subtle p-3">
                  <div className="flex items-center justify-between text-xs text-ink">
                    <span className="truncate pr-2">{uploadName}</span>
                    <span className="tabular-nums">{uploadPct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-ink transition-[width] duration-150"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[0.7rem] text-faint">
                    Uploading - keep this window open until it reaches 100%.
                  </p>
                </div>
              )}
              {uploadedUrl && !uploading && (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-subtle p-2.5">
                  <span className="truncate text-xs text-ink">
                    Uploaded{" "}
                    <span className="text-faint">
                      {uploadName || uploadedUrl}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedUrl("");
                      setUploadPct(0);
                      setUploadName("");
                    }}
                    className="shrink-0 text-xs text-faint underline-offset-2 hover:text-ink hover:underline"
                  >
                    Replace
                  </button>
                </div>
              )}
            </Field>
          )}

          {(isDrive || isUpload) && (
            <Field
              label="Thumbnail URL (optional)"
              hint={
                isDrive
                  ? "Leave blank to auto-generate from the Drive file."
                  : "Optional poster image shown on the card before the video plays."
              }
            >
              <TextInput
                value={thumb}
                onChange={(e) => setThumb(e.target.value)}
                placeholder="https://…/thumbnail.jpg"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category">
              <SelectInput
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Order">
              <TextInput
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10))}
              />
            </Field>
          </div>

          <Field label="Subtitle (optional)">
            <TextInput
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. Travel Documentary"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-line bg-subtle px-4 py-3">
            <Switch
              label="Show on portfolio"
              checked={isActive}
              onChange={setIsActive}
            />
            <Switch
              label="Featured on home"
              checked={isFeatured}
              onChange={setIsFeatured}
            />
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Add video"}
          </Button>
        </div>
      </form>
    </div>
  );
}
