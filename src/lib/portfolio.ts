import "server-only";
import { query, hasDbEnv } from "@/lib/db";
import { projects as staticProjects, type Project } from "@/lib/data";
import { extractDriveId, type VideoProvider } from "@/lib/video";

/*
 * Public data-access layer. Reads published portfolio items from MySQL and maps
 * them to the existing `Project` shape so WorkGrid/ProjectCard render unchanged.
 * Falls back to the static seed only when the DB env isn't configured.
 */

type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  youtube_id: string | null;
  video_provider: VideoProvider | null;
  video_url: string | null;
  thumbnail_url: string | null;
  video_type: "long" | "short";
  is_featured: number;
  sort_order: number;
  category_name: string | null;
};

function rowToProject(r: Row): Project {
  const provider: VideoProvider = r.video_provider ?? "youtube";
  const categoryName = r.category_name ?? "";
  return {
    id: r.id,
    title: r.title,
    category: r.subtitle?.trim() || categoryName,
    filter: categoryName,
    type: r.video_type,
    seed: 0,
    provider,
    youtubeId: r.youtube_id ?? undefined,
    driveId:
      provider === "google_drive"
        ? extractDriveId(r.video_url) ?? undefined
        : undefined,
    thumbnailUrl: r.thumbnail_url ?? undefined,
    featured: Boolean(r.is_featured),
  };
}

const BASE_SELECT = `
  SELECT p.id, p.title, p.subtitle, p.youtube_id, p.video_provider, p.video_url,
         p.thumbnail_url, p.video_type, p.is_featured, p.sort_order,
         c.name AS category_name
  FROM portfolio_items p
  JOIN categories c ON c.id = p.category_id
  WHERE p.is_active = 1`;

export type PortfolioResult = { projects: Project[]; error: boolean };

export async function getPortfolioProjects(): Promise<PortfolioResult> {
  if (!hasDbEnv()) return { projects: staticProjects, error: false };
  try {
    const rows = await query<Row>(`${BASE_SELECT} ORDER BY p.sort_order ASC`);
    return { projects: rows.map(rowToProject), error: false };
  } catch (e) {
    console.error("[portfolio] MySQL fetch failed:", e);
    return { projects: [], error: true };
  }
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const staticFeatured = staticProjects.filter((p) => p.featured);
  if (!hasDbEnv()) return staticFeatured;
  try {
    const rows = await query<Row>(
      `${BASE_SELECT} AND p.is_featured = 1 ORDER BY p.sort_order ASC`,
    );
    const mapped = rows.map(rowToProject);
    return mapped.length ? mapped : staticFeatured;
  } catch (e) {
    console.error("[portfolio] featured fetch failed:", e);
    return staticFeatured;
  }
}
