"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  saveContentDraftAction,
  publishContentAction,
} from "@/lib/content-actions";
import { Button, Field, SelectInput, Switch, TextInput } from "./ui";

type SeoFields = {
  title: string;
  description: string;
  ogImage: string;
  noindex: boolean;
};
type SeoPage = {
  key: string;
  label: string;
  path: string;
  defaultTitle: string;
  defaultDescription: string;
  seo: SeoFields;
};

const textareaCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

/*
 * SEO manager. Per-page title/description/OG-image/no-index overrides. Empty
 * fields fall back to the page's built-in defaults (shown as placeholders).
 * Saving publishes immediately (SEO has no useful draft state). Canonical URLs
 * stay code-controlled and are never editable here.
 */
export function SeoClient({
  pages,
  baseUrl,
}: {
  pages: SeoPage[];
  baseUrl: string;
}) {
  const [selectedKey, setSelectedKey] = useState(pages[0]?.key ?? "");
  const [values, setValues] = useState<Record<string, SeoFields>>(() =>
    Object.fromEntries(pages.map((p) => [p.key, p.seo])),
  );
  const [baseline, setBaseline] = useState<Record<string, SeoFields>>(() =>
    Object.fromEntries(pages.map((p) => [p.key, p.seo])),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const page = pages.find((p) => p.key === selectedKey) ?? pages[0];
  const v = values[selectedKey] ?? { title: "", description: "", ogImage: "", noindex: false };
  const dirty = useMemo(
    () => JSON.stringify(v) !== JSON.stringify(baseline[selectedKey]),
    [v, baseline, selectedKey],
  );

  function set(field: keyof SeoFields, value: string | boolean) {
    setNotice(null);
    setValues((prev) => ({
      ...prev,
      [selectedKey]: { ...prev[selectedKey], [field]: value },
    }));
  }

  async function save() {
    setError(null);
    setNotice(null);
    setPending(true);
    const draft = await saveContentDraftAction(`seo.${selectedKey}`, v);
    if ("error" in draft) {
      setPending(false);
      setError(draft.error);
      return;
    }
    const pub = await publishContentAction(`seo.${selectedKey}`);
    setPending(false);
    if ("error" in pub) {
      setError(pub.error);
      return;
    }
    setBaseline((prev) => ({ ...prev, [selectedKey]: v }));
    setNotice(`Saved SEO for the ${page?.label} page.`);
  }

  const previewTitle = v.title || page?.defaultTitle || "";
  const previewDesc = v.description || page?.defaultDescription || "";
  const previewUrl = `${baseUrl}${page?.path === "/" ? "" : page?.path}`;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-subtle text-muted">
          <Search className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-medium tracking-[-0.02em] text-ink">
            SEO
          </h1>
          <p className="text-sm text-faint">
            Search &amp; social metadata per page. Blank fields use the built-in
            defaults.
          </p>
        </div>
      </div>

      <div className="mt-6 max-w-xs">
        <Field label="Page">
          <SelectInput
            value={selectedKey}
            onChange={(e) => {
              setSelectedKey(e.target.value);
              setNotice(null);
              setError(null);
            }}
          >
            {pages.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

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

      {/* Search preview */}
      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-faint">
          Search preview
        </p>
        <p className="truncate text-xs text-muted">{previewUrl}</p>
        <p className="mt-1 truncate text-lg font-medium text-ink">
          {previewTitle}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{previewDesc}</p>
      </div>

      <section className="mt-4 space-y-4 rounded-2xl border border-line bg-surface p-5">
        <Field label="SEO title" hint={`Default: ${page?.defaultTitle}`}>
          <TextInput
            value={v.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={page?.defaultTitle}
          />
        </Field>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-muted">
            Meta description
          </span>
          <textarea
            value={v.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
            placeholder={page?.defaultDescription}
            className={textareaCls}
          />
        </label>
        <Field
          label="Social share image URL (optional)"
          hint="Used for Open Graph / Twitter cards. Leave blank to use the default."
        >
          <TextInput
            value={v.ogImage}
            onChange={(e) => set("ogImage", e.target.value)}
            placeholder="https://…/share-image.jpg"
          />
        </Field>
        <div className="rounded-xl border border-line bg-subtle px-4 py-3">
          <Switch
            label="Hide this page from search engines (no-index)"
            checked={v.noindex}
            onChange={(val) => set("noindex", val)}
          />
        </div>
      </section>

      <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
        <Button onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save & publish"}
        </Button>
        {dirty && <span className="text-xs text-faint">Unsaved changes</span>}
      </div>
    </div>
  );
}
