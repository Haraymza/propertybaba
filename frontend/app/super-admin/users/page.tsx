"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { assertEnum, toOptionalText, toRequiredText } from "@/lib/validators";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";

type Org = { _id: string; name: string };
type User = { _id: string; name: string; phone: string; email?: string; role: string; admin_flag: boolean; is_approved: boolean };

export default function SuperAdminUsersPage() {
  const [selectedOrg, setSelectedOrg] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("manager");
  const orgsQ = useQuery({ queryKey: ["organizations"], queryFn: () => superAdminApi.listOrganizations() });
  const usersQ = useQuery({
    queryKey: ["org-users", selectedOrg],
    queryFn: () => superAdminApi.usersByOrganization(selectedOrg),
    enabled: Boolean(selectedOrg),
  });

  const orgs = useMemo(() => (orgsQ.data?.data || []) as Org[], [orgsQ.data]);
  const users = useMemo(() => (usersQ.data?.data || []) as User[], [usersQ.data]);

  const updateRole = async (user: User, role: string) => {
    setError("");
    setMessage("");
    try {
      const safeRole = assertEnum("Role", role, ["manager", "admin"] as const);
      const safeOrg = toRequiredText("Organization", selectedOrg);
      const isAdmin = safeRole === "admin";
      await superAdminApi.updateUserRole(user._id, {
        role: safeRole,
        admin_flag: isAdmin,
        is_approved: user.is_approved,
        organization_id: safeOrg,
      });
      setMessage(`Updated role for ${user.name}`);
      await usersQ.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update role"));
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u._id);
    setEditName(u.name);
    setEditPhone(u.phone);
    setEditEmail(u.email || "");
    setEditPassword("");
    setEditRole(u.role || "manager");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setError("");
    setMessage("");
    try {
      const safeName = toRequiredText("Name", editName);
      const safePhone = toRequiredText("Phone", editPhone);
      const safeEmail = toOptionalText(editEmail);
      const safePassword = toOptionalText(editPassword);
      const safeRole = assertEnum("Role", editRole, ["manager", "admin"] as const);
      const safeOrg = toRequiredText("Organization", selectedOrg);
      await superAdminApi.updateUserDetails(editingId, {
        name: safeName,
        phone: safePhone,
        email: safeEmail,
        password: safePassword,
        role: safeRole,
        organization_id: safeOrg,
      });
      setMessage("User details updated");
      setEditingId(null);
      await usersQ.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update user details"));
    }
  };

  return (
    <main className="space-y-4">
      <PageHeader title="Organization User Roles" description="Manage manager/admin roles within each organization." />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
            Organization User Role Management
          </CardTitle>
          <p className="muted">Select an organization, then update user roles and admin permissions.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
            <option value="">Select organization</option>
            {orgs.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </Select>
          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.phone}</td>
                    <td>
                      <Badge variant={u.is_approved ? "success" : "warning"}>
                        {u.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </td>
                    <td>
                      <Select defaultValue={u.role} onChange={(e) => updateRole(u, e.target.value)}>
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                      </Select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => usersQ.refetch()}>
                          Refresh
                        </Button>
                        <Button variant="ghost" onClick={() => startEdit(u)}>
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editingId ? (
            <div className="rounded-lg border border-[var(--border)] p-3 space-y-3">
              <p className="text-sm font-medium">Edit User Details</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" />
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" />
                <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Email (optional)" />
                <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="New password (optional)" type="password" />
                <Select value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                  <option value="manager">manager</option>
                  <option value="admin">admin</option>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveEdit}>Save Changes</Button>
                <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
