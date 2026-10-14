import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listDocuments } from "@/lib/billing-data";
import { hasDbEnv } from "@/lib/db";
import { type BillingDoc } from "@/lib/billing";
import { site } from "@/lib/data";
import { getSiteInfo } from "@/lib/content";
import { AdminShell } from "@/components/admin/AdminShell";
import { BillingManager, type BillingFrom } from "@/components/admin/BillingManager";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let docs: BillingDoc[] = [];
  try {
    docs = await listDocuments("invoice", "all");
  } catch {
    docs = [];
  }

  const info = await getSiteInfo().catch(() => null);
  const from: BillingFrom = {
    name: site.name,
    tagline: site.parent.relationship,
    email: info?.email ?? site.email,
    phone: info?.phone ?? site.phone,
    location: site.location,
  };

  return (
    <AdminShell email={session.email} active="invoices">
      <BillingManager
        kind="invoice"
        initial={docs}
        from={from}
        defaultCurrency="INR"
        storage={hasDbEnv() ? "server" : "local"}
      />
    </AdminShell>
  );
}
