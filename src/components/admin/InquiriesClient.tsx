"use client";

import { useMemo, useState } from "react";
import { Search, X, Trash2, Mail, Inbox } from "lucide-react";
import {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/inquiry-status";
import {
  setInquiryStatusAction,
  saveInquiryNotesAction,
  setInquiryReadAction,
  deleteInquiryAction,
} from "@/lib/inquiries-actions";
import { Button, IconButton, SelectInput } from "./ui";

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

function StatusBadge({ status }: { status: InquiryStatus }) {
  const prominent = status === "new";
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] ${
        prominent
          ? "bg-ink text-white"
          : "bg-subtle text-muted ring-1 ring-line"
      }`}
    >
      {INQUIRY_STATUS_LABELS[status]}
    </span>
  );
}

export function InquiriesClient({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState<Inquiry[]>(initial);
  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const q = search.trim().toLowerCase();
  const list = useMemo(
    () =>
      items.filter((i) => {
        if (filter !== "all" && i.status !== filter) return false;
        if (!q) return true;
        return (
          i.name.toLowerCase().includes(q) ||
          i.email.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q)
        );
      }),
    [items, filter, q],
  );

  function patch(id: string, fields: Partial<Inquiry>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...fields } : i)));
    setSelected((s) => (s && s.id === id ? { ...s, ...fields } : s));
  }

  async function open(item: Inquiry) {
    setError(null);
    setConfirmDelete(false);
    setNotesDraft(item.notes ?? "");
    setSelected(item);
    if (!item.is_read) {
      patch(item.id, { is_read: true });
      setInquiryReadAction(item.id, true).catch(() => {});
    }
  }

  async function changeStatus(status: InquiryStatus) {
    if (!selected) return;
    setError(null);
    setPending(true);
    try {
      const res = await setInquiryStatusAction(selected.id, status);
      if ("error" in res) return setError(res.error);
      patch(selected.id, { status });
    } catch {
      setError("Could not update. Your session may have expired.");
    } finally {
      setPending(false);
    }
  }

  async function saveNotes() {
    if (!selected) return;
    setError(null);
    setPending(true);
    try {
      const res = await saveInquiryNotesAction(selected.id, notesDraft);
      if ("error" in res) return setError(res.error);
      patch(selected.id, { notes: notesDraft });
    } catch {
      setError("Could not save. Your session may have expired.");
    } finally {
      setPending(false);
    }
  }

  async function markUnread() {
    if (!selected) return;
    patch(selected.id, { is_read: false });
    setInquiryReadAction(selected.id, false).catch(() => {});
    setSelected(null);
  }

  async function remove() {
    if (!selected) return;
    setError(null);
    setPending(true);
    try {
      const res = await deleteInquiryAction(selected.id);
      if ("error" in res) return setError(res.error);
      setItems((prev) => prev.filter((i) => i.id !== selected.id));
      setSelected(null);
      setConfirmDelete(false);
    } catch {
      setError("Could not delete. Your session may have expired.");
    } finally {
      setPending(false);
    }
  }

  const unread = items.filter((i) => !i.is_read).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-subtle text-muted">
          <Inbox className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
            Inquiries
          </h1>
          <p className="text-sm text-faint">
            {items.length} total{unread > 0 ? ` · ${unread} unread` : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(["all", ...INQUIRY_STATUSES] as const).map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "border border-line text-muted hover:text-ink"
                }`}
              >
                {s === "all" ? "All" : INQUIRY_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inquiries…"
            aria-label="Search inquiries"
            className="h-10 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          />
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line px-4 py-14 text-center">
          <p className="text-sm text-muted">No inquiries</p>
          <p className="mt-1 text-xs text-faint">
            Messages from the contact form appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {list.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => open(i)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                  i.is_read
                    ? "border-line bg-surface hover:border-ink/20 hover:bg-subtle"
                    : "border-line bg-subtle hover:border-ink/25"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${i.is_read ? "bg-transparent" : "bg-ink"}`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`truncate text-sm ${i.is_read ? "text-ink" : "font-semibold text-ink"}`}>
                      {i.name}
                    </span>
                    <StatusBadge status={i.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-faint">
                    {i.email}
                    {i.project_type ? ` · ${i.project_type}` : ""} · {when(i.created_at)}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted">{i.message}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="my-8 w-full max-w-lg rounded-[20px] border border-line bg-surface p-6 shadow-2xl shadow-black/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-medium tracking-[-0.02em] text-ink">
                  {selected.name}
                </h2>
                <p className="mt-0.5 text-xs text-faint">{when(selected.created_at)}</p>
              </div>
              <IconButton label="Close" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </IconButton>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-1.5 text-ink underline-offset-4 hover:underline"
              >
                <Mail className="h-3.5 w-3.5" /> {selected.email}
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`} className="text-muted hover:text-ink">
                  {selected.phone}
                </a>
              )}
              {selected.project_type && (
                <span className="text-muted">{selected.project_type}</span>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-line bg-subtle p-3.5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
                {selected.message}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Status</span>
                <SelectInput
                  value={selected.status}
                  disabled={pending}
                  onChange={(e) => changeStatus(e.target.value as InquiryStatus)}
                >
                  {INQUIRY_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {INQUIRY_STATUS_LABELS[s]}
                    </option>
                  ))}
                </SelectInput>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={markUnread}
                  className="text-sm text-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Mark as unread
                </button>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Internal notes
              </span>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={3}
                placeholder="Add a private note…"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
              />
            </label>

            {error && (
              <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Delete permanently?</span>
                  <Button variant="danger" onClick={remove} disabled={pending}>
                    {pending ? "…" : "Delete"}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={pending}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-sm text-faint transition-colors hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              )}
              <Button onClick={saveNotes} disabled={pending}>
                {pending ? "Saving…" : "Save notes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
