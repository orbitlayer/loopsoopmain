"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, demoLoginAction } from "@/lib/actions";
import { Button, Field, TextInput } from "@/components/admin/ui";

/*
 * LoginForm — the admin sign-in form. When no database is connected (`demo`),
 * it also offers a "demo mode" entry so the browser-storage CMS can be used
 * before hosting is wired up. The `demo` flag is decided on the server.
 */

function DemoButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" disabled={pending} className="w-full">
      {pending ? "Entering…" : "Continue in demo mode"}
    </Button>
  );
}

export function LoginForm({ demo }: { demo: boolean }) {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-logo text-2xl font-bold tracking-[-0.02em] text-ink">
            Loopsoop
          </p>
          <p className="mt-2 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-muted">
            Admin Panel
          </p>
        </div>

        <form
          action={action}
          className="rounded-[20px] border border-line bg-surface p-6 shadow-xl shadow-black/5 sm:p-7"
        >
          <h1 className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
            Sign in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage the Loopsoop website.
          </p>

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <TextInput
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <TextInput
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>
          </div>

          {state?.error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-600"
            >
              {state.error}
            </p>
          )}

          <Button type="submit" disabled={pending} className="mt-6 w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        {demo ? (
          <div className="mt-4">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[0.65rem] uppercase tracking-[0.2em] text-faint">
                No database yet
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <form action={demoLoginAction} className="mt-4">
              <DemoButton />
            </form>
            <p className="mt-2 text-center text-[0.7rem] text-faint">
              Explore the admin with demo data saved in this browser.
            </p>
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-faint">
          Protected area · authorised administrators only
        </p>
      </div>
    </div>
  );
}
