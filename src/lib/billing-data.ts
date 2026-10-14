import "server-only";
import { randomUUID } from "crypto";
import { query } from "./db";
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

/*
 * Billing data-access layer (server-only). Quotations and invoices share one
 * `billing_documents` table (see mysql/008_billing.sql), discriminated by
 * `kind`. All reads are fail-safe at the page level (a missing table yields an
 * empty list); writes are admin-gated in ./billing-actions.
 */

type Row = {
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
  items: string | null; // LONGTEXT JSON
  tax_rate: string | number;
  discount: string | number;
  subtotal: string | number;
  tax_amount: string | number;
  total: string | number;
  amount_paid: string | number;
  doc_date: string;
  due_date: string | null;
  notes: string | null;
  source_id: string | null;
  created_at: string;
  updated_at: string;
};

function parseItems(raw: string | null): LineItem[] {
  if (!raw) return [];
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(v)) return [];
    return v.map((it) => ({
      description: String(it?.description ?? ""),
      qty: Number(it?.qty) || 0,
      rate: Number(it?.rate) || 0,
    }));
  } catch {
    return [];
  }
}

function norm(r: Row): BillingDoc {
  return {
    id: r.id,
    kind: r.kind,
    number: r.number,
    status: r.status,
    client_name: r.client_name,
    client_email: r.client_email,
    client_phone: r.client_phone,
    client_company: r.client_company,
    client_address: r.client_address,
    title: r.title,
    currency: r.currency,
    items: parseItems(r.items),
    tax_rate: Number(r.tax_rate) || 0,
    discount: Number(r.discount) || 0,
    subtotal: Number(r.subtotal) || 0,
    tax_amount: Number(r.tax_amount) || 0,
    total: Number(r.total) || 0,
    amount_paid: Number(r.amount_paid) || 0,
    doc_date: r.doc_date,
    due_date: r.due_date,
    notes: r.notes,
    source_id: r.source_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const COLS =
  "id, kind, number, status, client_name, client_email, client_phone, client_company, client_address, title, currency, items, tax_rate, discount, subtotal, tax_amount, total, amount_paid, doc_date, due_date, notes, source_id, created_at, updated_at";

export async function listDocuments(
  kind: DocKind,
  status?: DocStatus | "all",
): Promise<BillingDoc[]> {
  const rows =
    status && status !== "all"
      ? await query<Row>(
          `SELECT ${COLS} FROM billing_documents WHERE kind = ? AND status = ? ORDER BY created_at DESC`,
          [kind, status],
        )
      : await query<Row>(
          `SELECT ${COLS} FROM billing_documents WHERE kind = ? ORDER BY created_at DESC`,
          [kind],
        );
  return rows.map(norm);
}

export async function getDocument(id: string): Promise<BillingDoc | null> {
  const rows = await query<Row>(
    `SELECT ${COLS} FROM billing_documents WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? norm(rows[0]) : null;
}

/** Next sequential number for a kind (e.g. "QUO-0007"), robust to gaps. */
export async function nextNumber(kind: DocKind): Promise<string> {
  const prefix = kind === "quotation" ? "QUO-" : "INV-";
  const rows = await query<{ seq: number | string | null }>(
    `SELECT MAX(CAST(SUBSTRING(number, ?) AS UNSIGNED)) AS seq
       FROM billing_documents WHERE kind = ? AND number LIKE ?`,
    [prefix.length + 1, kind, `${prefix}%`],
  );
  const seq = Number(rows[0]?.seq ?? 0) || 0;
  return formatDocNumber(kind, seq + 1);
}

export async function createDocument(
  kind: DocKind,
  input: DocInput,
): Promise<{ id: string; number: string }> {
  const id = randomUUID();
  const number = await nextNumber(kind);
  const items = (input.items || []).filter((it) => it.description.trim() || it.qty || it.rate);
  const { subtotal, tax_amount, total } = computeTotals(
    items,
    input.tax_rate,
    input.discount,
  );
  await query(
    `INSERT INTO billing_documents
       (id, kind, number, status, client_name, client_email, client_phone, client_company,
        client_address, title, currency, items, tax_rate, discount, subtotal, tax_amount,
        total, amount_paid, doc_date, due_date, notes, source_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      kind,
      number,
      input.status ?? "draft",
      input.client_name,
      input.client_email ?? null,
      input.client_phone ?? null,
      input.client_company ?? null,
      input.client_address ?? null,
      input.title ?? null,
      input.currency,
      JSON.stringify(items),
      round2(input.tax_rate),
      round2(input.discount),
      subtotal,
      tax_amount,
      total,
      0,
      input.doc_date,
      input.due_date || null,
      input.notes ?? null,
      input.source_id ?? null,
    ],
  );
  return { id, number };
}

export async function updateDocument(id: string, input: DocInput): Promise<void> {
  const items = (input.items || []).filter((it) => it.description.trim() || it.qty || it.rate);
  const { subtotal, tax_amount, total } = computeTotals(
    items,
    input.tax_rate,
    input.discount,
  );
  await query(
    `UPDATE billing_documents SET
       client_name = ?, client_email = ?, client_phone = ?, client_company = ?,
       client_address = ?, title = ?, currency = ?, items = ?, tax_rate = ?, discount = ?,
       subtotal = ?, tax_amount = ?, total = ?, doc_date = ?, due_date = ?, notes = ?
     WHERE id = ?`,
    [
      input.client_name,
      input.client_email ?? null,
      input.client_phone ?? null,
      input.client_company ?? null,
      input.client_address ?? null,
      input.title ?? null,
      input.currency,
      JSON.stringify(items),
      round2(input.tax_rate),
      round2(input.discount),
      subtotal,
      tax_amount,
      total,
      input.doc_date,
      input.due_date || null,
      input.notes ?? null,
      id,
    ],
  );
}

export async function setDocumentStatus(id: string, status: DocStatus): Promise<void> {
  await query("UPDATE billing_documents SET status = ? WHERE id = ?", [status, id]);
}

/** Add a payment to an invoice and advance its status (partial / paid). */
export async function recordPayment(id: string, amount: number): Promise<void> {
  const doc = await getDocument(id);
  if (!doc) return;
  const paid = round2(Math.min(doc.total, Math.max(0, doc.amount_paid + (Number(amount) || 0))));
  const status: DocStatus = paid >= doc.total && doc.total > 0 ? "paid" : paid > 0 ? "partial" : doc.status;
  await query("UPDATE billing_documents SET amount_paid = ?, status = ? WHERE id = ?", [
    paid,
    status,
    id,
  ]);
}

export async function deleteDocument(id: string): Promise<void> {
  await query("DELETE FROM billing_documents WHERE id = ?", [id]);
}

/** Dashboard counters for a kind. Fail-safe (zeros if the table is absent). */
export async function billingStats(kind: DocKind): Promise<{
  count: number;
  total: number;
  outstanding: number;
}> {
  try {
    const rows = await query<{
      count: number | string;
      total: number | string;
      outstanding: number | string;
    }>(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(total), 0) AS total,
              COALESCE(SUM(CASE WHEN status NOT IN ('void','declined','paid','expired')
                                THEN total - amount_paid ELSE 0 END), 0) AS outstanding
         FROM billing_documents WHERE kind = ?`,
      [kind],
    );
    const r = rows[0];
    return {
      count: Number(r?.count ?? 0),
      total: Number(r?.total ?? 0),
      outstanding: Number(r?.outstanding ?? 0),
    };
  } catch {
    return { count: 0, total: 0, outstanding: 0 };
  }
}
