"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { superAdminApi } from "@/lib/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function SuperAdminDashboardPage() {
  const orgsQ = useQuery({
    queryKey: ["organizations"],
    queryFn: () => superAdminApi.listOrganizations(),
  });
  const pendingQ = useQuery({
    queryKey: ["pending-users"],
    queryFn: () => superAdminApi.listPendingUsers(),
  });
  const organizations = orgsQ.data?.data || [];
  const pendingUsers = useMemo(() => pendingQ.data?.data?.users || [], [pendingQ.data]);

  return (
    <main className="space-y-6">
      <PageHeader title="Dashboard Overview" description="Operational view for organization growth and approvals." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Organizations" value={organizations.length} hint="Active tenant accounts" />
        <StatCard label="Pending approvals" value={pendingUsers.length} hint="Users waiting for invite approval" />
        <StatCard label="Approval SLA" value="-" hint="Will update after enough approval history" />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Recent Pending Users</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingQ.isLoading ? <p className="text-sm text-[var(--muted)]">Loading pending users...</p> : null}
          {!pendingQ.isLoading && pendingUsers.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No pending users right now.</p>
          ) : null}
          {pendingUsers.length > 0 ? (
            <ul className="space-y-2">
              {pendingUsers.slice(0, 8).map((user) => (
                <li key={user._id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-[var(--muted)]">{user.phone}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
