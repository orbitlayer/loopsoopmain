import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SEO_PAGES, getSeo } from "@/lib/content";
import { site } from "@/lib/data";
import { AdminShell } from "@/components/admin/AdminShell";
import { SeoClient } from "@/components/admin/SeoClient";

export const dynamic = "force-dynamic";

export default async function SeoPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const pages = await Promise.all(
    SEO_PAGES.map(async (p) => ({
      key: p.key,
      label: p.label,
      path: p.path,
      defaultTitle: p.defaultTitle,
      defaultDescription: p.defaultDescription,
      seo: await getSeo(p.key),
    })),
  );

  return (
    <AdminShell email={session.email} active="seo">
      <SeoClient pages={pages} baseUrl={site.url} />
    </AdminShell>
  );
}
