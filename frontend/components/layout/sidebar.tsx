"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type IconType = React.ComponentType<{ className?: string }>;

export type NavItem = {
  label: string;
  href: string;
  icon: IconType;
};

export function Sidebar({
  nav,
  title,
  subtitle,
  activePath,
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: {
  nav: NavItem[];
  title: string;
  subtitle: string;
  activePath: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
}) {
  const navContent = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(79,70,229,0.12),rgba(79,70,229,0.04))] px-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_rgba(79,70,229,0.14),_rgba(79,70,229,0.06))] ring-1 ring-[color-mix(in_srgb,var(--accent)_24%,transparent)]">
              <Image src="/brand-logo.png" alt="Property Baba logo" width={26} height={26} className="rounded-md" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Property Baba</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
            </div>
          </div>
        ) : (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,_rgba(79,70,229,0.14),_rgba(79,70,229,0.06))] ring-1 ring-[color-mix(in_srgb,var(--accent)_24%,transparent)]">
            <Image src="/brand-logo.png" alt="PB" width={22} height={22} className="mx-auto rounded-md" />
          </span>
        )}
        <Button variant="ghost" onClick={onToggle} className="hidden h-8 w-8 px-0 lg:inline-flex">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {!collapsed ? <p className="muted px-4 pb-2">{subtitle}</p> : null}

      <nav className="space-y-1 px-2 py-3">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = activePath.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`app-sidebar-link ${active ? "app-sidebar-link-active" : ""} ${collapsed ? "justify-center px-2" : ""}`}
              title={item.label}
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
                <Icon className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              </span>
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <aside
        className={`app-sidebar sticky top-0 hidden h-screen border-r border-[var(--border)] bg-[var(--surface)] lg:block ${
          collapsed ? "w-[84px]" : "w-[280px]"
        } transition-all duration-300`}
      >
        {navContent}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onCloseMobile}
      />
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-[var(--border)] bg-[var(--surface)] transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
