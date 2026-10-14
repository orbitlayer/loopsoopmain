import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAuditLogs } from "@/lib/audit";
import { AdminShell } from "@/components/admin/AdminShell";
import { ActivityTable } from "@/components/admin/ActivityTable";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const rows = await listAuditLogs(100);

  return (
    <AdminShell email={session.email} active="activity">
      <ActivityTable rows={rows} />
    </AdminShell>
  );
}
