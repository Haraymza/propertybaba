"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, User } from "lucide-react";
import { adminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { assertEnum, toOptionalText, toRequiredText } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function AdminTeamPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("manager");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("manager");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => adminApi.users() });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const safeName = toRequiredText("Name", name);
      const safePhone = toRequiredText("Phone", phone);
      const safeEmail = toOptionalText(email);
      const safePassword = toRequiredText("Password", password);
      const safeRole = assertEnum("Role", role, ["manager", "admin"] as const);
      await adminApi.createUser({
        name: safeName,
        phone: safePhone,
        email: safeEmail,
        password: safePassword,
        role: safeRole,
      });
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setRole("manager");
      await q.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create team user"));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (userId: string, isApproved: boolean) => {
    if (isApproved) await adminApi.deactivate(userId);
    else await adminApi.activate(userId);
    await q.refetch();
  };

  const startEdit = (u: { _id: string; name: string; phone: string; email?: string; role: string }) => {
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
    try {
      const safeName = toRequiredText("Name", editName);
      const safePhone = toRequiredText("Phone", editPhone);
      const safeEmail = toOptionalText(editEmail);
      const safePassword = toOptionalText(editPassword);
      const safeRole = assertEnum("Role", editRole, ["manager", "admin"] as const);
      await adminApi.updateUser(editingId, {
        name: safeName,
        phone: safePhone,
        email: safeEmail,
        password: safePassword,
        role: safeRole,
      });
      setEditingId(null);
      await q.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update user"));
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Team Management" description="Activate and manage organization members." />
      <Card>
        <CardHeader>
          <CardTitle>Create Team User</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={handleCreate}>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" required />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" required />
            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </Select>
            <div className="text-sm text-[var(--muted)]">Selecting role as `admin` automatically grants admin access.</div>
            {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
            <Button className="md:col-span-2" disabled={saving}>
              {saving ? "Creating..." : "Create User"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--accent)]" />
            Team Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(q.data?.data || []).map((u) => (
            <div key={u._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div>
                <p className="flex items-center gap-2 font-medium"><User className="h-4 w-4 text-[var(--muted)]" /> {u.name}</p>
                <p className="text-sm text-[var(--muted)]">{u.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={u.is_approved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}>
                  {u.is_approved ? "Approved" : "Pending"}
                </Badge>
                <Button variant="secondary" onClick={() => handleToggle(u._id, u.is_approved)}>
                  {u.is_approved ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" onClick={() => startEdit(u)}>
                  Edit
                </Button>
              </div>
            </div>
          ))}
          {editingId ? (
            <div className="rounded-lg border border-[var(--border)] p-3 space-y-3">
              <p className="text-sm font-medium">Edit Team User</p>
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
