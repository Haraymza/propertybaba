"use client";

import { AppShell, appNav } from "@/components/layout/app-shell";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, clearSession } = useAuthStore();

  if (!user || user.role === "super_admin" || !user.admin_flag) {
    return (
      <main className="px-6 py-8 md:px-8 xl:px-10">
        <p className="muted">Admin access required.</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Admin Workspace"
      subtitle="Organization controls and operations"
      roleLabel="Admin"
      userName={user.name}
      onLogout={clearSession}
      nav={[
        appNav("Dashboard", "/admin/dashboard", "dashboard"),
        appNav("Customers", "/admin/customers", "customers"),
        appNav("Properties", "/admin/properties", "properties"),
        appNav("Deals", "/admin/deals", "deals"),
        appNav("Revenue", "/admin/revenue", "revenue"),
        appNav("Team", "/admin/team", "team"),
      ]}
    >
      {children}
    </AppShell>
  );
}
