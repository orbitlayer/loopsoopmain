/*
 * YouTube helpers. The DB stores the normalized 11-char video ID as the source
 * of truth; thumbnails and the embed URL are derived from it (matching how
 * ProjectCard has always rendered videos).
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extract the 11-char video ID from any common YouTube URL form, or from a bare
 * ID. Supports watch?v=, youtu.be/, /embed/, /shorts/, /live/, /v/.
 * Returns null if no valid ID can be found.
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const s = input.trim();
  if (ID_RE.test(s)) return s;

  try {
    const url = new URL(s.includes("://") ? s : `https://${s}`);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        const v = url.searchParams.get("v");
        return v && ID_RE.test(v) ? v : null;
      }
      const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

/** Whether a string can be resolved to a valid YouTube video ID. */
export const isValidYouTube = (input: string) => extractYouTubeId(input) !== null;

/** hqdefault always exists (unlike maxresdefault); good default thumbnail. */
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Canonical watch URL, stored alongside the ID for admin reference. */
export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
