"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { BillingDoc, DocInput, DocKind, DocStatus } from "@/lib/billing";
import * as local from "@/lib/billing-local";
import { subscribe, getSnapshot, getServerSnapshot } from "@/lib/local-store";
import {
  createDocumentAction,
  updateDocumentAction,
  setDocumentStatusAction,
  recordPaymentAction,
  deleteDocumentAction,
  convertQuotationToInvoiceAction,
} from "@/lib/billing-actions";

/*
 * useBillingStore — one API over two interchangeable backends:
 *
 *   mode "server" → the MySQL-backed server actions (production / hosting).
 *   mode "local"  → the browser-storage "dummy database" (./billing-local),
 *                   used before hosting is configured so the CMS still works.
 *
 * Both paths return the same Result shapes, so BillingManager is agnostic to
 * where the data lives. Switching to real hosting later is just a prop change
 * (storage="server") on the page — no component edits.
 */

export type BillingMode = "server" | "local";

type Result = { ok: true } | { error: string };
type ResultWith<T> = ({ ok: true } & T) | { error: string };

const FAIL = "Something went wrong. Please try again.";

export type BillingStore = {
  /** The current list of documents for this kind (all statuses). */
  docs: BillingDoc[];
  mode: BillingMode;
  /** Re-read the list from the active backend (server mode only; local auto-syncs). */
  reload: () => void;
  create: (input: Partial<DocInput>) => Promise<ResultWith<{ id: string; number: string }>>;
  update: (id: string, input: Partial<DocInput>) => Promise<Result>;
  setStatus: (id: string, status: string) => Promise<Result>;
  recordPay: (id: string, amount: number) => Promise<Result>;
  remove: (id: string) => Promise<Result>;
  convert: (id: string) => Promise<ResultWith<{ id: string; number: string }>>;
};

export function useBillingStore(
  kind: DocKind,
  mode: BillingMode,
  initial: BillingDoc[],
): BillingStore {
  const router = useRouter();

  // Subscribe to the browser-storage collection (local mode only). In server
  // mode the subscription is inert and the snapshot stays the stable empty
  // array, so the page's `initial` prop remains the source of truth.
  const subscribeFn = useCallback(
    (cb: () => void) => (mode === "local" ? subscribe(local.COLLECTION, cb) : () => {}),
    [mode],
  );
  const clientSnapshot = useCallback(
    () => (mode === "local" ? getSnapshot<BillingDoc>(local.COLLECTION) : getServerSnapshot<BillingDoc>()),
    [mode],
  );
  const snapshot = useSyncExternalStore(
    subscribeFn,
    clientSnapshot,
    getServerSnapshot<BillingDoc>,
  );

  const reload = useCallback(() => {
    // Local writes notify subscribers automatically; only server mode needs a refetch.
    if (mode !== "local") router.refresh();
  }, [mode, router]);

  // Derive the kind's list from the subscribed snapshot (local) or the page's
  // prop (server). Deriving from `snapshot` — rather than re-reading storage —
  // keeps the hydration render identical to the server's (empty) output.
  const docs = useMemo(
    () => (mode === "local" ? local.selectDocuments(snapshot, kind, "all") : initial),
    [mode, kind, initial, snapshot],
  );

  const create = useCallback<BillingStore["create"]>(
    async (input) => {
      if (mode === "local") {
        try {
          const r = local.createDocument(kind, input as DocInput);
          return { ok: true, ...r };
        } catch {
          return { error: FAIL };
        }
      }
      return createDocumentAction(kind, input);
    },
    [mode, kind],
  );

  const update = useCallback<BillingStore["update"]>(
    async (id, input) => {
      if (mode === "local") {
        try {
          local.updateDocument(id, input as DocInput);
          return { ok: true };
        } catch {
          return { error: FAIL };
        }
      }
      return updateDocumentAction(id, kind, input);
    },
    [mode, kind],
  );

  const setStatus = useCallback<BillingStore["setStatus"]>(
    async (id, status) => {
      if (mode === "local") {
        try {
          local.setDocumentStatus(id, status as DocStatus);
          return { ok: true };
        } catch {
          return { error: FAIL };
        }
      }
      return setDocumentStatusAction(id, kind, status);
    },
    [mode, kind],
  );

  const recordPay = useCallback<BillingStore["recordPay"]>(
    async (id, amount) => {
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) return { error: "Enter a valid amount." };
      if (mode === "local") {
        try {
          local.recordPayment(id, amt);
          return { ok: true };
        } catch {
          return { error: FAIL };
        }
      }
      return recordPaymentAction(id, amt);
    },
    [mode],
  );

  const remove = useCallback<BillingStore["remove"]>(
    async (id) => {
      if (mode === "local") {
        try {
          local.deleteDocument(id);
          return { ok: true };
        } catch {
          return { error: FAIL };
        }
      }
      return deleteDocumentAction(id, kind);
    },
    [mode, kind],
  );

  const convert = useCallback<BillingStore["convert"]>(
    async (id) => {
      if (mode === "local") {
        try {
          const r = local.convertQuotationToInvoice(id);
          if (!r) return { error: "Quotation not found." };
          return { ok: true, ...r };
        } catch {
          return { error: FAIL };
        }
      }
      return convertQuotationToInvoiceAction(id);
    },
    [mode],
  );

  return { docs, mode, reload, create, update, setStatus, recordPay, remove, convert };
}
