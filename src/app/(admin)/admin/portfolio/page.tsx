import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";
import { DashboardClient } from "@/components/admin/DashboardClient";
import type { AdminCategory } from "@/components/admin/types";

export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const categories = await query<AdminCategory>(
    "SELECT id, name, slug FROM categories ORDER BY sort_order ASC",
  );

  return (
    <AdminShell email={session.email} active="portfolio">
      <DashboardClient categories={categories} />
    </AdminShell>
  );
}
