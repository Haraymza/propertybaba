"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Building2, Handshake, Users, Shield, UserCheck, BarChart3 } from "lucide-react";
import { Sidebar, NavItem } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { dashboardApi } from "@/lib/api";

const iconByKey = {
  dashboard: LayoutDashboard,
  customers: Users,
  properties: Building2,
  deals: Handshake,
  team: Users,
  revenue: BarChart3,
  organizations: Building2,
  orgUsers: Shield,
  pendingUsers: UserCheck,
} as const;

type Key = keyof typeof iconByKey;

export function appNav(label: string, href: string, key: Key): NavItem {
  return { label, href, icon: iconByKey[key] };
}

export function AppLayout({
  title,
  subtitle,
  roleLabel,
  nav,
  userName,
  onLogout,
  children,
}: {
  title: string;
  subtitle: string;
  roleLabel: string;
  nav: NavItem[];
  userName: string;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar_collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const isSuperAdmin = roleLabel.toLowerCase().includes("super");
  const contextQ = useQuery({
    queryKey: ["dashboard-context"],
    queryFn: () => dashboardApi.context(),
    enabled: !isSuperAdmin,
  });

  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  const handleLogout = () => {
    onLogout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      <Sidebar
        nav={nav}
        title={title}
        subtitle={subtitle}
        activePath={pathname}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          roleLabel={roleLabel}
          userName={userName}
          organizationName={contextQ.data?.data?.organization_name}
          showOrganization={!isSuperAdmin}
          onToggleMobileSidebar={() => setMobileOpen((v) => !v)}
          onLogout={handleLogout}
        />
        <main className="min-w-0 flex-1 space-y-8 px-6 py-6 md:px-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}
