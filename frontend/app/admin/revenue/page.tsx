"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { formatPKR, formatPKRCompact } from "@/lib/formatters";
import { assertEnum } from "@/lib/validators";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popup, PopupContent } from "@/components/ui/popup";
import { Select } from "@/components/ui/select";

export default function AdminRevenuePage() {
  const [window, setWindow] = useState<"all" | "month">("all");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ["admin-revenue", window],
    queryFn: () => adminApi.agentRevenue({ window }),
  });
  const dealsQ = useQuery({
    queryKey: ["admin-revenue-agent-deals", selectedAgentId, window],
    queryFn: () => adminApi.agentRevenueDeals(selectedAgentId as string, { window }),
    enabled: Boolean(selectedAgentId),
  });

  const totals = useMemo(() => {
    const rows = q.data?.data || [];
    return rows.reduce(
      (acc, row) => {
        acc.completedDeals += row.completed_deals;
        acc.grossRevenue += row.gross_revenue;
        acc.orgProfit += row.org_commission_total;
        acc.agentCommissions += row.agent_commission_total;
        return acc;
      },
      { completedDeals: 0, grossRevenue: 0, orgProfit: 0, agentCommissions: 0 },
    );
  }, [q.data]);
  const selectedAgent = useMemo(
    () => (q.data?.data || []).find((row) => row.user_id === selectedAgentId) || null,
    [q.data, selectedAgentId],
  );

  return (
    <main className="space-y-6">
      <PageHeader title="Revenue & Commissions" description="Track per-agent revenue outcomes and commission splits." />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Agent Performance</CardTitle>
            <Select value={window} onChange={(e) => setWindow(assertEnum("Window", e.target.value, ["all", "month"] as const))} className="w-[180px]">
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
            <p className="text-xs text-[var(--muted)]">Gross Revenue</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.grossRevenue)}</p>
            <p className="text-xs text-[var(--muted)]">{formatPKRCompact(totals.grossRevenue)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Org Profit</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.orgProfit)}</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="text-xs text-[var(--muted)]">Agent Commissions</p>
            <p className="text-xl font-semibold text-[var(--foreground)]">{formatPKR(totals.agentCommissions)}</p>
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
                  <th>Gross Revenue</th>
                  <th>Org Profit</th>
                  <th>Agent Commissions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data?.data || []).map((row) => (
                  <tr
                    key={`${row.user_id || row.agent_name}`}
                    className={`cursor-pointer hover:bg-[var(--surface-muted)] ${selectedAgentId === row.user_id ? "bg-[var(--surface-muted)]" : ""}`}
                    onClick={() => setSelectedAgentId(row.user_id || null)}
                  >
                    <td className="font-medium">{row.agent_name}</td>
                    <td>{row.agent_phone || "-"}</td>
                    <td>{row.completed_deals}</td>
                    <td className="font-semibold text-[var(--foreground)]">{formatPKR(row.gross_revenue)}</td>
                    <td>{formatPKR(row.org_commission_total)}</td>
                    <td>{formatPKR(row.agent_commission_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Popup open={Boolean(selectedAgent)} onOpenChange={(open) => !open && setSelectedAgentId(null)}>
        <PopupContent title={selectedAgent ? `${selectedAgent.agent_name} - Deal Breakdown` : "Deal Breakdown"} className="max-w-6xl">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Completed On</th>
                  <th>Property</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Deal Value</th>
                  <th>Org Profit</th>
                  <th>Agent Commission</th>
                  <th>Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(dealsQ.data?.data || []).map((deal) => (
                  <tr key={deal.deal_id}>
                    <td>{deal.date_completed ? new Date(deal.date_completed).toLocaleDateString() : "-"}</td>
                    <td className="font-medium">{deal.property_title || "-"}</td>
                    <td>{deal.customer_name || "-"}</td>
                    <td className="capitalize">{deal.deal_type || "-"}</td>
                    <td>{formatPKR(deal.deal_value)}</td>
                    <td>{formatPKR(deal.org_commission)}</td>
                    <td>{formatPKR(deal.agent_commission)}</td>
                    <td>{formatPKR(deal.gross_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selectedAgent && (dealsQ.data?.data || []).length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">No completed deals for this agent in the selected period.</p>
          ) : null}
        </PopupContent>
      </Popup>
    </main>
  );
}
