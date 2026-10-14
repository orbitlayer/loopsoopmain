import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSiteDetailsForEdit } from "@/lib/content";
import { AdminShell } from "@/components/admin/AdminShell";
import { SiteDetailsEditor } from "@/components/admin/SiteDetailsEditor";

export const dynamic = "force-dynamic";

export default async function SiteDetailsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const details = await getSiteDetailsForEdit();
  const pick = (d: typeof details.draft) => ({
    email: d.email,
    whatsapp: d.whatsapp,
    phone: d.phone,
    hours: d.hours,
  });

  return (
    <AdminShell email={session.email} active="content">
      <SiteDetailsEditor
        draft={pick(details.draft)}
        published={pick(details.published)}
        updatedBy={details.updatedBy}
      />
    </AdminShell>
  );
}
