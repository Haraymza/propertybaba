"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { adminApi, dashboardApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKRCompact } from "@/lib/formatters";
import { toRequiredNumber } from "@/lib/validators";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";

export default function AdminDashboardPage() {
  const q = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => dashboardApi.stats() });
  const defaultsQ = useQuery({ queryKey: ["commission-defaults"], queryFn: () => adminApi.getCommissionDefaults() });
  const s = q.data?.data;
  const [orgPercent, setOrgPercent] = useState(10);
  const [agentPercent, setAgentPercent] = useState(2);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [error, setError] = useState("");
  const sampleDealAmount = 10_000_000;

  useEffect(() => {
    const defaults = defaultsQ.data?.data;
    if (!defaults) return;
    setOrgPercent(defaults.org_percent);
    setAgentPercent(defaults.agent_percent);
  }, [defaultsQ.data]);

  const updateDefaults = async () => {
    setSavingDefaults(true);
    setError("");
    try {
      const safeOrgPercent = toRequiredNumber("Organization rate", orgPercent, { min: 0, max: 100 });
      const safeAgentPercent = toRequiredNumber("Agent rate", agentPercent, { min: 0, max: 100 });
      await adminApi.updateCommissionDefaults({ org_percent: safeOrgPercent, agent_percent: safeAgentPercent });
      await defaultsQ.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update commission defaults"));
    } finally {
      setSavingDefaults(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Admin Dashboard" description="Track team performance and operational outcomes." />
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Customers" value={s?.total_customers ?? 0} />
        <StatCard label="Properties" value={s?.total_properties ?? 0} />
        <StatCard label="Deals" value={s?.total_deals ?? 0} />
        <StatCard label="Revenue" value={formatPKRCompact(s?.total_revenue ?? 0)} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Default Commission Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Organization Rate (%)</span>
              <Input type="number" value={orgPercent} onChange={(e) => setOrgPercent(Number(e.target.value || 0))} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-[var(--muted)]">Agent Rate (% of deal value)</span>
              <Input type="number" value={agentPercent} onChange={(e) => setAgentPercent(Number(e.target.value || 0))} />
            </label>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button onClick={updateDefaults} disabled={savingDefaults}>
            {savingDefaults ? "Saving..." : "Save Defaults"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>How Commission Is Calculated</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-[var(--muted)]">These formulas are used whenever a deal uses default commission settings.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="font-medium">Organization Revenue</p>
              <p className="mt-1 text-[var(--muted)]">Deal Amount x Organization Rate (%)</p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="font-medium">Agent Commission</p>
              <p className="mt-1 text-[var(--muted)]">Deal Amount x Agent Rate (%)</p>
            </div>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
            <p className="font-medium">Organization Profit</p>
            <p className="mt-1 text-[var(--muted)]">Organization Revenue - Agent Commission</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Example (Deal Amount: {sampleDealAmount.toLocaleString()})</p>
            <p className="mt-1 text-[var(--muted)]">
              Organization Revenue: {sampleDealAmount.toLocaleString()} x {orgPercent}% ={" "}
              {((sampleDealAmount * orgPercent) / 100).toLocaleString()}
            </p>
            <p className="text-[var(--muted)]">
              Agent Commission: {sampleDealAmount.toLocaleString()} x {agentPercent}% ={" "}
              {((sampleDealAmount * agentPercent) / 100).toLocaleString()}
            </p>
            <p className="text-[var(--muted)]">
              Organization Profit: {((sampleDealAmount * orgPercent) / 100).toLocaleString()} -{" "}
              {((sampleDealAmount * agentPercent) / 100).toLocaleString()} ={" "}
              {((sampleDealAmount * orgPercent) / 100 - (sampleDealAmount * agentPercent) / 100).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" /> Team dashboard refreshed with latest metrics.</p>
          <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" /> Customer and property trends are healthy.</p>
          <p className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--accent)]" /> Deals close-rate summary available in pipeline.</p>
        </CardContent>
      </Card>
    </main>
  );
}
