import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSiteControls } from "@/lib/settings";
import { AdminShell } from "@/components/admin/AdminShell";
import { ControlsClient } from "@/components/admin/ControlsClient";

export const dynamic = "force-dynamic";

export default async function ControlsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const controls = await getSiteControls();

  return (
    <AdminShell email={session.email} active="controls">
      <ControlsClient initial={controls} />
    </AdminShell>
  );
}
