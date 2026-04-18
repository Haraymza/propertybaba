"use client";

import Link from "next/link";
import { AppShell, appNav } from "@/components/layout/app-shell";
import { useAuthStore } from "@/store/auth-store";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, clearSession } = useAuthStore();

  if (!user || user.role !== "super_admin") {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
        <div className="space-y-4 text-center">
          <p>Super admin access required.</p>
          <Link className="underline" href="/login">
            Go to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      title="Super Admin Console"
      subtitle="System-wide governance"
      roleLabel="Super Admin"
      userName={user.name}
      onLogout={clearSession}
      nav={[
        appNav("Dashboard", "/super-admin/dashboard", "dashboard"),
        appNav("Organizations", "/super-admin/organizations", "organizations"),
        appNav("Org Users", "/super-admin/users", "orgUsers"),
        appNav("Pending Users", "/super-admin/pending-users", "pendingUsers"),
      ]}
    >
      {children}
    </AppShell>
  );
}
