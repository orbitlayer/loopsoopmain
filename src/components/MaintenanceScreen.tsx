import { site } from "@/lib/data";

/*
 * Public maintenance screen. Shown to visitors (not admins) when Maintenance
 * Mode is ON. Deliberately self-contained: no nav/footer, no data fetching, no
 * contact links — just a calm, on-brand "back soon" message.
 */
export function MaintenanceScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16 text-center">
      <span className="font-logo text-2xl font-bold tracking-[-0.02em] text-ink">
        {site.name}
      </span>
      <span className="mt-3 block h-px w-12 bg-ink/20" />
      <h1 className="mt-8 font-display text-3xl font-medium tracking-[-0.02em] text-ink md:text-4xl">
        We&apos;ll be back soon
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
        {message}
      </p>
      <p className="mt-10 text-xs uppercase tracking-[0.2em] text-faint">
        {site.tagline}
      </p>
    </div>
  );
}
