"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCheck } from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

type PendingUser = { _id: string; name: string; phone: string };
type Organization = { _id: string; name: string };

export default function PendingUsersPage() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedOrgByUser, setSelectedOrgByUser] = useState<Record<string, string>>({});

  const pendingQuery = useQuery({
    queryKey: ["pending-users"],
    queryFn: () => superAdminApi.listPendingUsers(),
  });
  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => superAdminApi.listOrganizations(),
  });

  const organizations = useMemo(() => (orgsQuery.data?.data || []) as Organization[], [orgsQuery.data]);
  const users = useMemo(() => (pendingQuery.data?.data?.users || []) as PendingUser[], [pendingQuery.data]);

  const approve = async (userId: string) => {
    setError("");
    setMessage("");
    try {
      const orgId = selectedOrgByUser[userId];
      if (!orgId) throw new Error("Please select an organization first");
      await superAdminApi.assignOrganization(userId, orgId);
      await superAdminApi.approveUser(userId);
      setMessage("User assigned and approved");
      await pendingQuery.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to approve user"));
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Pending Users" description="Approve users after organization assignment." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-[var(--accent)]" />
            Pending Users
          </CardTitle>
          <p className="muted">Assign each user to an organization, then approve access.</p>
        </CardHeader>
        <CardContent className="space-y-4">
      {message ? <p className="text-sm text-green-600">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-3">
        {users.map((user) => (
              <li key={user._id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-sm text-zinc-600">{user.phone}</p>
                </div>
                <Badge className="bg-amber-50 text-amber-700">Pending</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Select
                value={selectedOrgByUser[user._id] || ""}
                onChange={(e) => setSelectedOrgByUser((prev) => ({ ...prev, [user._id]: e.target.value }))}
                    className="min-w-56"
              >
                <option value="">Select organization</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
                  </Select>
                  <Button onClick={() => approve(user._id)}>
                Assign + Approve
                  </Button>
            </div>
          </li>
        ))}
      </ul>
        </CardContent>
      </Card>
    </main>
  );
}
