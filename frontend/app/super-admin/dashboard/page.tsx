"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

const monthlySeries = [
  { month: "Jan", organizations: 2, approvals: 4 },
  { month: "Feb", organizations: 3, approvals: 7 },
  { month: "Mar", organizations: 4, approvals: 6 },
  { month: "Apr", organizations: 6, approvals: 11 },
];

export default function SuperAdminDashboardPage() {
  return (
    <main className="space-y-6">
      <PageHeader title="Dashboard Overview" description="Operational view for organization growth and approvals." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Organizations" value={6} hint="Active tenant accounts" />
        <StatCard label="Pending approvals" value={11} hint="Users waiting for invite approval" />
        <StatCard label="Approval SLA" value="Under 24h" hint="Median handling time" />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Monthly Organization and Approval Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="organizations" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="approvals" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </main>
  );
}
