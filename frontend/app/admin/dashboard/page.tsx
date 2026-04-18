"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { adminApi, dashboardApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKRCompact } from "@/lib/formatters";
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
      await adminApi.updateCommissionDefaults({ org_percent: orgPercent, agent_percent: agentPercent });
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
              <span className="text-[var(--muted)]">Agent Rate (%)</span>
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
