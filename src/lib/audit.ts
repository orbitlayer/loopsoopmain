import "server-only";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { query } from "./db";

/*
 * Audit log — records administrative actions (Phase 2 foundation).
 *
 * logAudit() is BEST-EFFORT: it never throws. If the audit_logs table hasn't
 * been migrated yet, or the insert fails for any reason, the calling action
 * (login, portfolio CRUD, …) must still succeed. This keeps auditing purely
 * additive and impossible to regress existing flows.
 */

export type AuditEntry = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  summary?: string | null;
  meta?: unknown;
};

async function clientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const fwd = h.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0]?.trim() || null;
    return h.get("x-real-ip") || null;
  } catch {
    return null;
  }
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const ip = await clientIp();
    await query(
      `INSERT INTO audit_logs
         (id, actor_id, actor_email, action, resource_type, resource_id, summary, meta, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        entry.actorId ?? null,
        entry.actorEmail ?? null,
        entry.action,
        entry.resourceType ?? null,
        entry.resourceId ?? null,
        entry.summary ?? null,
        entry.meta != null ? JSON.stringify(entry.meta) : null,
        ip,
      ],
    );
  } catch (err) {
    // Never let auditing break the underlying action.
    console.error("[audit] write failed (non-fatal):", err);
  }
}

export type AuditRow = {
  id: string;
  actor_email: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  summary: string | null;
  ip: string | null;
  created_at: string;
};

/** Latest audit entries, newest first. Returns [] if the table isn't there. */
export async function listAuditLogs(limit = 100): Promise<AuditRow[]> {
  const n = Math.max(1, Math.min(500, Math.floor(limit) || 100));
  try {
    return await query<AuditRow>(
      `SELECT id, actor_email, action, resource_type, resource_id, summary, ip, created_at
       FROM audit_logs ORDER BY created_at DESC LIMIT ${n}`,
    );
  } catch (err) {
    console.error("[audit] list failed (non-fatal):", err);
    return [];
  }
}
