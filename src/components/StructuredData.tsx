import { editingCategories, site } from "@/lib/data";
import type { SiteInfo } from "@/lib/content";

/*
 * Site-wide JSON-LD structured data (Organization + WebSite), server-rendered
 * into the initial HTML per the seo-schema guidance (JSON-LD preferred, absolute
 * URLs, only truthful data). Rendered by the public (site) layout so it appears
 * on every public page. Helps Google/AI understand the brand entity.
 *
 * `info` is the CMS-resolved site details (email/phone) from the layout, so an
 * admin edit to those keeps the structured data accurate; it falls back to the
 * static defaults, so this never throws and stays fail-safe.
 *
 * Note: `sameAs` is intentionally omitted until the social profiles are live —
 * asserting profiles that don't exist yet would be untruthful markup. Re-add a
 * `sameAs: [...]` of confirmed-live URLs once the accounts are published.
 */
export function StructuredData({
  info,
  serviceCategories = editingCategories,
}: {
  info?: SiteInfo;
  // The services listed in the OfferCatalog — defaults to all, but the layout
  // passes only the categories currently visible on the site.
  serviceCategories?: readonly { name: string; description: string }[];
} = {}) {
  const email = info?.email ?? site.email;
  const telephone = info?.phoneHref ?? site.phoneHref;
  const graph = [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/loopmark.png`,
      description: site.description,
      email,
      contactPoint: {
        "@type": "ContactPoint",
        telephone,
        email,
        contactType: "customer service",
        areaServed: "Worldwide",
        availableLanguage: ["English"],
      },
      parentOrganization: {
        "@type": "Organization",
        name: site.parent.name,
        url: site.parent.url,
      },
      // The services actually offered (no prices — those are quoted per project).
      // Names/descriptions come straight from the editing-category taxonomy, so
      // this stays truthful and in sync with the rest of the site.
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Video Editing & Graphic Design Services",
        itemListElement: serviceCategories.map((c) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: c.name,
            description: c.description,
            serviceType: c.name,
            provider: { "@id": `${site.url}/#organization` },
          },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: site.url,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#organization` },
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
