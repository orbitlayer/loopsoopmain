"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  AlertTriangle,
} from "lucide-react";
import {
  saveContentDraftAction,
  publishContentAction,
  discardContentDraftAction,
} from "@/lib/content-actions";
import { Button, IconButton, SmallButton, TextInput } from "./ui";

type Faq = { q: string; a: string };
type Copy = { heroSubtitle: string; quoteHeading: string; quoteBody: string };

const textareaCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

/*
 * Contact page content editor. Edits two content blocks together —
 * `contact.copy` (hero + quote text) and `faqs` — with one page-level
 * Draft → Preview → Publish flow. The public site falls back to code defaults
 * for any block that hasn't been published.
 */
export function ContactEditor({
  copy,
  publishedCopy,
  faqs,
  publishedFaqs,
  updatedBy,
}: {
  copy: Copy;
  publishedCopy: Copy;
  faqs: Faq[];
  publishedFaqs: Faq[];
  updatedBy: string | null;
}) {
  const [heroSubtitle, setHeroSubtitle] = useState(copy.heroSubtitle);
  const [quoteHeading, setQuoteHeading] = useState(copy.quoteHeading);
  const [quoteBody, setQuoteBody] = useState(copy.quoteBody);
  const [items, setItems] = useState<Faq[]>(faqs);

  const [pubCopy, setPubCopy] = useState<Copy>(publishedCopy);
  const [pubFaqs, setPubFaqs] = useState<Faq[]>(publishedFaqs);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | "publish" | "discard">(null);

  const currentCopy: Copy = { heroSubtitle, quoteHeading, quoteBody };
  const cleanFaqs = (list: Faq[]): Faq[] =>
    list.map((it) => ({ q: it.q.trim(), a: it.a.trim() })).filter((it) => it.q || it.a);

  const dirty = useMemo(
    () =>
      JSON.stringify(currentCopy) !== JSON.stringify(pubCopy) ||
      JSON.stringify(cleanFaqs(items)) !== JSON.stringify(pubFaqs),
    [currentCopy, pubCopy, items, pubFaqs],
  );

  function update(i: number, field: keyof Faq, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function add() {
    setItems((prev) => [...prev, { q: "", a: "" }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: "up" | "down") {
    setItems((prev) => {
      const j = dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function persistDrafts(): Promise<boolean> {
    const r1 = await saveContentDraftAction("contact.copy", currentCopy);
    if ("error" in r1) {
      setError(r1.error);
      return false;
    }
    const r2 = await saveContentDraftAction("faqs", cleanFaqs(items));
    if ("error" in r2) {
      setError(r2.error);
      return false;
    }
    return true;
  }

  async function saveDraft(): Promise<boolean> {
    setError(null);
    setNotice(null);
    setPending(true);
    const ok = await persistDrafts();
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
    if (!(await persistDrafts())) {
      setPending(false);
      return;
    }
    const p1 = await publishContentAction("contact.copy");
    if ("error" in p1) {
      setPending(false);
      setError(p1.error);
      return;
    }
    const p2 = await publishContentAction("faqs");
    setPending(false);
    if ("error" in p2) {
      setError(p2.error);
      return;
    }
    setPubCopy(currentCopy);
    setPubFaqs(cleanFaqs(items));
    setConfirm(null);
    setNotice("Published - the Contact page is now live.");
  }

  async function doDiscard() {
    setError(null);
    setNotice(null);
    setPending(true);
    const d1 = await discardContentDraftAction("contact.copy");
    const d2 = await discardContentDraftAction("faqs");
    setPending(false);
    if ("error" in d1) {
      setError(d1.error);
      return;
    }
    if ("error" in d2) {
      setError(d2.error);
      return;
    }
    setHeroSubtitle(pubCopy.heroSubtitle);
    setQuoteHeading(pubCopy.quoteHeading);
    setQuoteBody(pubCopy.quoteBody);
    setItems(pubFaqs);
    setConfirm(null);
    setNotice("Discarded unpublished changes.");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-faint">
        <a href="/admin/content" className="transition-colors hover:text-ink">
          Content
        </a>
        <span aria-hidden>/</span>
        <span className="text-muted">Contact page</span>
      </nav>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
            Contact page
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
      </div>
      <p className="mt-1 text-sm text-faint">
        Edit the Contact page text and FAQs.
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

      {/* Copy */}
      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Page text</h2>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Hero subtitle</span>
            <textarea
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              rows={2}
              className={textareaCls}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Quote section heading</span>
            <TextInput value={quoteHeading} onChange={(e) => setQuoteHeading(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-muted">Quote section paragraph</span>
            <textarea
              value={quoteBody}
              onChange={(e) => setQuoteBody(e.target.value)}
              rows={3}
              className={textareaCls}
            />
          </label>
        </div>
      </section>

      {/* FAQs */}
      <section className="mt-4 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">FAQs</h2>
        <div className="mt-4 space-y-3">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
              <p className="text-sm text-muted">No FAQs</p>
              <p className="mt-1 text-xs text-faint">Add the first question.</p>
            </div>
          )}
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-line bg-subtle p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.65rem] font-medium uppercase tracking-[0.15em] text-faint">
                  Q{i + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <IconButton label="Move up" disabled={i === 0 || pending} onClick={() => move(i, "up")}>
                    <ChevronUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={i === items.length - 1 || pending}
                    onClick={() => move(i, "down")}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Remove" danger onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                <TextInput
                  value={item.q}
                  onChange={(e) => update(i, "q", e.target.value)}
                  placeholder="Question"
                />
                <textarea
                  value={item.a}
                  onChange={(e) => update(i, "a", e.target.value)}
                  rows={3}
                  placeholder="Answer"
                  className={textareaCls}
                />
              </div>
            </div>
          ))}
          <SmallButton variant="ghost" onClick={add} disabled={pending}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Add question
          </SmallButton>
        </div>
      </section>

      {/* Action bar */}
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
                ? "Publish the Contact page?"
                : "Discard unpublished changes?"}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirm === "publish"
                ? "The current text and FAQs will replace what visitors see on the Contact page."
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
