"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * Shared admin UI primitives. One source of truth for toggles, buttons, inputs
 * and selects so every control in the dashboard + modals is visually and
 * behaviourally consistent.
 *
 * Light visual language matching the public site (globals.css tokens):
 *   surfaces  bg-bg (page) / bg-surface (cards) / bg-subtle (insets, hovers)
 *   text      text-ink / text-muted / text-faint
 *   hairlines border-line
 *   pills     rounded-full, primary = ink-on-white (the site's black button)
 * Monochrome to match the brand; red is reserved for errors + destructive acts.
 */

/* ------------------------------------------------------------------ Switch */
export function Switch({
  checked,
  onChange,
  disabled,
  label,
  srLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label?: string;
  srLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label ? undefined : srLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full text-sm text-muted outline-none disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-ink/20",
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition-colors duration-200",
          checked ? "bg-ink" : "bg-ink/15",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
      {label && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ Button */
type ButtonVariant = "primary" | "ghost" | "danger";

const BTN_BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-50";
const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-black",
  ghost: "border border-line text-ink hover:bg-subtle",
  danger: "bg-red-500 text-white hover:bg-red-600",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cn(BTN_BASE, "px-5 py-2.5", BTN_VARIANT[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/** Compact button (e.g. the per-section "Add" action). */
export function SmallButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={cn(BTN_BASE, "px-3.5 py-1.5 text-xs", BTN_VARIANT[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------- IconButton */
export function IconButton({
  label,
  danger,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-faint outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 disabled:opacity-30",
        danger
          ? "hover:bg-red-500/10 hover:text-red-600"
          : "hover:bg-subtle hover:text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Fields */
const CONTROL =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-faint hover:border-ink/20 focus:border-ink/40 focus:ring-2 focus:ring-ink/10";

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-muted">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={cn(CONTROL, props.className)} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(CONTROL, "cursor-pointer appearance-none pr-9", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
    </div>
  );
}
