"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { submitInquiryAction } from "@/lib/inquiries-actions";
import { Button } from "@/components/ui/Button";

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-ink/30 focus:ring-2 focus:ring-ink/10";
const labelCls = "mb-1.5 block text-xs font-medium text-muted";

/*
 * Public contact form. Submits to the stored inquiries inbox via a public
 * Server Action. WhatsApp remains the primary channel; this is the "prefer a
 * form" alternative. Includes a honeypot field for basic bot protection.
 */
export function ContactForm({ projectTypes }: { projectTypes: string[] }) {
  const [state, action, pending] = useActionState(submitInquiryAction, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-[20px] border border-line bg-surface p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white">
          <Check className="h-6 w-6" strokeWidth={2} />
        </span>
        <h3 className="mt-5 font-display text-xl font-medium text-ink">
          Message sent
        </h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Thanks for reaching out - we&apos;ve received your message and will get
          back to you soon, usually within a few hours.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-[20px] border border-line bg-surface p-6 md:p-8"
    >
      {/* Honeypot: hidden from users; bots that fill it are silently dropped. */}
      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Name</span>
          <input name="name" required maxLength={200} placeholder="Your name" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Email</span>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder="you@example.com"
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Phone (optional)</span>
          <input name="phone" maxLength={40} placeholder="+91 …" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Project type (optional)</span>
          <select name="project_type" defaultValue="" className={inputCls}>
            <option value="">Select a service</option>
            {projectTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className={labelCls}>Message</span>
        <textarea
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="Tell us about your project - length, style, deadline…"
          className={inputCls}
        />
      </label>

      {state?.error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-sm text-red-600"
        >
          {state.error}
        </p>
      )}

      <div className="mt-6">
        <Button type="submit" disabled={pending} arrow={!pending}>
          {pending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
