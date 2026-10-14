import { Container } from "@/components/ui/Container";

/* Shown while the portfolio server-fetches from Supabase. Mirrors the WorkGrid
   layout (filter bar + long-form grid) so there's no layout jump. */
export default function PortfolioLoading() {
  return (
    <section className="pb-8 pt-32 md:pt-36" aria-busy="true">
      <Container>
        <div className="flex gap-2 overflow-hidden border-b border-line pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-subtle"
            />
          ))}
        </div>

        <div className="mt-12">
          <div className="mb-6 h-6 w-40 animate-pulse rounded bg-subtle" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-[20px] bg-subtle"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
