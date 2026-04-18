"use client";

import { useState } from "react";
import { Building2, UserCircle2, ChevronDown, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function Topbar({
  roleLabel,
  userName,
  organizationName,
  showOrganization,
  onToggleMobileSidebar,
  onLogout,
}: {
  roleLabel: string;
  userName: string;
  organizationName?: string | null;
  showOrganization: boolean;
  onToggleMobileSidebar: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(79,70,229,0.12),rgba(79,70,229,0.03))] backdrop-blur">
      <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-3 px-6 md:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="secondary" onClick={onToggleMobileSidebar} className="h-9 w-9 px-0 lg:hidden">
            <Menu className="h-4 w-4" />
          </Button>
          <div className="h-5" />
        </div>

        {showOrganization ? (
          <div className="mx-auto hidden min-w-0 items-center justify-center gap-2 md:flex">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
              <Building2 className="h-4 w-4 text-[var(--accent)]" />
            </span>
            <p className="truncate text-center text-base font-semibold md:text-lg">{organizationName || "Loading organization..."}</p>
          </div>
        ) : (
          <div />
        )}

        <div className="relative flex items-center justify-end gap-2">
          <ThemeToggle />
          <Button variant="secondary" className="gap-2" onClick={() => setOpen((v) => !v)}>
            <UserCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">{userName}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          {open ? (
            <div className="absolute right-0 top-12 w-56 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
              <div className="mb-2 rounded-md bg-[var(--surface-muted)] p-2">
                <p className="text-sm font-medium">{userName}</p>
                <Badge className="mt-1">{roleLabel}</Badge>
              </div>
              <Button variant="ghost" className="w-full justify-start gap-2" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
