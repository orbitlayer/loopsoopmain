"use client";

import { useEffect, useState } from "react";
import { createItem, updateItem } from "@/lib/actions";
import { extractYouTubeId, youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";
import {
  extractDriveId,
  driveThumbnail,
  isValidVideoUrl,
  VIDEO_PROVIDERS,
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

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isDrive = provider === "google_drive";
  const ytId = extractYouTubeId(url);
  const drId = extractDriveId(url);
  const urlValid = isDrive ? Boolean(drId) : Boolean(ytId);
  const previewThumb = isDrive
    ? thumb.trim() || (drId ? driveThumbnail(drId) : undefined)
    : ytId
      ? youtubeThumb(ytId)
      : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Title is optional now - only the video URL is required.
    if (!isValidVideoUrl(provider, url)) {
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
      video_url: isDrive
        ? `https://drive.google.com/file/d/${drId}/view`
        : ytUrl!,
      youtube_id: isDrive ? null : ytId,
      youtube_url: isDrive ? null : ytUrl,
      thumbnail_url: isDrive ? thumb.trim() || null : null,
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
                        onError={(e) => (e.currentTarget.style.display = "none")}
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
                    Not a recognizable {isDrive ? "Google Drive" : "YouTube"} link
                    yet.
                  </p>
                )}
              </div>
            )}
          </Field>

          {isDrive && (
            <Field
              label="Thumbnail URL (optional)"
              hint="Leave blank to auto-generate from the Drive file."
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
