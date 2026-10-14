"use client";

import { useMemo, useState } from "react";
import { Eye, AlertTriangle } from "lucide-react";
import {
  saveContentDraftAction,
  publishContentAction,
  discardContentDraftAction,
} from "@/lib/content-actions";
import { Button, Field, TextInput } from "./ui";

type Details = { email: string; whatsapp: string; phone: string; hours: string };

/*
 * Site details editor (email / WhatsApp / phone / hours). These appear across
 * the public site (footer, contact page, WhatsApp buttons, legal pages).
 * Draft → Preview → Publish, reusing the shared content pipeline.
 */
export function SiteDetailsEditor({
  draft,
  published,
  updatedBy,
}: {
  draft: Details;
  published: Details;
  updatedBy: string | null;
}) {
  const [email, setEmail] = useState(draft.email);
  const [whatsapp, setWhatsapp] = useState(draft.whatsapp);
  const [phone, setPhone] = useState(draft.phone);
  const [hours, setHours] = useState(draft.hours);
  const [pub, setPub] = useState<Details>(published);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "publish" | "discard">(null);

  const current: Details = { email, whatsapp, phone, hours };
  const dirty = useMemo(
    () => JSON.stringify(current) !== JSON.stringify(pub),
    [current, pub],
  );

  async function persist(): Promise<boolean> {
    const res = await saveContentDraftAction("site.details", current);
    if ("error" in res) {
      setError(res.error);
      return false;
    }
    return true;
  }

  async function saveDraft(): Promise<boolean> {
    setError(null);
    setNotice(null);
    setPending(true);
    const ok = await persist();
    setPending(false);
    if (ok) setNotice("Draft saved. It isn't live until you publish.");
    return ok;
  }

  async function preview() {
    const ok = await saveDraft();
    if (ok) window.open("/contact?preview=1", "_blank", "noopener");
  }

  async function doPublish() {
    setError(null);
    setNotice(null);
    setPending(true);
    if (!(await persist())) {
      setPending(false);
      return;
    }
    const res = await publishContentAction("site.details");
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setPub(current);
    setConfirm(null);
    setNotice("Published - the new details are now live across the site.");
  }

  async function doDiscard() {
    setError(null);
    setNotice(null);
    setPending(true);
    const res = await discardContentDraftAction("site.details");
    setPending(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setEmail(pub.email);
    setWhatsapp(pub.whatsapp);
    setPhone(pub.phone);
    setHours(pub.hours);
    setConfirm(null);
    setNotice("Discarded unpublished changes.");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-faint">
        <a href="/admin/content" className="transition-colors hover:text-ink">
          Content
        </a>
        <span aria-hidden>/</span>
        <span className="text-muted">Site details</span>
      </nav>

      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
          Site details
        </h1>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
            dirty
              ? "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/30"
              : "bg-subtle text-muted ring-1 ring-line"
          }`}
        >
          {dirty ? "Unpublished changes" : "Published"}
        </span>
      </div>
      <p className="mt-1 text-sm text-faint">
        Used across the footer, contact page and WhatsApp buttons.
        {updatedBy ? ` Last edited by ${updatedBy}.` : ""}
      </p>

      {notice && (
        <p className="mt-6 rounded-xl border border-line bg-subtle px-4 py-2.5 text-sm text-ink">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}

      <section className="mt-6 space-y-4 rounded-2xl border border-line bg-surface p-5">
        <Field label="Contact email">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field
          label="WhatsApp number"
          hint="Digits only, international format (no +, spaces or dashes). E.g. 919835106943"
        >
          <TextInput
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="919835106943"
            inputMode="numeric"
          />
        </Field>
        <Field label="Phone (shown on the contact page)" hint="The tap-to-call link is derived from this number.">
          <TextInput
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98351 06943"
          />
        </Field>
        <Field label="Business hours">
          <TextInput
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Mon - Sat, 10AM - 8PM IST"
          />
        </Field>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button onClick={() => setConfirm("publish")} disabled={pending}>
          Publish
        </Button>
        <Button variant="ghost" onClick={saveDraft} disabled={pending}>
          Save draft
        </Button>
        <Button variant="ghost" onClick={preview} disabled={pending}>
          <Eye className="h-4 w-4" /> Preview
        </Button>
        {dirty && (
          <button
            type="button"
            onClick={() => setConfirm("discard")}
            disabled={pending}
            className="ml-auto text-sm text-faint underline-offset-4 transition-colors hover:text-ink hover:underline disabled:opacity-50"
          >
            Discard changes
          </button>
        )}
      </div>

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
              {confirm === "publish"
                ? "Publish site details?"
                : "Discard unpublished changes?"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirm === "publish"
                ? "These details will go live across the footer, contact page and WhatsApp buttons."
                : "Your unpublished edits will be reverted to what's currently live."}
            </p>
            {error && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>
                Cancel
              </Button>
              <Button
                variant={confirm === "discard" ? "danger" : "primary"}
                onClick={confirm === "publish" ? doPublish : doDiscard}
                disabled={pending}
              >
                {pending ? "Working…" : confirm === "publish" ? "Publish" : "Discard"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
