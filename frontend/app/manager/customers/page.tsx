"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, UserCircle2 } from "lucide-react";
import { customersApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popup, PopupContent } from "@/components/ui/popup";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth-store";

export default function ManagerCustomersPage() {
  const [activeTab, setActiveTab] = useState<"add" | "list">("list");
  const [name, setName] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [preference, setPreference] = useState<"buy" | "rent">("buy");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [size, setSize] = useState("Not specified");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhones, setEditPhones] = useState("");
  const [editPreference, setEditPreference] = useState<"buy" | "rent">("buy");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [editSize, setEditSize] = useState("Not specified");
  const [editStatus, setEditStatus] = useState<"in_process" | "closed">("in_process");
  const { user } = useAuthStore();
  const query = useQuery({
    queryKey: ["customers", search, showArchived],
    queryFn: () => customersApi.list({ q: search || undefined, include_archived: showArchived }),
  });

  const createCustomer = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await customersApi.create({
        name,
        phone_number: phoneInput
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        preference,
        size,
        priority,
      });
      setName("");
      setPhoneInput("");
      await query.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create customer"));
    } finally {
      setSaving(false);
    }
  };

  const archiveCustomer = async (id: string) => {
    await customersApi.remove(id);
    await query.refetch();
  };

  const restoreCustomer = async (id: string) => {
    await customersApi.restore(id);
    await query.refetch();
  };
  const startEdit = (id: string) => {
    const customer = (query.data?.data || []).find((c) => c._id === id);
    if (!customer) return;
    setEditingId(id);
    setEditName(customer.name);
    setEditPhones(customer.phone_number.join(", "));
    setEditPreference(customer.preference);
    setEditPriority(customer.priority);
    setEditSize(customer.size);
    setEditStatus(customer.status);
  };
  const saveEdit = async () => {
    if (!editingId) return;
    await customersApi.update(editingId, {
      name: editName,
      phone_number: editPhones.split(",").map((x) => x.trim()).filter(Boolean),
      preference: editPreference,
      priority: editPriority,
      size: editSize,
      status: editStatus,
    });
    setEditingId(null);
    await query.refetch();
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Customers" description="Manage prospects with a clean, sortable workspace." />
      <div className="flex gap-2">
        <Button variant={activeTab === "list" ? "secondary" : "ghost"} onClick={() => setActiveTab("list")}>
          Customers List
        </Button>
        <Button variant={activeTab === "add" ? "secondary" : "ghost"} onClick={() => setActiveTab("add")}>
          Add Customer
        </Button>
      </div>
      {activeTab === "add" ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createCustomer}>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" required />
              <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="Phone numbers (comma separated)" required />
              <Select value={preference} onChange={(e) => setPreference(e.target.value as "buy" | "rent")}>
                <option value="buy">buy</option>
                <option value="rent">rent</option>
              </Select>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </Select>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size requirement" />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Customer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <div className="mt-2 space-y-2">
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer..." className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
          </div>
        </CardHeader>
        <CardContent className="soft-scrollbar">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phones</th>
                  <th className="px-3 py-2">Preference</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created By</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(query.data?.data || []).map((c) => (
                  <tr key={c._id}>
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 text-[var(--muted)]" />
                        <Link className="hover:underline" href={`/manager/customers/${c._id}`}>
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-3 py-2">{c.phone_number.join(", ")}</td>
                    <td className="px-3 py-2">{c.preference}</td>
                    <td className="px-3 py-2">{c.size}</td>
                    <td className="px-3 py-2">{c.priority}</td>
                    <td className="px-3 py-2">{c.status}</td>
                    <td className="px-3 py-2">{c.created_by_name || "-"}</td>
                    <td className="px-3 py-2 flex gap-2">
                      {user?.admin_flag ? (
                        <Button variant="secondary" onClick={() => startEdit(c._id)}>
                          Edit
                        </Button>
                      ) : null}
                      {!c.is_deleted ? (
                        <Button variant="danger" onClick={() => archiveCustomer(c._id)}>
                          Archive
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => restoreCustomer(c._id)}>
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {user?.admin_flag && editingId ? (
            <Popup open onOpenChange={() => setEditingId(null)}>
              <PopupContent title="Edit Customer">
                <div className="space-y-3">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Customer name" />
                  <Input value={editPhones} onChange={(e) => setEditPhones(e.target.value)} placeholder="Phone numbers (comma separated)" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select value={editPreference} onChange={(e) => setEditPreference(e.target.value as "buy" | "rent")}>
                      <option value="buy">buy</option>
                      <option value="rent">rent</option>
                    </Select>
                    <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as "Low" | "Medium" | "High")}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </Select>
                    <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as "in_process" | "closed")}>
                      <option value="in_process">in_process</option>
                      <option value="closed">closed</option>
                    </Select>
                    <Input value={editSize} onChange={(e) => setEditSize(e.target.value)} placeholder="Size requirement" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>Save Changes</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              </PopupContent>
            </Popup>
          ) : null}
        </CardContent>
      </Card>
      )}
    </main>
  );
}
