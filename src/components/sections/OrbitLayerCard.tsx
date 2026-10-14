import { site } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

/* Premium information card establishing the OrbitLayer parent relationship,
   placed near the bottom of the About page. */
export function OrbitLayerCard() {
  return (
    <Container>
      <Reveal className="overflow-hidden rounded-[24px] border border-line bg-subtle px-7 py-10 md:px-12 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <SectionLabel className="mb-4">Ecosystem</SectionLabel>
            <h2 className="font-display text-2xl font-medium leading-snug md:text-3xl">
              Part of the {site.parent.name} Ecosystem
            </h2>
          </div>
          <div className="flex flex-col items-start gap-6 md:items-end">
            <p className="max-w-md text-sm leading-relaxed text-muted md:text-right">
              Loopsoop operates under {site.parent.name}, giving clients access
              to a broader digital ecosystem that combines creative services with
              web development, AI automation, campaign strategy, and performance
              marketing.
            </p>
            <Button href={site.parent.url} variant="outline">
              Visit {site.parent.name}
            </Button>
          </div>
        </div>
      </Reveal>
    </Container>
  );
}
