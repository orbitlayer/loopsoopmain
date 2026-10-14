import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listInquiries, type Inquiry } from "@/lib/inquiries";
import { AdminShell } from "@/components/admin/AdminShell";
import { InquiriesClient } from "@/components/admin/InquiriesClient";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let inquiries: Inquiry[] = [];
  try {
    inquiries = await listInquiries("all");
  } catch {
    // Table not migrated yet — show an empty inbox rather than erroring.
    inquiries = [];
  }

  return (
    <AdminShell email={session.email} active="inquiries">
      <InquiriesClient initial={inquiries} />
    </AdminShell>
  );
}
