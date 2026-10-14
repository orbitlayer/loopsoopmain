import { site } from "@/lib/data";

/*
 * Per-page JSON-LD: a typed WebPage node (WebPage / AboutPage / ContactPage)
 * wired to the site-wide WebSite entity, plus a BreadcrumbList (the one
 * breadcrumb rich-result type Google still supports). Server-rendered into the
 * initial HTML, absolute URLs only, and driven entirely by static in-repo data
 * so it can never throw. Mirrors the site-wide <StructuredData> pattern.
 */

type Crumb = { name: string; path: string }; // path "" = home

type PageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage";

export function PageStructuredData({
  type = "WebPage",
  name,
  description,
  path,
  crumbs,
}: {
  type?: PageType;
  name: string;
  description?: string;
  path: string; // e.g. "/about"
  crumbs: Crumb[];
}) {
  const url = `${site.url}${path}`;
  const graph = [
    {
      "@type": type,
      "@id": `${url}#webpage`,
      url,
      name,
      ...(description ? { description } : {}),
      isPartOf: { "@id": `${site.url}/#website` },
      breadcrumb: { "@id": `${url}#breadcrumb` },
      inLanguage: "en",
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        item: `${site.url}${c.path}`,
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
