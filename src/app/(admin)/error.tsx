"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

/*
 * Error boundary for the admin app. Turns an unexpected render/runtime error
 * into a recoverable, on-brand screen (instead of the browser's blank "couldn't
 * load" page) and exposes the error digest so it can be traced in the logs.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-medium tracking-[-0.02em] text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        This admin page hit an unexpected error. Try again, or head back to the
        sign-in screen.
      </p>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black"
        >
          Try again
        </button>
        <Link
          href="/admin/login"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-ink/20 hover:text-ink"
        >
          Back to sign in
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-faint">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </div>
  );
}
