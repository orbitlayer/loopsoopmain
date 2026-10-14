import "server-only";
import { randomUUID } from "crypto";
import { query } from "./db";
import { type Inquiry, type InquiryStatus } from "./inquiry-status";

/*
 * Inquiries data-access layer (server-only). The public contact form inserts
 * rows (via a public server action); the admin inbox reads/updates them
 * (admin-gated). Shared types/statuses live in ./inquiry-status.
 */

export {
  INQUIRY_STATUSES,
  INQUIRY_STATUS_LABELS,
  isInquiryStatus,
} from "./inquiry-status";
export type { Inquiry, InquiryStatus } from "./inquiry-status";

type Row = Omit<Inquiry, "is_read"> & { is_read: number };
function norm(r: Row): Inquiry {
  return { ...r, is_read: Boolean(r.is_read) };
}

const SELECT =
  "SELECT id, name, email, phone, project_type, message, status, notes, is_read, ip, created_at, updated_at FROM inquiries";

export async function insertInquiry(d: {
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  ip: string | null;
}): Promise<void> {
  await query(
    "INSERT INTO inquiries (id, name, email, phone, project_type, message, ip) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [randomUUID(), d.name, d.email, d.phone, d.project_type, d.message, d.ip],
  );
}

export async function listInquiries(
  status?: InquiryStatus | "all",
): Promise<Inquiry[]> {
  const rows =
    status && status !== "all"
      ? await query<Row>(`${SELECT} WHERE status = ? ORDER BY created_at DESC`, [
          status,
        ])
      : await query<Row>(`${SELECT} ORDER BY created_at DESC`);
  return rows.map(norm);
}

/** Inbox counters for the dashboard. Fail-safe (0s if the table is absent). */
export async function getInquiryStats(): Promise<{
  total: number;
  unread: number;
  fresh: number;
}> {
  try {
    const rows = await query<{
      total: number | string;
      unread: number | string;
      fresh: number | string;
    }>(
      "SELECT COUNT(*) AS total, SUM(is_read = 0) AS unread, SUM(status = 'new') AS fresh FROM inquiries",
    );
    const r = rows[0];
    return {
      total: Number(r?.total ?? 0),
      unread: Number(r?.unread ?? 0),
      fresh: Number(r?.fresh ?? 0),
    };
  } catch {
    return { total: 0, unread: 0, fresh: 0 };
  }
}

export async function updateInquiryStatus(id: string, status: InquiryStatus) {
  await query("UPDATE inquiries SET status = ? WHERE id = ?", [status, id]);
}
export async function updateInquiryNotes(id: string, notes: string) {
  await query("UPDATE inquiries SET notes = ? WHERE id = ?", [notes || null, id]);
}
export async function updateInquiryRead(id: string, read: boolean) {
  await query("UPDATE inquiries SET is_read = ? WHERE id = ?", [read ? 1 : 0, id]);
}
export async function deleteInquiry(id: string) {
  await query("DELETE FROM inquiries WHERE id = ?", [id]);
}
