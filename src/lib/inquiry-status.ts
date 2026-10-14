/*
 * Shared inquiry types + status constants. Deliberately has NO "server-only"
 * import so both server (data layer, actions) and client (admin inbox UI) can
 * use it. The DB access itself lives in the server-only lib/inquiries.ts.
 */

export const INQUIRY_STATUSES = [
  "new",
  "in_progress",
  "contacted",
  "qualified",
  "converted",
  "closed",
  "archived",
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_progress: "In progress",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  closed: "Closed",
  archived: "Archived",
};

export function isInquiryStatus(s: string): s is InquiryStatus {
  return (INQUIRY_STATUSES as readonly string[]).includes(s);
}

export type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  project_type: string | null;
  message: string;
  status: InquiryStatus;
  notes: string | null;
  is_read: boolean;
  ip: string | null;
  created_at: string;
  updated_at: string;
};
