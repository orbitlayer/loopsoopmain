/*
 * Billing — shared types + pure helpers for quotations and invoices.
 *
 * This module is framework/DB-agnostic (NO "server-only", NO db import) so both
 * the admin client components and the server data layer can share the money
 * maths, status vocabulary and formatting. The DB access lives in
 * ./billing-data (server-only); the server actions live in ./billing-actions.
 *
 * A quotation and an invoice are the same shape of document (a client, a list of
 * line items, totals, a status) stored in one `billing_documents` table with a
 * `kind` discriminator — only the status vocabulary and the date labels differ.
 */

export type DocKind = "quotation" | "invoice";

export type LineItem = {
  description: string;
  qty: number;
  rate: number;
};

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
] as const;

export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "partial",
  "paid",
  "overdue",
  "void",
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type DocStatus = QuotationStatus | InvoiceStatus;

export function statusesFor(kind: DocKind): readonly DocStatus[] {
  return kind === "quotation" ? QUOTATION_STATUSES : INVOICE_STATUSES;
}

export function isStatusFor(kind: DocKind, s: string): s is DocStatus {
  return (statusesFor(kind) as readonly string[]).includes(s);
}

export const STATUS_LABELS: Record<DocStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  partial: "Part-paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

/** Subtle badge tone per status (keys map to classes in the manager). */
export const STATUS_TONE: Record<DocStatus, "neutral" | "info" | "good" | "warn" | "bad"> = {
  draft: "neutral",
  sent: "info",
  accepted: "good",
  paid: "good",
  partial: "warn",
  expired: "warn",
  overdue: "bad",
  declined: "bad",
  void: "bad",
};

export type BillingDoc = {
  id: string;
  kind: DocKind;
  number: string;
  status: DocStatus;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_company: string | null;
  client_address: string | null;
  title: string | null;
  currency: string;
  items: LineItem[];
  tax_rate: number; // percent
  discount: number; // flat amount, in `currency`
  subtotal: number;
  tax_amount: number;
  total: number;
  amount_paid: number; // invoices
  doc_date: string; // YYYY-MM-DD (issue date / quote date)
  due_date: string | null; // due date / valid-until
  notes: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Fields a create/update accepts (totals are derived server-side). */
export type DocInput = {
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  client_company?: string | null;
  client_address?: string | null;
  title?: string | null;
  currency: string;
  items: LineItem[];
  tax_rate: number;
  discount: number;
  doc_date: string;
  due_date?: string | null;
  notes?: string | null;
  status?: DocStatus;
  source_id?: string | null;
};

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD"] as const;

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
};

export const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export function lineAmount(it: LineItem): number {
  return round2((Number(it.qty) || 0) * (Number(it.rate) || 0));
}

export function computeTotals(
  items: LineItem[],
  taxRate: number,
  discount: number,
): { subtotal: number; tax_amount: number; total: number } {
  const subtotal = round2(
    (items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0),
  );
  const base = Math.max(0, round2(subtotal - (Number(discount) || 0)));
  const tax_amount = round2((base * (Number(taxRate) || 0)) / 100);
  const total = round2(base + tax_amount);
  return { subtotal, tax_amount, total };
}

export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const n = (Number(amount) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${n}`;
}

/** Amount still owed on an invoice (0 for quotations / fully-paid). */
export function amountDue(doc: Pick<BillingDoc, "total" | "amount_paid">): number {
  return Math.max(0, round2(doc.total - (doc.amount_paid || 0)));
}

/** Build the next sequential number for a kind, e.g. "QUO-0007". */
export function formatDocNumber(kind: DocKind, seq: number): string {
  const prefix = kind === "quotation" ? "QUO" : "INV";
  return `${prefix}-${String(Math.max(1, seq)).padStart(4, "0")}`;
}
