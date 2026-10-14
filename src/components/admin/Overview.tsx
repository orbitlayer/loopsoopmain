import Link from "next/link";
import {
  Film,
  Eye,
  EyeOff,
  Star,
  Clapperboard,
  ScrollText,
  SlidersHorizontal,
  Inbox,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { site } from "@/lib/data";
import type { AuditRow } from "@/lib/audit";
import type { SiteControls } from "@/lib/settings";

/*
 * Admin overview (Dashboard). Read-only, server-rendered summary of the site's
 * content plus recent administrative activity. Actionable > decorative.
 */

export type OverviewCounts = {
  total: number;
  active: number;
  featured: number;
  categories: number;
};

function when(value: string | Date): string {
  try {
    const d =
      value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return String(value);
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <Icon className="h-4 w-4 text-faint" strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-display text-3xl font-medium tracking-[-0.02em] text-ink">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  external,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  external?: boolean;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-muted">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="block truncate text-xs text-faint">{desc}</span>
      </span>
      {external ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-faint" />
      ) : (
        <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );
  const cls =
    "group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 outline-none transition-colors hover:border-ink/20 hover:bg-subtle focus-visible:ring-2 focus-visible:ring-ink/20";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}

export function Overview({
  counts,
  recent,
  controls,
  inbox,
}: {
  counts: OverviewCounts;
  recent: AuditRow[];
  controls: SiteControls;
  inbox: { total: number; unread: number; fresh: number };
}) {
  const hidden = Math.max(0, counts.total - counts.active);
  const stats = [
    { label: "Total videos", value: counts.total, icon: Film },
    { label: "Live", value: counts.active, icon: Eye },
    { label: "Hidden", value: hidden, icon: EyeOff },
    { label: "Featured", value: counts.featured, icon: Star },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
        Dashboard
      </h1>
      <p className="mt-1 text-sm text-faint">
        Overview of your website content and recent activity.
      </p>

      {(controls.maintenance || controls.killContact) && (
        <div className="mt-6 space-y-2">
          {controls.maintenance && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                Maintenance mode is ON - the public site is offline to visitors.
              </span>
              <Link href="/admin/controls" className="shrink-0 font-medium underline">
                Manage
              </Link>
            </div>
          )}
          {controls.killContact && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="flex-1">
                Public contact (WhatsApp) is currently disabled.
              </span>
              <Link href="/admin/controls" className="shrink-0 font-medium underline">
                Manage
              </Link>
            </div>
          )}
        </div>
      )}

      {inbox.unread > 0 && (
        <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-line bg-subtle px-4 py-2.5 text-sm text-ink">
          <Inbox className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {inbox.unread} unread {inbox.unread === 1 ? "inquiry" : "inquiries"}.
          </span>
          <Link href="/admin/inquiries" className="shrink-0 font-medium underline">
            View
          </Link>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent activity</h2>
            <Link
              href="/admin/activity"
              className="text-xs text-muted transition-colors hover:text-ink"
            >
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center">
              <p className="text-sm text-muted">No recent activity</p>
              <p className="mt-1 text-xs text-faint">
                Sign-ins, edits and deletions will appear here.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li
                  key={r.id}
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">
                      {r.summary ?? r.action}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-faint">
                      {r.actor_email ?? "Unknown"} · {when(r.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Quick actions</h2>
          <div className="space-y-2">
            <QuickLink
              href="/admin/inquiries"
              icon={Inbox}
              title="Inquiries"
              desc={
                inbox.unread > 0
                  ? `${inbox.unread} unread of ${inbox.total}`
                  : `${inbox.total} total`
              }
            />
            <QuickLink
              href="/admin/portfolio"
              icon={Clapperboard}
              title="Manage portfolio"
              desc="Add, edit and reorder videos"
            />
            <QuickLink
              href="/admin/controls"
              icon={SlidersHorizontal}
              title="Site controls"
              desc="Maintenance mode & kill switches"
            />
            <QuickLink
              href="/admin/activity"
              icon={ScrollText}
              title="Activity log"
              desc="Review admin actions"
            />
            <QuickLink
              href={site.url}
              external
              icon={ExternalLink}
              title="View live site"
              desc={site.domain}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
