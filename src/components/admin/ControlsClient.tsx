"use client";

import { useState } from "react";
import { AlertTriangle, Power, MessageSquareOff } from "lucide-react";
import {
  setMaintenanceAction,
  saveMaintenanceMessageAction,
  setKillContactAction,
} from "@/lib/settings-actions";
import { Button, Switch, TextInput } from "./ui";

/*
 * Site Controls — Maintenance Mode + kill switches.
 * High-risk actions: each toggle opens a confirmation dialog, enabling
 * maintenance requires typing a phrase, and every change is audit-logged
 * server-side. Switches reflect current state and only change after confirm.
 */

const ENABLE_PHRASE = "MAINTENANCE";

type Confirm =
  | { kind: "maintenance"; next: boolean }
  | { kind: "contact"; next: boolean }
  | null;

function StatusPill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
        on
          ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/30"
          : "bg-subtle text-muted ring-1 ring-line"
      }`}
    >
      {on ? onLabel : offLabel}
    </span>
  );
}

export function ControlsClient({
  initial,
}: {
  initial: { maintenance: boolean; maintenanceMessage: string; killContact: boolean };
}) {
  const [maintenance, setMaintenance] = useState(initial.maintenance);
  const [killContact, setKillContact] = useState(initial.killContact);
  const [message, setMessage] = useState(initial.maintenanceMessage);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [phrase, setPhrase] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function open(c: Confirm) {
    setError(null);
    setNotice(null);
    setPhrase("");
    setConfirm(c);
  }

  async function runConfirm() {
    if (!confirm) return;
    setError(null);
    setNotice(null);
    setPending(true);
    let res: { ok: true } | { error: string };
    if (confirm.kind === "maintenance") {
      res = await setMaintenanceAction(confirm.next, message);
      if ("ok" in res) setMaintenance(confirm.next);
    } else {
      res = await setKillContactAction(confirm.next);
      if ("ok" in res) setKillContact(confirm.next);
    }
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setConfirm(null);
    setNotice(
      confirm.kind === "maintenance"
        ? confirm.next
          ? "Maintenance mode is now ON - the public site is offline to visitors."
          : "Maintenance mode is now OFF - the public site is live again."
        : confirm.next
          ? "Public contact is now DISABLED."
          : "Public contact is now ACTIVE.",
    );
  }

  async function saveMessage() {
    setError(null);
    setNotice(null);
    setPending(true);
    const res = await saveMaintenanceMessageAction(message);
    setPending(false);
    if ("error" in res) setError(res.error);
    else setNotice("Maintenance message saved.");
  }

  const maintEnabling = confirm?.kind === "maintenance" && confirm.next;
  const phraseOk = phrase.trim().toUpperCase() === ENABLE_PHRASE;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
        Site Controls
      </h1>
      <p className="mt-1 text-sm text-faint">
        Maintenance mode and emergency kill switches for the public website.
      </p>

      {notice && (
        <p className="mt-6 rounded-xl border border-line bg-subtle px-4 py-2.5 text-sm text-ink">
          {notice}
        </p>
      )}

      {/* Top-level error (e.g. failed "Save message" — no modal is open then) */}
      {error && !confirm && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600"
        >
          {error}
        </p>
      )}

      {/* Maintenance mode */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-muted">
              <Power className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">
                  Maintenance Mode
                </h2>
                <StatusPill on={maintenance} onLabel="Active" offLabel="Off" />
              </div>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-faint">
                When ON, visitors see a maintenance page. You and other signed-in
                admins keep full access to the admin panel and can still preview
                the live site.
              </p>
            </div>
          </div>
          <Switch
            checked={maintenance}
            onChange={(next) => open({ kind: "maintenance", next })}
            srLabel="Toggle maintenance mode"
          />
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-muted">
            Maintenance message (shown to visitors)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10"
          />
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={saveMessage} disabled={pending}>
              Save message
            </Button>
          </div>
        </div>
      </section>

      {/* Kill switches */}
      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Kill switches</h2>
        <p className="mt-1 text-xs text-faint">
          Instantly disable a specific public capability without taking the whole
          site down.
        </p>

        <div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-line bg-subtle p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-subtle text-muted">
              <MessageSquareOff className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-medium text-ink">
                  Public contact (WhatsApp)
                </h3>
                <StatusPill on={killContact} onLabel="Disabled" offLabel="Active" />
              </div>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-faint">
                Hides the floating WhatsApp button site-wide and shows a
                &ldquo;not taking new inquiries&rdquo; notice on the contact page.
              </p>
            </div>
          </div>
          {/* Switch ON = channel live; OFF = killed */}
          <Switch
            checked={!killContact}
            onChange={(live) => open({ kind: "contact", next: !live })}
            srLabel="Toggle public contact channel"
          />
        </div>
      </section>

      {/* Confirmation dialog */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setConfirm(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[20px] border border-line bg-surface p-6 shadow-2xl shadow-black/10"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h2 className="font-display text-base font-medium tracking-[-0.02em] text-ink">
              {confirm.kind === "maintenance"
                ? confirm.next
                  ? "Take the public site offline?"
                  : "Bring the public site back online?"
                : confirm.next
                  ? "Disable the public contact channel?"
                  : "Re-enable the public contact channel?"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirm.kind === "maintenance"
                ? confirm.next
                  ? "Visitors will see the maintenance page until you turn this off. The admin panel stays available to you."
                  : "Visitors will be able to access the site normally again."
                : confirm.next
                  ? "Visitors won't be able to reach you via the WhatsApp button or contact page until you re-enable it."
                  : "The WhatsApp button and contact page will work normally again."}
            </p>

            {maintEnabling && (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Type <span className="font-semibold text-ink">{ENABLE_PHRASE}</span> to confirm
                </label>
                <TextInput
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  placeholder={ENABLE_PHRASE}
                  autoFocus
                />
              </div>
            )}

            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setConfirm(null)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                variant={
                  (confirm.kind === "maintenance" && confirm.next) ||
                  (confirm.kind === "contact" && confirm.next)
                    ? "danger"
                    : "primary"
                }
                onClick={runConfirm}
                disabled={pending || (maintEnabling && !phraseOk)}
              >
                {pending
                  ? "Saving…"
                  : confirm.next
                    ? confirm.kind === "maintenance"
                      ? "Take offline"
                      : "Disable"
                    : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
