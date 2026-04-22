"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { superAdminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { assertEnum, toOptionalText, toRequiredText } from "@/lib/validators";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function SuperAdminDashboardPage() {
  const [createName, setCreateName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState("manager");
  const [createOrgId, setCreateOrgId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createMessage, setCreateMessage] = useState("");

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

  const onCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateMessage("");
    setCreateLoading(true);
    try {
      const safeName = toRequiredText("Name", createName);
      const safePhone = toRequiredText("Phone", createPhone);
      const safePassword = toRequiredText("Password", createPassword);
      const safeEmail = toOptionalText(createEmail);
      const safeRole = assertEnum("Role", createRole, ["manager", "admin"] as const);
      const safeOrgId = toRequiredText("Organization", createOrgId);
      await superAdminApi.createUser({
        name: safeName,
        phone: safePhone,
        email: safeEmail,
        password: safePassword,
        role: safeRole,
        organization_id: safeOrgId,
        is_approved: true,
      });
      setCreateMessage("User created successfully.");
      setCreateName("");
      setCreatePhone("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("manager");
      await pendingQ.refetch();
    } catch (err: unknown) {
      setCreateError(getApiErrorMessage(err, "Failed to create user"));
    } finally {
      setCreateLoading(false);
    }
  };

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
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreateUser} className="grid gap-3 md:grid-cols-2">
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Full name" required />
            <Input value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} placeholder="Phone" required />
            <Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Email (optional)" />
            <Input value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Password" type="password" required />
            <Select value={createRole} onChange={(e) => setCreateRole(e.target.value)}>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </Select>
            <Select value={createOrgId} onChange={(e) => setCreateOrgId(e.target.value)} required>
              <option value="">Select organization</option>
              {organizations.map((org: { _id: string; name: string }) => (
                <option key={org._id} value={org._id}>
                  {org.name}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2 flex items-center gap-2">
              <Button disabled={createLoading}>{createLoading ? "Creating..." : "Create User"}</Button>
              {createMessage ? <p className="text-sm text-green-600">{createMessage}</p> : null}
              {createError ? <p className="text-sm text-red-600">{createError}</p> : null}
            </div>
          </form>
        </CardContent>
      </Card>
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
