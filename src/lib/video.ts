import { extractYouTubeId, youtubeThumb } from "@/lib/youtube";

/*
 * Video provider abstraction. A portfolio item is either a YouTube video (its
 * 11-char ID drives the thumbnail + embed) or a Google Drive file (its file ID
 * drives the /preview embed + thumbnail). Both render inside the SAME
 * ProjectCard container — only the underlying player differs.
 */

export type VideoProvider = "youtube" | "google_drive" | "upload";

export const VIDEO_PROVIDERS: { value: VideoProvider; label: string }[] = [
  { value: "youtube", label: "YouTube" },
  { value: "google_drive", label: "Google Drive" },
  { value: "upload", label: "Upload to hosting" },
];

/* Self-hosted video. Accepted MIME types -> file extension, and the size
   ceiling. Files are streamed to UPLOADS_DIR and served from /media/<file>. */
export const VIDEO_UPLOAD_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/x-matroska": "mkv",
};
export const VIDEO_UPLOAD_MAX_BYTES = 1024 * 1024 * 1024; // 1GB

// Matches /file/d/<id>/... and ?id=<id> / &id=<id> (open?id=…). Drive IDs are
// long url-safe strings; 20+ chars in practice, but allow 10+ to be safe.
const DRIVE_RE = /(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]{10,})/;

/** Extract a Google Drive file ID from any common share/preview URL (or bare ID). */
export function extractDriveId(input?: string | null): string | null {
  if (!input) return null;
  const s = input.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s; // already a bare file ID
  const m = s.match(DRIVE_RE);
  return m ? m[1] : null;
}

/** Public thumbnail endpoint for a Drive file (works for "anyone with link"). */
export const driveThumbnail = (id: string) =>
  `https://drive.google.com/thumbnail?id=${id}&sz=w1280`;

/** Embeddable preview player for a Drive file. */
export const drivePreviewEmbed = (id: string) =>
  `https://drive.google.com/file/d/${id}/preview`;

/** Privacy-friendly YouTube embed (autoplay in the modal, like today). */
export const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;

/** Whether a pasted URL is valid for the chosen provider. */
export function isValidVideoUrl(provider: VideoProvider, url: string): boolean {
  return provider === "google_drive"
    ? extractDriveId(url) !== null
    : extractYouTubeId(url) !== null;
}

/* -- Resolution helpers used by ProjectCard / dashboard (provider-aware) -- */

type VideoLike = {
  provider?: VideoProvider;
  youtubeId?: string;
  driveId?: string;
  thumbnailUrl?: string;
  /** Self-hosted file URL, e.g. /media/<uuid>.mp4 (provider === "upload"). */
  fileUrl?: string;
};

/** True when the item plays from our own hosting (a <video>, not an iframe). */
export const isSelfHosted = (provider?: VideoProvider) => provider === "upload";

/** Thumbnail URL for a portfolio item, or undefined if none can be derived. */
export function videoThumbnail(v: VideoLike): string | undefined {
  if (v.provider === "upload") return v.thumbnailUrl || undefined;
  if (v.provider === "google_drive") {
    return v.thumbnailUrl || (v.driveId ? driveThumbnail(v.driveId) : undefined);
  }
  return v.youtubeId ? youtubeThumb(v.youtubeId) : undefined;
}

/** Playable URL for the in-page player (an iframe src, or a <video> src for
    self-hosted uploads), or undefined if none. */
export function videoEmbedUrl(v: VideoLike): string | undefined {
  if (v.provider === "upload") return v.fileUrl || undefined;
  if (v.provider === "google_drive") {
    return v.driveId ? drivePreviewEmbed(v.driveId) : undefined;
  }
  return v.youtubeId ? youtubeEmbed(v.youtubeId) : undefined;
}
