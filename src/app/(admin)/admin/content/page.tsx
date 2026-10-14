import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { getSession } from "@/lib/auth";
import {
  getContactCopyForEdit,
  getFaqsForEdit,
  getSiteDetailsForEdit,
} from "@/lib/content";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function ContentHubPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [copy, faqs, siteDetails] = await Promise.all([
    getContactCopyForEdit(),
    getFaqsForEdit(),
    getSiteDetailsForEdit(),
  ]);

  const pages = [
    {
      key: "contact",
      title: "Contact page",
      desc: "Hero subtitle, quote section text and FAQs.",
      href: "/admin/content/contact",
      hasDraft: copy.hasDraft || faqs.hasDraft,
    },
    {
      key: "site",
      title: "Site details",
      desc: "Email, WhatsApp number, phone and hours.",
      href: "/admin/content/site",
      hasDraft: siteDetails.hasDraft,
    },
  ];

  return (
    <AdminShell email={session.email} active="content">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
          Content
        </h1>
        <p className="mt-1 text-sm text-faint">
          Edit the website&apos;s text content. More pages appear here as they
          are made editable.
        </p>

        <div className="mt-8 space-y-2">
          {pages.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 outline-none transition-colors hover:border-ink/20 hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-muted">
                <FileText className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{p.title}</span>
                  {p.hasDraft && (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-500/30">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-xs text-faint">{p.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
