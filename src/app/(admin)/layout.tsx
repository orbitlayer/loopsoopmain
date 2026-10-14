import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  // The admin app must never be indexed or previewed publicly.
  robots: { index: false, follow: false, nocache: true },
};

// Render admin routes dynamically (never statically prerender/cache them) so a
// redeploy can't leave a cached page pointing at deleted CSS/JS chunk files.
export const dynamic = "force-dynamic";

/* Admin shell — layered near-black with a soft top glow. Self-contained, no
   public nav/footer. Rendered inside the minimal root <html>/<body>. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-bg text-muted">
      <div className="relative">{children}</div>
    </div>
  );
}
