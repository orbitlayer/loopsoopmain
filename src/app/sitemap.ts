import type { MetadataRoute } from "next";
import { site } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/our-work", priority: 0.8 },
    { path: "/portfolio", priority: 0.8 },
    { path: "/about", priority: 0.8 },
    { path: "/contact", priority: 0.8 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];
  // A fixed date, not new Date(): the (site) group is force-dynamic, so a
  // per-request timestamp would stamp every URL with the crawl time and Google
  // treats such uniform, always-changing <lastmod> values as noise. Bump this
  // when the site's content meaningfully changes.
  const lastModified = "2026-09-05";
  return routes.map(({ path, priority }) => ({
    url: `${site.url}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
