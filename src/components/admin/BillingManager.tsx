"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Printer,
  X,
  CreditCard,
  ArrowRightLeft,
  FileCheck2,
  HardDrive,
  Download,
} from "lucide-react";
import {
  Button,
  SmallButton,
  IconButton,
  Field,
  TextInput,
  SelectInput,
} from "@/components/admin/ui";
import {
  type BillingDoc,
  type DocInput,
  type DocKind,
  type DocStatus,
  type LineItem,
  CURRENCIES,
  STATUS_LABELS,
  STATUS_TONE,
  statusesFor,
  computeTotals,
  formatMoney,
  lineAmount,
  amountDue,
} from "@/lib/billing";
import {
  useBillingStore,
  type BillingMode,
  type BillingStore,
} from "@/components/admin/useBillingStore";

export type BillingFrom = {
  name: string;
  tagline?: string;
  email: string;
  phone: string;
  location?: string;
};

type FormItem = { description: string; qty: string; rate: string };
type FormState = {
  id: string | null;
  number: string | null; // existing doc number (null while new → "Draft" in preview)
  status: DocStatus;
  amount_paid: number; // carried through so the live preview matches the saved doc
  client_name: string;
  client_company: string;
  client_email: string;
  client_phone: string;
  client_address: string;
  title: string;
  currency: string;
  doc_date: string;
  due_date: string;
  notes: string;
  tax_rate: string;
  discount: string;
  items: FormItem[];
};

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-subtle text-muted",
  info: "bg-blue-50 text-blue-700",
  good: "bg-emerald-50 text-emerald-700",
  warn: "bg-amber-50 text-amber-700",
  bad: "bg-red-50 text-red-600",
};

const today = () => new Date().toISOString().slice(0, 10);

function blankForm(currency: string): FormState {
  return {
    id: null,
    number: null,
    status: "draft",
    amount_paid: 0,
    client_name: "",
    client_company: "",
    client_email: "",
    client_phone: "",
    client_address: "",
    title: "",
    currency,
    doc_date: today(),
    due_date: "",
    notes: "",
    tax_rate: "0",
    discount: "0",
    items: [{ description: "", qty: "1", rate: "" }],
  };
}

function toForm(d: BillingDoc): FormState {
  return {
    id: d.id,
    number: d.number,
    status: d.status,
    amount_paid: d.amount_paid,
    client_name: d.client_name,
    client_company: d.client_company ?? "",
    client_email: d.client_email ?? "",
    client_phone: d.client_phone ?? "",
    client_address: d.client_address ?? "",
    title: d.title ?? "",
    currency: d.currency,
    doc_date: d.doc_date?.slice(0, 10) ?? today(),
    due_date: d.due_date?.slice(0, 10) ?? "",
    notes: d.notes ?? "",
    tax_rate: String(d.tax_rate ?? 0),
    discount: String(d.discount ?? 0),
    items: d.items.length
      ? d.items.map((it) => ({
          description: it.description,
          qty: String(it.qty),
          rate: String(it.rate),
        }))
      : [{ description: "", qty: "1", rate: "" }],
  };
}

function formItems(f: FormState): LineItem[] {
  return f.items.map((it) => ({
    description: it.description,
    qty: Number(it.qty) || 0,
    rate: Number(it.rate) || 0,
  }));
}

/**
 * Build a BillingDoc-shaped object from the live editor state, for the inline
 * preview and the "Export PDF" action. Totals are computed the same way the
 * data layer does, so the preview matches the saved document exactly. A new
 * (unsaved) document shows "Draft" as its number until it's saved.
 */
function formToDraft(f: FormState, kind: DocKind): BillingDoc {
  // Clamp + filter exactly as the save paths do (billing-local `sanitize` /
  // billing-actions `sanitizeInput`) so the preview, inline totals and exported
  // PDF match the document that will actually be saved — not raw/typo'd input.
  const items = formItems(f).filter((it) => it.description.trim() || it.qty || it.rate);
  const tax_rate = Math.max(0, Math.min(100, Number(f.tax_rate) || 0));
  const discount = Math.max(0, Math.min(1_000_000_000, Number(f.discount) || 0));
  const { subtotal, tax_amount, total } = computeTotals(items, tax_rate, discount);
  return {
    id: f.id ?? "draft",
    kind,
    number: f.number ?? "Draft",
    status: f.status,
    client_name: f.client_name.trim() || "—",
    client_email: f.client_email.trim() || null,
    client_phone: f.client_phone.trim() || null,
    client_company: f.client_company.trim() || null,
    client_address: f.client_address.trim() || null,
    title: f.title.trim() || null,
    currency: f.currency,
    items,
    tax_rate,
    discount,
    subtotal,
    tax_amount,
    total,
    amount_paid: f.amount_paid,
    doc_date: f.doc_date,
    due_date: f.due_date || null,
    notes: f.notes.trim() || null,
    source_id: null,
    created_at: "",
    updated_at: "",
  };
}

function Badge({ status }: { status: DocStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASS[STATUS_TONE[status]]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string,
  );

/** Build a standalone, print-ready HTML document and print it via an iframe. */
function printDoc(doc: BillingDoc, from: BillingFrom) {
  const kindLabel = doc.kind === "quotation" ? "Quotation" : "Invoice";
  const dueLabel = doc.kind === "quotation" ? "Valid until" : "Due date";
  const rows = doc.items
    .map(
      (it) => `<tr>
        <td>${esc(it.description)}</td>
        <td class="num">${it.qty}</td>
        <td class="num">${formatMoney(it.rate, doc.currency)}</td>
        <td class="num">${formatMoney(lineAmount(it), doc.currency)}</td>
      </tr>`,
    )
    .join("");
  const due = amountDue(doc);
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
  <title>${esc(kindLabel)} ${esc(doc.number)}</title>
  <style>
    *{box-sizing:border-box} body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;margin:0;padding:40px;font-size:13px;line-height:1.5}
    .wrap{max-width:760px;margin:0 auto}
    .top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:32px}
    .brand{font-size:22px;font-weight:700;letter-spacing:-0.02em}
    .muted{color:#6b6b6b} .faint{color:#8a8a85}
    h1{font-size:15px;text-transform:uppercase;letter-spacing:.18em;margin:0 0 4px;color:#8a8a85}
    .num{text-align:right;white-space:nowrap}
    .meta{text-align:right}
    .parties{display:flex;justify-content:space-between;gap:24px;margin:24px 0}
    .parties h2{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:#8a8a85;margin:0 0 6px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#8a8a85;border-bottom:1px solid #111;padding:8px 10px}
    th.num{text-align:right} td{padding:10px;border-bottom:1px solid #eaeaea;vertical-align:top}
    .totals{margin-left:auto;width:280px;margin-top:14px}
    .totals div{display:flex;justify-content:space-between;padding:5px 0}
    .totals .grand{border-top:1px solid #111;margin-top:6px;padding-top:10px;font-size:16px;font-weight:700}
    .notes{margin-top:28px;white-space:pre-wrap;color:#444;border-top:1px solid #eaeaea;padding-top:14px}
    @media print{body{padding:0}}
  </style></head><body><div class="wrap">
    <div class="top">
      <div>
        <div class="brand">${esc(from.name)}</div>
        ${from.tagline ? `<div class="faint">${esc(from.tagline)}</div>` : ""}
        <div class="muted" style="margin-top:8px">${esc(from.email)}<br/>${esc(from.phone)}${from.location ? `<br/>${esc(from.location)}` : ""}</div>
      </div>
      <div class="meta">
        <h1>${esc(kindLabel)}</h1>
        <div style="font-size:18px;font-weight:600">${esc(doc.number)}</div>
        <div class="muted" style="margin-top:10px">Date: ${esc(doc.doc_date)}</div>
        ${doc.due_date ? `<div class="muted">${dueLabel}: ${esc(doc.due_date)}</div>` : ""}
        <div class="muted">Status: ${esc(STATUS_LABELS[doc.status])}</div>
      </div>
    </div>
    <div class="parties">
      <div>
        <h2>Billed to</h2>
        <div style="font-weight:600">${esc(doc.client_name)}</div>
        ${doc.client_company ? `<div class="muted">${esc(doc.client_company)}</div>` : ""}
        ${doc.client_email ? `<div class="muted">${esc(doc.client_email)}</div>` : ""}
        ${doc.client_phone ? `<div class="muted">${esc(doc.client_phone)}</div>` : ""}
        ${doc.client_address ? `<div class="muted" style="white-space:pre-wrap">${esc(doc.client_address)}</div>` : ""}
      </div>
      ${doc.title ? `<div style="text-align:right"><h2>Project</h2><div>${esc(doc.title)}</div></div>` : ""}
    </div>
    <table>
      <thead><tr><th>Description</th><th class="num">Qty</th><th class="num">Rate</th><th class="num">Amount</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="faint">No line items.</td></tr>`}</tbody>
    </table>
    <div class="totals">
      <div><span class="muted">Subtotal</span><span>${formatMoney(doc.subtotal, doc.currency)}</span></div>
      ${doc.discount ? `<div><span class="muted">Discount</span><span>- ${formatMoney(doc.discount, doc.currency)}</span></div>` : ""}
      ${doc.tax_rate ? `<div><span class="muted">Tax (${doc.tax_rate}%)</span><span>${formatMoney(doc.tax_amount, doc.currency)}</span></div>` : ""}
      <div class="grand"><span>Total</span><span>${formatMoney(doc.total, doc.currency)}</span></div>
      ${doc.kind === "invoice" && doc.amount_paid ? `<div><span class="muted">Paid</span><span>${formatMoney(doc.amount_paid, doc.currency)}</span></div>` : ""}
      ${doc.kind === "invoice" && due > 0 ? `<div style="font-weight:600"><span>Amount due</span><span>${formatMoney(due, doc.currency)}</span></div>` : ""}
    </div>
    ${doc.notes ? `<div class="notes">${esc(doc.notes)}</div>` : ""}
  </div></body></html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);
  const idoc = iframe.contentWindow?.document;
  if (!idoc) {
    iframe.remove();
    return;
  }
  idoc.open();
  idoc.write(html);
  idoc.close();
  const win = iframe.contentWindow!;
  win.onafterprint = () => window.setTimeout(() => iframe.remove(), 300);
  window.setTimeout(() => {
    win.focus();
    win.print();
  }, 300);
}

export function BillingManager({
  kind,
  initial,
  from,
  defaultCurrency,
  storage = "server",
}: {
  kind: DocKind;
  initial: BillingDoc[];
  from: BillingFrom;
  defaultCurrency: string;
  storage?: BillingMode;
}) {
  const store = useBillingStore(kind, storage, initial);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<DocStatus | "all">("all");
  const [form, setForm] = useState<FormState | null>(null);
  const [preview, setPreview] = useState<BillingDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isQuote = kind === "quotation";
  const noun = isQuote ? "quotation" : "invoice";
  const Title = isQuote ? "Quotations" : "Invoices";
  const dueLabel = isQuote ? "Valid until" : "Due date";

  const all = store.docs;
  const docs = useMemo(
    () => (filter === "all" ? all : all.filter((d) => d.status === filter)),
    [all, filter],
  );

  const summary = useMemo(() => {
    const total = all.reduce((s, d) => s + d.total, 0);
    const outstanding = all
      .filter((d) => !["void", "declined", "paid", "expired"].includes(d.status))
      .reduce((s, d) => s + amountDue(d), 0);
    return { count: all.length, total, outstanding };
  }, [all]);

  const draft = form ? formToDraft(form, kind) : null;

  function run(fn: () => Promise<{ ok?: true; error?: string } | { ok: true }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      after?.();
      store.reload();
    });
  }

  function save() {
    if (!form) return;
    if (!form.client_name.trim()) {
      setError("Please enter a client name.");
      return;
    }
    const input: Partial<DocInput> = {
      client_name: form.client_name,
      client_company: form.client_company,
      client_email: form.client_email,
      client_phone: form.client_phone,
      client_address: form.client_address,
      title: form.title,
      currency: form.currency,
      items: formItems(form),
      tax_rate: Number(form.tax_rate) || 0,
      discount: Number(form.discount) || 0,
      doc_date: form.doc_date,
      due_date: form.due_date || null,
      notes: form.notes,
    };
    run(
      () =>
        form.id
          ? store.update(form.id, input)
          : store.create(input),
      () => setForm(null),
    );
  }

  function updateItem(i: number, patch: Partial<FormItem>) {
    setForm((f) =>
      f ? { ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) } : f,
    );
  }
  function addItem() {
    setForm((f) => (f ? { ...f, items: [...f.items, { description: "", qty: "1", rate: "" }] } : f));
  }
  function removeItem(i: number) {
    setForm((f) =>
      f ? { ...f, items: f.items.length > 1 ? f.items.filter((_, idx) => idx !== i) : f.items } : f,
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink">
            {Title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isQuote
              ? "Draft, send and track estimates. Convert an accepted quote into an invoice."
              : "Issue invoices, record payments and track what's outstanding."}
          </p>
        </div>
        <Button
          onClick={() => {
            setError(null);
            setForm(blankForm(defaultCurrency));
          }}
        >
          <Plus className="h-4 w-4" /> New {noun}
        </Button>
      </div>

      {/* Local / demo storage notice */}
      {store.mode === "local" ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-subtle/60 px-4 py-3 text-sm">
          <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-faint" strokeWidth={1.75} />
          <p className="text-muted">
            <span className="font-medium text-ink">Preview storage.</span> No database is
            connected yet, so {noun}s are saved in this browser only. They persist on this
            device but won&apos;t sync elsewhere — connect hosting to store them for real.
          </p>
        </div>
      ) : null}

      {/* Summary */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={`Total ${noun}s`} value={String(summary.count)} />
        <Stat label="Total value" value={formatMoney(summary.total, defaultCurrency)} />
        <Stat
          label={isQuote ? "Open value" : "Outstanding"}
          value={formatMoney(summary.outstanding, defaultCurrency)}
        />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", ...statusesFor(kind)] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "border-ink bg-ink text-white"
                : "border-line text-muted hover:border-ink/30 hover:text-ink"
            }`}
          >
            {s === "all" ? "All" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {docs.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-faint">
            No {noun}s yet. Create your first one with “New {noun}”.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="hidden sm:table-header-group">
              <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-faint">
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr
                  key={d.id}
                  className="block border-b border-line last:border-0 sm:table-row"
                >
                  <td className="px-4 pt-4 font-medium text-ink sm:py-3">
                    <button
                      type="button"
                      onClick={() => setPreview(d)}
                      className="underline-offset-2 hover:underline"
                    >
                      {d.number}
                    </button>
                  </td>
                  <td className="px-4 py-1 sm:py-3">
                    <span className="text-ink">{d.client_name}</span>
                    {d.title ? (
                      <span className="block text-xs text-faint">{d.title}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-1 text-muted sm:py-3">{d.doc_date}</td>
                  <td className="px-4 py-1 text-ink sm:py-3 sm:text-right">
                    {formatMoney(d.total, d.currency)}
                    {d.kind === "invoice" && amountDue(d) > 0 && d.amount_paid > 0 ? (
                      <span className="block text-xs text-amber-600">
                        {formatMoney(amountDue(d), d.currency)} due
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-1 sm:py-3">
                    <Badge status={d.status} />
                  </td>
                  <td className="flex gap-1 px-3 pb-4 pt-1 sm:table-cell sm:py-2 sm:text-right">
                    <IconButton label="Preview" onClick={() => setPreview(d)}>
                      <Eye className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Edit"
                      onClick={() => {
                        setError(null);
                        setForm(toForm(d));
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </IconButton>
                    <IconButton label="Export PDF" onClick={() => printDoc(d, from)}>
                      <Printer className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Delete"
                      danger
                      onClick={() => {
                        if (confirm(`Delete ${d.number}? This cannot be undone.`)) {
                          run(() => store.remove(d.id));
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {error && !form && !preview ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}

      {/* -------------------------------------------------------- Editor drawer */}
      {form ? (
        <Overlay title={form.id ? `Edit ${noun}` : `New ${noun}`} onClose={() => setForm(null)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client name" className="sm:col-span-2">
              <TextInput
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                placeholder="Acme Studios"
              />
            </Field>
            <Field label="Company (optional)">
              <TextInput
                value={form.client_company}
                onChange={(e) => setForm({ ...form, client_company: e.target.value })}
              />
            </Field>
            <Field label="Email (optional)">
              <TextInput
                type="email"
                value={form.client_email}
                onChange={(e) => setForm({ ...form, client_email: e.target.value })}
              />
            </Field>
            <Field label="Phone (optional)">
              <TextInput
                value={form.client_phone}
                onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
              />
            </Field>
            <Field label="Project / subject (optional)">
              <TextInput
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Billing address (optional)" className="sm:col-span-2">
              <textarea
                rows={2}
                value={form.client_address}
                onChange={(e) => setForm({ ...form, client_address: e.target.value })}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
              />
            </Field>

            <Field label="Currency">
              <SelectInput
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={isQuote ? "Quote date" : "Issue date"}>
              <TextInput
                type="date"
                value={form.doc_date}
                onChange={(e) => setForm({ ...form, doc_date: e.target.value })}
              />
            </Field>
            <Field label={dueLabel}>
              <TextInput
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </Field>
          </div>

          {/* Line items */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Line items</span>
              <SmallButton variant="ghost" onClick={addItem}>
                <Plus className="h-3.5 w-3.5" /> Add item
              </SmallButton>
            </div>
            <div className="space-y-2.5">
              {form.items.map((it, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-subtle/40 p-2.5 sm:flex-nowrap sm:border-0 sm:bg-transparent sm:p-0"
                >
                  {/* Description — own line on phones, grows inline on wider screens */}
                  <div className="order-1 min-w-0 flex-[1_1_100%] sm:flex-1">
                    <TextInput
                      value={it.description}
                      onChange={(e) => updateItem(i, { description: e.target.value })}
                      placeholder="Description"
                    />
                  </div>
                  <div className="order-2 w-14 shrink-0 sm:w-16">
                    <TextInput
                      type="number"
                      inputMode="decimal"
                      value={it.qty}
                      onChange={(e) => updateItem(i, { qty: e.target.value })}
                      placeholder="Qty"
                      className="text-right"
                      aria-label="Quantity"
                    />
                  </div>
                  <div className="order-3 w-16 shrink-0 sm:w-28">
                    <TextInput
                      type="number"
                      inputMode="decimal"
                      value={it.rate}
                      onChange={(e) => updateItem(i, { rate: e.target.value })}
                      placeholder="Rate"
                      className="text-right"
                      aria-label="Rate"
                    />
                  </div>
                  {/* Amount + remove grouped so the ✕ can't detach when the row wraps */}
                  <div className="order-4 ml-auto flex shrink-0 items-center gap-2 sm:ml-0">
                    <span className="whitespace-nowrap text-right text-sm tabular-nums text-muted sm:w-24">
                      {formatMoney(
                        (Number(it.qty) || 0) * (Number(it.rate) || 0),
                        form.currency,
                      )}
                    </span>
                    <IconButton className="shrink-0" label="Remove item" onClick={() => removeItem(i)}>
                      <X className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax / discount / totals */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Discount">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </Field>
              <Field label="Tax rate (%)">
                <TextInput
                  type="number"
                  inputMode="decimal"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })}
                />
              </Field>
            </div>
            {draft ? (
              <div className="rounded-xl border border-line bg-subtle/60 p-4 text-sm">
                <Row label="Subtotal" value={formatMoney(draft.subtotal, draft.currency)} />
                {draft.discount ? (
                  <Row label="Discount" value={`- ${formatMoney(draft.discount, draft.currency)}`} />
                ) : null}
                {draft.tax_rate ? (
                  <Row label={`Tax (${draft.tax_rate}%)`} value={formatMoney(draft.tax_amount, draft.currency)} />
                ) : null}
                <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-base font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatMoney(draft.total, draft.currency)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <Field label="Notes / terms (optional)" className="mt-4">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Payment terms, bank details, thank-you note…"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
            />
          </Field>

          {/* Live preview — updates as any field above changes */}
          {draft ? (
            <div className="mt-8 border-t border-line pt-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-medium text-muted">Live preview</span>
                  <p className="text-[0.7rem] text-faint">
                    Updates as you edit · this is how the {noun} will look.
                  </p>
                </div>
                <SmallButton variant="ghost" onClick={() => printDoc(draft, from)}>
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </SmallButton>
              </div>
              <DocPreview doc={draft} from={from} />
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
            <SmallButton
              variant="ghost"
              className="mr-auto"
              onClick={() => draft && printDoc(draft, from)}
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </SmallButton>
            <Button variant="ghost" onClick={() => setForm(null)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={save} disabled={pending}>
              {pending ? "Saving…" : form.id ? "Save changes" : `Create ${noun}`}
            </Button>
          </div>
        </Overlay>
      ) : null}

      {/* ------------------------------------------------------- Preview drawer */}
      {preview ? (
        <Overlay
          title={`${preview.number}`}
          onClose={() => setPreview(null)}
          badge={<Badge status={preview.status} />}
        >
          <DocPreview doc={preview} from={from} />

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {/* Actions */}
          <div className="mt-6 space-y-4 border-t border-line pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted">Status</span>
              <SelectInput
                value={preview.status}
                onChange={(e) =>
                  run(
                    () => store.setStatus(preview.id, e.target.value),
                    () => setPreview({ ...preview, status: e.target.value as DocStatus }),
                  )
                }
                className="h-9 w-auto min-w-[9rem] text-xs"
              >
                {statusesFor(kind).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </SelectInput>
            </div>

            {kind === "invoice" ? <PaymentBox doc={preview} run={run} store={store} /> : null}

            <div className="flex flex-wrap gap-2">
              <SmallButton variant="ghost" onClick={() => printDoc(preview, from)}>
                <Download className="h-3.5 w-3.5" /> Export PDF
              </SmallButton>
              <SmallButton
                variant="ghost"
                onClick={() => {
                  const d = preview;
                  setPreview(null);
                  setForm(toForm(d));
                }}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </SmallButton>
              {isQuote ? (
                <SmallButton
                  onClick={() =>
                    run(
                      () => store.convert(preview.id),
                      () => setPreview(null),
                    )
                  }
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Convert to invoice
                </SmallButton>
              ) : null}
            </div>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-faint">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-muted">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

function PaymentBox({
  doc,
  run,
  store,
}: {
  doc: BillingDoc;
  run: (fn: () => Promise<{ ok?: true; error?: string } | { ok: true }>, after?: () => void) => void;
  store: BillingStore;
}) {
  const [amt, setAmt] = useState("");
  const due = amountDue(doc);
  return (
    <div className="rounded-xl border border-line bg-subtle/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted">
          Paid <span className="text-ink">{formatMoney(doc.amount_paid, doc.currency)}</span> of{" "}
          {formatMoney(doc.total, doc.currency)}
        </span>
        <span className="font-medium text-ink">{formatMoney(due, doc.currency)} due</span>
      </div>
      {due > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          <TextInput
            type="number"
            inputMode="decimal"
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            placeholder={`Amount (max ${due})`}
            className="h-9 flex-1"
            aria-label="Payment amount"
          />
          <SmallButton
            onClick={() => {
              const v = Number(amt);
              if (v > 0) run(() => store.recordPay(doc.id, v));
            }}
          >
            <CreditCard className="h-3.5 w-3.5" /> Record payment
          </SmallButton>
          <SmallButton variant="ghost" onClick={() => run(() => store.recordPay(doc.id, due))}>
            <FileCheck2 className="h-3.5 w-3.5" /> Mark paid
          </SmallButton>
        </div>
      ) : null}
    </div>
  );
}

function DocPreview({ doc, from }: { doc: BillingDoc; from: BillingFrom }) {
  const due = amountDue(doc);
  const dueLabel = doc.kind === "quotation" ? "Valid until" : "Due date";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-lg font-semibold text-ink">{from.name}</p>
          {from.tagline ? <p className="text-xs text-faint">{from.tagline}</p> : null}
          <p className="mt-2 text-xs text-muted">
            {from.email}
            <br />
            {from.phone}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-faint">
            {doc.kind === "quotation" ? "Quotation" : "Invoice"}
          </p>
          <p className="text-base font-semibold text-ink">{doc.number}</p>
          <p className="mt-1 text-xs text-muted">Date: {doc.doc_date}</p>
          {doc.due_date ? (
            <p className="text-xs text-muted">
              {dueLabel}: {doc.due_date}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-faint">Billed to</p>
        <p className="mt-1 font-medium text-ink">{doc.client_name}</p>
        {doc.client_company ? <p className="text-muted">{doc.client_company}</p> : null}
        {doc.client_email ? <p className="text-muted">{doc.client_email}</p> : null}
        {doc.client_phone ? <p className="text-muted">{doc.client_phone}</p> : null}
        {doc.title ? <p className="mt-2 text-xs text-faint">Project: {doc.title}</p> : null}
      </div>

      <div className="mt-4 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-ink/70 text-left text-[0.65rem] uppercase tracking-[0.1em] text-faint">
            <th className="py-2 pr-2 font-medium">Description</th>
            <th className="py-2 pl-3 text-right font-medium">Qty</th>
            <th className="py-2 pl-3 text-right font-medium">Rate</th>
            <th className="py-2 pl-3 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.length ? (
            doc.items.map((it, i) => (
              <tr key={i} className="border-b border-line">
                <td className="py-2 pr-2 text-ink">{it.description}</td>
                <td className="whitespace-nowrap py-2 pl-3 text-right tabular-nums text-muted">{it.qty}</td>
                <td className="whitespace-nowrap py-2 pl-3 text-right tabular-nums text-muted">{formatMoney(it.rate, doc.currency)}</td>
                <td className="whitespace-nowrap py-2 pl-3 text-right tabular-nums text-ink">{formatMoney(lineAmount(it), doc.currency)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-3 text-faint">
                No line items.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      <div className="ml-auto mt-3 w-full max-w-[16rem]">
        <Row label="Subtotal" value={formatMoney(doc.subtotal, doc.currency)} />
        {doc.discount ? <Row label="Discount" value={`- ${formatMoney(doc.discount, doc.currency)}`} /> : null}
        {doc.tax_rate ? <Row label={`Tax (${doc.tax_rate}%)`} value={formatMoney(doc.tax_amount, doc.currency)} /> : null}
        <div className="mt-1 flex items-center justify-between border-t border-ink/70 pt-2 text-base font-semibold text-ink">
          <span>Total</span>
          <span>{formatMoney(doc.total, doc.currency)}</span>
        </div>
        {doc.kind === "invoice" && doc.amount_paid ? (
          <Row label="Paid" value={formatMoney(doc.amount_paid, doc.currency)} />
        ) : null}
        {doc.kind === "invoice" && due > 0 ? (
          <div className="flex items-center justify-between py-0.5 font-medium text-ink">
            <span>Amount due</span>
            <span>{formatMoney(due, doc.currency)}</span>
          </div>
        ) : null}
      </div>

      {doc.notes ? (
        <p className="mt-4 whitespace-pre-wrap border-t border-line pt-3 text-xs text-muted">
          {doc.notes}
        </p>
      ) : null}
    </div>
  );
}

function Overlay({
  title,
  badge,
  onClose,
  wide,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-bg shadow-2xl ${
          wide ? "max-w-2xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {badge}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
