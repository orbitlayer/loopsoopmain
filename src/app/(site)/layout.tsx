import { MotionProvider } from "@/components/providers/MotionProvider";
import { StructuredData } from "@/components/StructuredData";
import { MaintenanceScreen } from "@/components/MaintenanceScreen";
import { WhatsAppFloat } from "@/components/ui/WhatsAppFloat";
import { SkeletonLoader } from "@/components/studio/SkeletonLoader";
import { Grain } from "@/components/studio/Grain";
import { MenuNav } from "@/components/studio/MenuNav";
import { FooterNew } from "@/components/studio/FooterNew";
import { getSiteControls } from "@/lib/settings";
import { getVisibleCategories } from "@/lib/categories";
import { getSiteInfo } from "@/lib/content";
import { getSession } from "@/lib/auth";
import { site, whatsappLink } from "@/lib/data";

/*
 * Dark cinematic chrome for the redesigned home experience. Self-contained
 * route group so the rest of the site keeps its existing light chrome until it
 * is migrated. Rendered per-request so admin kill switches take effect.
 */
export const dynamic = "force-dynamic";

// Header nav — "About" intentionally omitted; it lives in the footer only.
const NAV = [
  { label: "Home", href: "/" },
  { label: "Our Work", href: "/our-work" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Contact", href: "/contact" },
];

// Footer keeps the full set, including About.
const FOOTER_NAV = [
  { label: "Home", href: "/" },
  { label: "Our Work", href: "/our-work" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const controls = await getSiteControls();
  const isAdmin = controls.maintenance ? Boolean(await getSession()) : false;
  if (controls.maintenance && !isAdmin) {
    return <MaintenanceScreen message={controls.maintenanceMessage} />;
  }

  const info = await getSiteInfo();
  const visibleCategories = await getVisibleCategories();
  const year = new Date().getFullYear();

  const socials = [
    { label: "Instagram", href: site.socials.instagram },
    { label: "YouTube", href: site.socials.youtube },
    { label: "LinkedIn", href: site.socials.linkedin },
    { label: "Discord", href: site.socials.discord },
  ];
  const services = visibleCategories
    .slice(0, 5)
    .map((c) => ({ label: c.name, href: `/portfolio?category=${c.slug}` }));

  return (
    <MotionProvider>
      <StructuredData info={info} serviceCategories={visibleCategories} />
      <div className="relative min-h-screen bg-[#f6f6f4] text-[#111111]">
        {/* Fixed backdrop so overscroll never flashes a different colour. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[#f6f6f4]"
        />
        {controls.maintenance && isAdmin && (
          <div className="fixed bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-black shadow-lg shadow-black/20">
            Maintenance mode is ON - only you can see the site
          </div>
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[#111111] focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <SkeletonLoader />
        <Grain />
        <MenuNav navItems={NAV} ctaHref="/contact" email={info.email} />

        <main id="main" className="relative">
          {children}
        </main>

        <FooterNew
          navItems={FOOTER_NAV}
          services={services}
          email={info.email}
          socials={socials}
          ctaHref="/contact"
          year={year}
        />

        {!controls.killContact && (
          <WhatsAppFloat href={whatsappLink(info.whatsapp)} />
        )}
      </div>
    </MotionProvider>
  );
}
