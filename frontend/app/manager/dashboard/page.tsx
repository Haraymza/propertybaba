"use client";

import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Building2, Handshake, Users } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { formatPKR, formatPKRCompact } from "@/lib/formatters";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function ManagerDashboardPage() {
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => dashboardApi.stats() });
  const s = statsQuery.data?.data;
  const chartData = [
    { name: "Customers", value: s?.total_customers ?? 0 },
    { name: "Properties", value: s?.total_properties ?? 0 },
    { name: "ActiveDeals", value: s?.active_deals ?? 0 },
    { name: "CompletedDeals", value: s?.completed_deals ?? 0 },
  ];

  return (
    <main className="space-y-6">
      <PageHeader title="Dashboard" description="Live overview of your CRM funnel and team activity." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={s?.total_customers ?? 0} hint="Current contacts" />
        <StatCard label="Properties" value={s?.total_properties ?? 0} hint="Inventory count" />
        <StatCard label="Active Deals" value={s?.active_deals ?? 0} hint="In progress" />
        <StatCard label="Completed Deals" value={s?.completed_deals ?? 0} hint="Closed" />
      </section>
      <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Performance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Revenue</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--foreground)]">{formatPKR(s?.total_revenue ?? 0)}</p>
              <p className="text-xs text-[var(--muted)]">{formatPKRCompact(s?.total_revenue ?? 0)}</p>
              <p className="muted mt-1">Total revenue from completed deals</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-[var(--accent)]" /> New customer intake trend stable</li>
              <li className="flex items-center gap-2"><Building2 className="h-4 w-4 text-[var(--accent)]" /> Property inventory healthy</li>
              <li className="flex items-center gap-2"><Handshake className="h-4 w-4 text-[var(--accent)]" /> Deal conversion improving</li>
              <li className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" /> Team actions visible in pipeline</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
