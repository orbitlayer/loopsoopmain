"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Clapperboard,
  FileText,
  Globe,
  Image as ImageIcon,
  Inbox,
  ClipboardList,
  Receipt,
  ScrollText,
  Shapes,
  SlidersHorizontal,
  LogOut,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { site } from "@/lib/data";

/*
 * AdminShell — the shared control-room chrome for every admin page.
 *   top bar   : brand · mobile-nav toggle · profile menu (view site / log out)
 *   sidebar   : app-level navigation, grouped (Overview / Website / System)
 *   main      : the page's own content (passed as children)
 * Light visual language matching the public site (see ui.tsx).
 */

type NavItem = { key: string; label: string; href: string; icon: LucideIcon };
type NavGroup = { group: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    group: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Website",
    items: [
      { key: "content", label: "Content", href: "/admin/content", icon: FileText },
      { key: "categories", label: "Categories", href: "/admin/categories", icon: Shapes },
      { key: "seo", label: "SEO", href: "/admin/seo", icon: Globe },
      { key: "media", label: "Media", href: "/admin/media", icon: ImageIcon },
      { key: "portfolio", label: "Portfolio", href: "/admin/portfolio", icon: Clapperboard },
    ],
  },
  {
    group: "Management",
    items: [
      { key: "inquiries", label: "Inquiries", href: "/admin/inquiries", icon: Inbox },
    ],
  },
  {
    group: "Billing",
    items: [
      { key: "quotations", label: "Quotations", href: "/admin/quotations", icon: ClipboardList },
      { key: "invoices", label: "Invoices", href: "/admin/invoices", icon: Receipt },
    ],
  },
  {
    group: "System",
    items: [
      { key: "controls", label: "Controls", href: "/admin/controls", icon: SlidersHorizontal },
      { key: "activity", label: "Activity", href: "/admin/activity", icon: ScrollText },
    ],
  },
];

function NavList({
  active,
  onNavigate,
}: {
  active: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {NAV.map((group) => (
        <div key={group.group}>
          <p className="px-3 pb-1.5 text-[0.65rem] font-medium uppercase tracking-[0.15em] text-faint">
            {group.group}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ink/20 ${
                    isActive
                      ? "bg-subtle font-medium text-ink"
                      : "text-muted hover:bg-subtle hover:text-ink"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-ink" : "text-faint group-hover:text-ink"}`}
                    strokeWidth={1.75}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  email,
  active,
  children,
}: {
  email: string | null;
  active: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setNavOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  async function logout() {
    await logoutAction();
    router.replace("/admin/login");
    router.refresh();
  }

  const initial = (email?.trim()?.[0] ?? "A").toUpperCase();

  return (
    <div className="min-h-screen">
      {/* ----------------------------------------------------------- Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted outline-none transition-colors hover:bg-subtle hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-baseline gap-2">
            <span className="font-logo text-lg font-bold tracking-[-0.02em] text-ink">
              Loopsoop
            </span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.18em] text-faint">
              Admin
            </span>
          </div>

          {/* Profile menu */}
          <div className="relative ml-auto" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2.5 text-sm text-muted outline-none transition-colors hover:border-ink/20 hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
                {initial}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/10"
              >
                <div className="px-3 py-2">
                  <p className="text-[0.65rem] uppercase tracking-[0.15em] text-faint">
                    Signed in as
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink">
                    {email ?? "Admin"}
                  </p>
                </div>
                <div className="my-1 h-px bg-line" />
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted outline-none transition-colors hover:bg-subtle hover:text-ink focus-visible:bg-subtle"
                >
                  <ExternalLink className="h-4 w-4" /> View live site
                </a>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted outline-none transition-colors hover:bg-subtle hover:text-ink focus-visible:bg-subtle"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        {/* --------------------------------------------------- Desktop sidebar */}
        <aside className="hidden border-r border-line lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:overflow-y-auto lg:px-3 lg:py-6">
          <NavList active={active} />
        </aside>

        {/* ---------------------------------------------------- Mobile drawer */}
        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setNavOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] overflow-y-auto border-r border-line bg-surface px-3 py-4">
              <div className="mb-4 flex items-center justify-between px-3">
                <span className="font-logo text-lg font-bold tracking-[-0.02em] text-ink">
                  Loopsoop
                </span>
                <button
                  type="button"
                  onClick={() => setNavOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-muted outline-none transition-colors hover:bg-subtle hover:text-ink focus-visible:ring-2 focus-visible:ring-ink/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList active={active} onNavigate={() => setNavOpen(false)} />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- Main area */}
        <main className="min-w-0 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
