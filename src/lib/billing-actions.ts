"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  createDocument,
  updateDocument,
  setDocumentStatus,
  recordPayment,
  deleteDocument,
  getDocument,
} from "@/lib/billing-data";
import {
  type DocInput,
  type DocKind,
  type LineItem,
  isStatusFor,
} from "@/lib/billing";

/*
 * Admin billing actions for quotations + invoices. Every write is admin-gated
 * (requireAdmin) and audit-logged, then revalidates both billing routes so the
 * lists refresh. Input is sanitised/clamped before it reaches the data layer.
 */

type Result = { ok: true } | { error: string };
type ResultWith<T> = ({ ok: true } & T) | { error: string };
const FAIL = "Something went wrong. Please try again.";

function pathFor(kind: DocKind) {
  return kind === "quotation" ? "/admin/quotations" : "/admin/invoices";
}

function clean(v: unknown, max: number): string | null {
  const s = String(v ?? "").trim();
  return s ? s.slice(0, max) : null;
}

function sanitizeItems(raw: unknown): LineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 100)
    .map((it) => {
      const o = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
      return {
        description: String(o.description ?? "").slice(0, 400),
        qty: Math.max(0, Math.min(1_000_000, Number(o.qty) || 0)),
        rate: Math.max(0, Math.min(1_000_000_000, Number(o.rate) || 0)),
      };
    })
    .filter((it) => it.description || it.qty || it.rate);
}

function sanitizeInput(raw: Partial<DocInput>): DocInput | null {
  const client_name = clean(raw.client_name, 200);
  if (!client_name) return null;
  const items = sanitizeItems(raw.items);
  return {
    client_name,
    client_email: clean(raw.client_email, 200),
    client_phone: clean(raw.client_phone, 40),
    client_company: clean(raw.client_company, 200),
    client_address: clean(raw.client_address, 600),
    title: clean(raw.title, 200),
    currency: (clean(raw.currency, 8) || "INR").toUpperCase(),
    items,
    tax_rate: Math.max(0, Math.min(100, Number(raw.tax_rate) || 0)),
    discount: Math.max(0, Math.min(1_000_000_000, Number(raw.discount) || 0)),
    doc_date: clean(raw.doc_date, 10) || new Date().toISOString().slice(0, 10),
    due_date: clean(raw.due_date, 10),
    notes: clean(raw.notes, 4000),
  };
}

export async function createDocumentAction(
  kind: DocKind,
  raw: Partial<DocInput>,
): Promise<ResultWith<{ id: string; number: string }>> {
  const session = await requireAdmin();
  if (kind !== "quotation" && kind !== "invoice") return { error: "Unknown document type." };
  const input = sanitizeInput(raw);
  if (!input) return { error: "A client name is required." };
  try {
    const { id, number } = await createDocument(kind, input);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: `${kind}.create`,
      resourceType: kind,
      resourceId: id,
      summary: `Created ${kind} ${number}`,
    });
    revalidatePath(pathFor(kind));
    return { ok: true, id, number };
  } catch (err) {
    console.error("[billing] create failed:", err);
    return { error: FAIL };
  }
}

export async function updateDocumentAction(
  id: string,
  kind: DocKind,
  raw: Partial<DocInput>,
): Promise<Result> {
  const session = await requireAdmin();
  const input = sanitizeInput(raw);
  if (!input) return { error: "A client name is required." };
  try {
    await updateDocument(id, input);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: `${kind}.update`,
      resourceType: kind,
      resourceId: id,
      summary: `Updated a ${kind}`,
    });
    revalidatePath(pathFor(kind));
    return { ok: true };
  } catch (err) {
    console.error("[billing] update failed:", err);
    return { error: FAIL };
  }
}

export async function setDocumentStatusAction(
  id: string,
  kind: DocKind,
  status: string,
): Promise<Result> {
  const session = await requireAdmin();
  if (!isStatusFor(kind, status)) return { error: "Unknown status." };
  try {
    await setDocumentStatus(id, status);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: `${kind}.status`,
      resourceType: kind,
      resourceId: id,
      summary: `Set ${kind} status to "${status}"`,
    });
    revalidatePath(pathFor(kind));
    return { ok: true };
  } catch (err) {
    console.error("[billing] status failed:", err);
    return { error: FAIL };
  }
}

export async function recordPaymentAction(
  id: string,
  amount: number,
): Promise<Result> {
  const session = await requireAdmin();
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) return { error: "Enter a valid amount." };
  try {
    await recordPayment(id, amt);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "invoice.payment",
      resourceType: "invoice",
      resourceId: id,
      summary: `Recorded a payment of ${amt}`,
    });
    revalidatePath("/admin/invoices");
    return { ok: true };
  } catch (err) {
    console.error("[billing] payment failed:", err);
    return { error: FAIL };
  }
}

export async function deleteDocumentAction(
  id: string,
  kind: DocKind,
): Promise<Result> {
  const session = await requireAdmin();
  try {
    await deleteDocument(id);
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: `${kind}.delete`,
      resourceType: kind,
      resourceId: id,
      summary: `Deleted a ${kind}`,
    });
    revalidatePath(pathFor(kind));
    return { ok: true };
  } catch (err) {
    console.error("[billing] delete failed:", err);
    return { error: FAIL };
  }
}

/** Create an invoice from an existing quotation (copies client + line items). */
export async function convertQuotationToInvoiceAction(
  quotationId: string,
): Promise<ResultWith<{ id: string; number: string }>> {
  const session = await requireAdmin();
  try {
    const q = await getDocument(quotationId);
    if (!q || q.kind !== "quotation") return { error: "Quotation not found." };
    const today = new Date().toISOString().slice(0, 10);
    const { id, number } = await createDocument("invoice", {
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
    await setDocumentStatus(quotationId, "accepted");
    await logAudit({
      actorId: session.uid,
      actorEmail: session.email,
      action: "quotation.convert",
      resourceType: "invoice",
      resourceId: id,
      summary: `Converted ${q.number} to invoice ${number}`,
    });
    revalidatePath("/admin/quotations");
    revalidatePath("/admin/invoices");
    return { ok: true, id, number };
  } catch (err) {
    console.error("[billing] convert failed:", err);
    return { error: FAIL };
  }
}
