"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { formatPKR, formatPKRCompact } from "@/lib/formatters";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

export default function AdminRevenuePage() {
  const [window, setWindow] = useState<"all" | "month">("all");
  const q = useQuery({
    queryKey: ["admin-revenue", window],
    queryFn: () => adminApi.agentRevenue({ window }),
  });

  const totals = useMemo(() => {
    const rows = q.data?.data || [];
    return rows.reduce(
      (acc, row) => {
        acc.completedDeals += row.completed_deals;
        acc.grossValue += row.gross_deal_value;
        acc.orgCommission += row.org_commission_total;
        acc.agentCommission += row.agent_commission_total;
        return acc;
      },
      { completedDeals: 0, grossValue: 0, orgCommission: 0, agentCommission: 0 },
    );
  }, [q.data]);

  return (
    <main className="space-y-6">
      <PageHeader title="Revenue & Commissions" description="Track per-agent revenue outcomes and commission splits." />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Agent Performance</CardTitle>
            <Select value={window} onChange={(e) => setWindow(e.target.value as "all" | "month")} className="w-[180px]">
              <option value="all">All time</option>
              <option value="month">This month</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Completed Deals</p>
            <p className="text-xl font-semibold">{totals.completedDeals}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Gross Deal Value</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.grossValue)}</p>
            <p className="text-xs text-[var(--muted)]">{formatPKRCompact(totals.grossValue)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Org Commission</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.orgCommission)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Agent Commission</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.agentCommission)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>By Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Agent</th>
                  <th>Phone</th>
                  <th>Completed Deals</th>
                  <th>Gross Value</th>
                  <th>Org Commission</th>
                  <th>Agent Commission</th>
                </tr>
              </thead>
              <tbody>
                {(q.data?.data || []).map((row) => (
                  <tr key={`${row.user_id || row.agent_name}`}>
                    <td className="font-medium">{row.agent_name}</td>
                    <td>{row.agent_phone || "-"}</td>
                    <td>{row.completed_deals}</td>
                    <td className="font-semibold text-[var(--foreground)]">{formatPKR(row.gross_deal_value)}</td>
                    <td>{formatPKR(row.org_commission_total)}</td>
                    <td>{formatPKR(row.agent_commission_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
