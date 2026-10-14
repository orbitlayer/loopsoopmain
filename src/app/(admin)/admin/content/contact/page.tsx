import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getContactCopyForEdit, getFaqsForEdit } from "@/lib/content";
import { AdminShell } from "@/components/admin/AdminShell";
import { ContactEditor } from "@/components/admin/ContactEditor";

export const dynamic = "force-dynamic";

export default async function ContactContentPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [copy, faqs] = await Promise.all([
    getContactCopyForEdit(),
    getFaqsForEdit(),
  ]);

  return (
    <AdminShell email={session.email} active="content">
      <ContactEditor
        copy={copy.draft}
        publishedCopy={copy.published}
        faqs={faqs.draft}
        publishedFaqs={faqs.published}
        updatedBy={copy.updatedBy ?? faqs.updatedBy}
      />
    </AdminShell>
  );
}
