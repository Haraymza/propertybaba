"use client";

import { AppShell, appNav } from "@/components/layout/app-shell";
import { useAuthStore } from "@/store/auth-store";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, clearSession } = useAuthStore();

  if (!user || user.role === "super_admin" || user.admin_flag) {
    return (
      <main className="px-6 py-8 md:px-8 xl:px-10">
        <p className="muted">Manager access required.</p>
      </main>
    );
  }

  return (
    <AppShell
      title="Manager Workspace"
      subtitle="Pipeline and execution view"
      roleLabel="Manager"
      userName={user.name}
      onLogout={clearSession}
      nav={[
        appNav("Dashboard", "/manager/dashboard", "dashboard"),
        appNav("Customers", "/manager/customers", "customers"),
        appNav("Properties", "/manager/properties", "properties"),
        appNav("Deals", "/manager/deals", "deals"),
      ]}
    >
      {children}
    </AppShell>
  );
}
