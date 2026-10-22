/**
 * FooterNew — a clean monochrome footer on off-white (#f6f6f4).
 *
 * Studio blurb + Explore / Services / contact columns (all from props), a
 * bottom bar (copyright + legal), and a big interactive PARTICLE-TEXT
 * "Loopsoop" wordmark closing the page. Columns/bar are server-rendered;
 * the particle wordmark is a client island.
 */

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ParticleText } from "@/components/ui/ParticleText";

export type FooterNavItem = { label: string; href: string };

export interface FooterNewProps {
  navItems: FooterNavItem[];
  services: FooterNavItem[];
  email: string;
  socials: FooterNavItem[];
  ctaHref?: string;
  year: number;
  className?: string;
}

const STUDIO_BLURB =
  "A motion & film studio crafting cinematic stories, brand films and kinetic design for ambitious teams worldwide.";
const PARENT_LINE = "A creative division of OrbitLayer.";
const LEGAL_LINKS: FooterNavItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

const isInternal = (href: string) => href.startsWith("/");

function FooterLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (isInternal(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

export function FooterNew({
  navItems,
  services,
  email,
  socials,
  year,
  className,
}: FooterNewProps) {
  return (
    <footer
      className={cn(
        "relative overflow-hidden bg-[#f6f6f4] text-[#111111]",
        className,
      )}
    >
      <div
        aria-hidden
        className="h-px w-full"
        style={{ background: "rgba(17,17,17,0.08)" }}
      />

      <div className="relative z-10 mx-auto max-w-[1680px] px-5 pt-20 md:px-8 md:pt-24">
        {/* Columns. */}
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/loopmark.png"
                alt=""
                width={400}
                height={297}
                unoptimized
                className="h-9 w-auto"
              />
              <span className="font-logo text-[1.6rem] font-semibold tracking-[-0.03em] text-ink">
                Loopsoop
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              {STUDIO_BLURB}
            </p>
          </div>

          <nav aria-label="Explore" className="md:col-span-2">
            <h3 className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">
              Explore
            </h3>
            <ul className="mt-6 space-y-3.5">
              {navItems.map((item) => (
                <li key={item.href}>
                  <FooterLink
                    href={item.href}
                    className="inline-block text-sm text-ink/70 transition-colors hover:text-ink focus-visible:text-ink"
                  >
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Services" className="md:col-span-2">
            <h3 className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">
              Services
            </h3>
            <ul className="mt-6 space-y-3.5">
              {services.map((item) => (
                <li key={item.href}>
                  <FooterLink
                    href={item.href}
                    className="inline-block text-sm text-ink/70 transition-colors hover:text-ink focus-visible:text-ink"
                  >
                    {item.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-4">
            <h3 className="text-[0.7rem] uppercase tracking-[0.25em] text-muted">
              Contact
            </h3>
            <a
              href={`mailto:${email}`}
              className="mt-6 inline-block text-lg text-ink transition-colors hover:text-ink/70 focus-visible:text-ink/70 md:text-xl"
            >
              {email}
            </a>
            {socials.length > 0 ? (
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                {socials.map((social) => (
                  <li key={social.href}>
                    <FooterLink
                      href={social.href}
                      className="inline-block text-sm text-ink/70 transition-colors hover:text-ink focus-visible:text-ink"
                    >
                      {social.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        {/* Bottom bar. */}
        <div
          aria-hidden
          className="mt-12 h-px w-full md:mt-16"
          style={{ background: "rgba(17,17,17,0.08)" }}
        />
        <div className="mt-7 flex flex-col gap-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} Loopsoop. {PARENT_LINE} All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-ink focus-visible:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive particle-text wordmark. Extra bottom space below lg so the
          fixed mobile nav bar never sits on top of the wordmark. */}
      <div className="relative z-10 px-5 pb-28 pt-10 md:px-8 lg:pb-14">
        <ParticleText
          text="Loopsoop"
          color="#111111"
          className="h-[clamp(96px,20vw,240px)]"
        />
      </div>
    </footer>
  );
}
