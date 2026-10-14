import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { listAuditLogs } from "@/lib/audit";
import { getSiteControls } from "@/lib/settings";
import { getInquiryStats } from "@/lib/inquiries";
import { AdminShell } from "@/components/admin/AdminShell";
import { Overview, type OverviewCounts } from "@/components/admin/Overview";

export const dynamic = "force-dynamic";

type CountRow = {
  total: number | string;
  active: number | string;
  featured: number | string;
  categories: number | string;
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let counts: OverviewCounts = { total: 0, active: 0, featured: 0, categories: 0 };
  try {
    const rows = await query<CountRow>(
      `SELECT
         (SELECT COUNT(*) FROM portfolio_items) AS total,
         (SELECT COUNT(*) FROM portfolio_items WHERE is_active = 1) AS active,
         (SELECT COUNT(*) FROM portfolio_items WHERE is_featured = 1) AS featured,
         (SELECT COUNT(*) FROM categories) AS categories`,
    );
    const r = rows[0];
    if (r) {
      counts = {
        total: Number(r.total),
        active: Number(r.active),
        featured: Number(r.featured),
        categories: Number(r.categories),
      };
    }
  } catch {
    // Leave zeroed counts if the DB is unreachable; the page still renders.
  }

  const recent = await listAuditLogs(6);
  const controls = await getSiteControls();
  const inbox = await getInquiryStats();

  return (
    <AdminShell email={session.email} active="dashboard">
      <Overview counts={counts} recent={recent} controls={controls} inbox={inbox} />
    </AdminShell>
  );
}
