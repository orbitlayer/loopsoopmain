import { ScrollText } from "lucide-react";
import type { AuditRow } from "@/lib/audit";

/*
 * Read-only audit log viewer. Normal admins cannot edit or delete entries here;
 * the log is append-only (writes happen server-side via logAudit()).
 */

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

export function ActivityTable({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-subtle text-muted">
          <ScrollText className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
            Activity
          </h1>
          <p className="text-sm text-faint">
            A read-only record of administrative actions.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line px-4 py-14 text-center">
          <p className="text-sm text-muted">No activity recorded yet</p>
          <p className="mt-1 text-xs text-faint">
            Sign-ins, content edits and deletions will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-sm text-ink">{r.summary ?? r.action}</p>
                  <span className="rounded bg-subtle px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wide text-muted">
                    {r.action}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-faint">
                  {r.actor_email ?? "Unknown"} · {when(r.created_at)}
                  {r.ip ? ` · ${r.ip}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
