/*
 * billing-local — the browser-storage ("dummy database") implementation of the
 * billing data layer. It mirrors the server-only ./billing-data API exactly
 * (listDocuments / getDocument / createDocument / updateDocument /
 * setDocumentStatus / recordPayment / deleteDocument / billingStats) so the
 * admin can run against localStorage today and swap to the real MySQL backend
 * later with no UI changes.
 *
 * Unlike billing-data these functions are synchronous and run in the browser;
 * they share the pure money/number/format helpers from ./billing, so the totals
 * maths is guaranteed identical to the server path.
 */

import {
  type BillingDoc,
  type DocInput,
  type DocKind,
  type DocStatus,
  type LineItem,
  computeTotals,
  formatDocNumber,
  round2,
} from "./billing";
import { readCollection, writeCollection, uid, nowISO } from "./local-store";

/** localStorage collection name — shared with the React store (subscribe). */
export const COLLECTION = "billing";

function all(): BillingDoc[] {
  return readCollection<BillingDoc>(COLLECTION).map(normalize);
}

function persist(rows: BillingDoc[]): void {
  writeCollection(COLLECTION, rows);
}

/** Coerce a stored row back into a well-formed BillingDoc (defensive). */
function normalize(r: Partial<BillingDoc>): BillingDoc {
  const items: LineItem[] = Array.isArray(r.items)
    ? r.items.map((it) => ({
        description: String(it?.description ?? ""),
        qty: Number(it?.qty) || 0,
        rate: Number(it?.rate) || 0,
      }))
    : [];
  return {
    id: String(r.id ?? uid()),
    kind: r.kind === "invoice" ? "invoice" : "quotation",
    number: String(r.number ?? ""),
    status: (r.status ?? "draft") as DocStatus,
    client_name: String(r.client_name ?? ""),
    client_email: r.client_email ?? null,
    client_phone: r.client_phone ?? null,
    client_company: r.client_company ?? null,
    client_address: r.client_address ?? null,
    title: r.title ?? null,
    currency: String(r.currency ?? "INR"),
    items,
    tax_rate: Number(r.tax_rate) || 0,
    discount: Number(r.discount) || 0,
    subtotal: Number(r.subtotal) || 0,
    tax_amount: Number(r.tax_amount) || 0,
    total: Number(r.total) || 0,
    amount_paid: Number(r.amount_paid) || 0,
    doc_date: String(r.doc_date ?? nowISO().slice(0, 10)),
    due_date: r.due_date ?? null,
    notes: r.notes ?? null,
    source_id: r.source_id ?? null,
    created_at: String(r.created_at ?? nowISO()),
    updated_at: String(r.updated_at ?? nowISO()),
  };
}

const str = (v: unknown, max: number): string | null => {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
};

/** Clamp + trim a DocInput the same way the server action does. */
function sanitize(input: DocInput): DocInput {
  const items = (input.items || [])
    .slice(0, 100)
    .map((it) => ({
      description: String(it?.description ?? "").slice(0, 400),
      qty: Math.max(0, Math.min(1_000_000, Number(it?.qty) || 0)),
      rate: Math.max(0, Math.min(1_000_000_000, Number(it?.rate) || 0)),
    }))
    .filter((it) => it.description.trim() || it.qty || it.rate);
  return {
    client_name: (str(input.client_name, 200) ?? "").slice(0, 200),
    client_email: str(input.client_email, 200),
    client_phone: str(input.client_phone, 40),
    client_company: str(input.client_company, 200),
    client_address: str(input.client_address, 600),
    title: str(input.title, 200),
    currency: (str(input.currency, 8) || "INR").toUpperCase(),
    items,
    tax_rate: Math.max(0, Math.min(100, Number(input.tax_rate) || 0)),
    discount: Math.max(0, Math.min(1_000_000_000, Number(input.discount) || 0)),
    doc_date: str(input.doc_date, 10) || nowISO().slice(0, 10),
    due_date: str(input.due_date, 10),
    notes: str(input.notes, 4000),
    status: input.status,
    source_id: input.source_id ?? null,
  };
}

function nextNumberFrom(rows: BillingDoc[], kind: DocKind): string {
  const prefix = kind === "quotation" ? "QUO-" : "INV-";
  const seq = rows
    .filter((d) => d.kind === kind && d.number.startsWith(prefix))
    .reduce((max, d) => {
      const n = parseInt(d.number.slice(prefix.length), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0);
  return formatDocNumber(kind, seq + 1);
}

/* ---------------------------------------------------------------- reads */

/**
 * Project a raw row array into a normalised, filtered, sorted document list.
 * Pure — it takes the rows to operate on, so the React store can pass it the
 * exact snapshot it is rendering (avoids reading storage during hydration).
 */
export function selectDocuments(
  rows: Partial<BillingDoc>[],
  kind: DocKind,
  status?: DocStatus | "all",
): BillingDoc[] {
  let out = rows.map(normalize).filter((d) => d.kind === kind);
  if (status && status !== "all") out = out.filter((d) => d.status === status);
  // Newest first, matching the server's `ORDER BY created_at DESC`.
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function listDocuments(
  kind: DocKind,
  status?: DocStatus | "all",
): BillingDoc[] {
  return selectDocuments(readCollection<BillingDoc>(COLLECTION), kind, status);
}

export function getDocument(id: string): BillingDoc | null {
  return all().find((d) => d.id === id) ?? null;
}

export function nextNumber(kind: DocKind): string {
  return nextNumberFrom(all(), kind);
}

/* --------------------------------------------------------------- writes */

export function createDocument(
  kind: DocKind,
  rawInput: DocInput,
): { id: string; number: string } {
  const input = sanitize(rawInput);
  const rows = all();
  const id = uid();
  const number = nextNumberFrom(rows, kind);
  const { subtotal, tax_amount, total } = computeTotals(
    input.items,
    input.tax_rate,
    input.discount,
  );
  const now = nowISO();
  const doc: BillingDoc = {
    id,
    kind,
    number,
    status: input.status ?? "draft",
    client_name: input.client_name,
    client_email: input.client_email ?? null,
    client_phone: input.client_phone ?? null,
    client_company: input.client_company ?? null,
    client_address: input.client_address ?? null,
    title: input.title ?? null,
    currency: input.currency,
    items: input.items,
    tax_rate: round2(input.tax_rate),
    discount: round2(input.discount),
    subtotal,
    tax_amount,
    total,
    amount_paid: 0,
    doc_date: input.doc_date,
    due_date: input.due_date || null,
    notes: input.notes ?? null,
    source_id: input.source_id ?? null,
    created_at: now,
    updated_at: now,
  };
  persist([doc, ...rows]);
  return { id, number };
}

export function updateDocument(id: string, rawInput: DocInput): void {
  const input = sanitize(rawInput);
  const { subtotal, tax_amount, total } = computeTotals(
    input.items,
    input.tax_rate,
    input.discount,
  );
  persist(
    all().map((d) =>
      d.id === id
        ? {
            ...d,
            client_name: input.client_name,
            client_email: input.client_email ?? null,
            client_phone: input.client_phone ?? null,
            client_company: input.client_company ?? null,
            client_address: input.client_address ?? null,
            title: input.title ?? null,
            currency: input.currency,
            items: input.items,
            tax_rate: round2(input.tax_rate),
            discount: round2(input.discount),
            subtotal,
            tax_amount,
            total,
            doc_date: input.doc_date,
            due_date: input.due_date || null,
            notes: input.notes ?? null,
            updated_at: nowISO(),
          }
        : d,
    ),
  );
}

export function setDocumentStatus(id: string, status: DocStatus): void {
  persist(
    all().map((d) => (d.id === id ? { ...d, status, updated_at: nowISO() } : d)),
  );
}

/** Add a payment to an invoice and advance its status (partial / paid). */
export function recordPayment(id: string, amount: number): void {
  persist(
    all().map((d) => {
      if (d.id !== id) return d;
      const paid = round2(
        Math.min(d.total, Math.max(0, d.amount_paid + (Number(amount) || 0))),
      );
      const status: DocStatus =
        paid >= d.total && d.total > 0 ? "paid" : paid > 0 ? "partial" : d.status;
      return { ...d, amount_paid: paid, status, updated_at: nowISO() };
    }),
  );
}

export function deleteDocument(id: string): void {
  persist(all().filter((d) => d.id !== id));
}

/** Create an invoice from an existing quotation (copies client + line items). */
export function convertQuotationToInvoice(
  quotationId: string,
): { id: string; number: string } | null {
  const q = getDocument(quotationId);
  if (!q || q.kind !== "quotation") return null;
  const today = nowISO().slice(0, 10);
  const created = createDocument("invoice", {
    client_name: q.client_name,
    client_email: q.client_email,
    client_phone: q.client_phone,
    client_company: q.client_company,
    client_address: q.client_address,
    title: q.title,
    currency: q.currency,
    items: q.items,
    tax_rate: q.tax_rate,
    discount: q.discount,
    doc_date: today,
    due_date: null,
    notes: q.notes,
    source_id: q.id,
  });
  setDocumentStatus(quotationId, "accepted");
  return created;
}

/** Dashboard counters for a kind (mirrors billing-data.billingStats). */
export function billingStats(kind: DocKind): {
  count: number;
  total: number;
  outstanding: number;
} {
  const rows = all().filter((d) => d.kind === kind);
  const total = rows.reduce((s, d) => s + d.total, 0);
  const outstanding = rows
    .filter((d) => !["void", "declined", "paid", "expired"].includes(d.status))
    .reduce((s, d) => s + Math.max(0, round2(d.total - (d.amount_paid || 0))), 0);
  return { count: rows.length, total: round2(total), outstanding: round2(outstanding) };
}
