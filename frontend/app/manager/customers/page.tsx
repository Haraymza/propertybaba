"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, UserCircle2 } from "lucide-react";
import { customersApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { assertEnum, toPhoneList, toRequiredText } from "@/lib/validators";
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
  const [size, setSize] = useState("");
  const [propertyType, setPropertyType] = useState<"House" | "Plot" | "Shop" | "Flat">("House");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhones, setEditPhones] = useState("");
  const [editPreference, setEditPreference] = useState<"buy" | "rent">("buy");
  const [editPriority, setEditPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [editSize, setEditSize] = useState("");
  const [editPropertyType, setEditPropertyType] = useState<"House" | "Plot" | "Shop" | "Flat">("House");
  const [editRequirements, setEditRequirements] = useState("");
  const [notesCustomerId, setNotesCustomerId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
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
      const safeName = toRequiredText("Customer name", name);
      const safePhones = toPhoneList("Phone numbers", phoneInput);
      const safePreference = assertEnum("Preference", preference, ["buy", "rent"] as const);
      const safePriority = assertEnum("Priority", priority, ["Low", "Medium", "High"] as const);
      const safePropertyType = assertEnum("Property type", propertyType, ["House", "Plot", "Shop", "Flat"] as const);
      await customersApi.create({
        name: safeName,
        phone_number: safePhones,
        preference: safePreference,
        size,
        property_type: safePropertyType,
        requirements,
        priority: safePriority,
      });
      setName("");
      setPhoneInput("");
      setSize("");
      setPropertyType("House");
      setRequirements("");
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
    setEditSize(customer.size || "");
    setEditPropertyType((customer.property_type as "House" | "Plot" | "Shop" | "Flat") || "House");
    setEditRequirements(customer.requirements || "");
  };
  const saveEdit = async () => {
    if (!editingId) return;
    setError("");
    try {
      const safeName = toRequiredText("Customer name", editName);
      const safePhones = toPhoneList("Phone numbers", editPhones);
      const safePreference = assertEnum("Preference", editPreference, ["buy", "rent"] as const);
      const safePriority = assertEnum("Priority", editPriority, ["Low", "Medium", "High"] as const);
      const safePropertyType = assertEnum("Property type", editPropertyType, ["House", "Plot", "Shop", "Flat"] as const);
      await customersApi.update(editingId, {
        name: safeName,
        phone_number: safePhones,
        preference: safePreference,
        priority: safePriority,
        size: editSize,
        property_type: safePropertyType,
        requirements: editRequirements,
      });
      setEditingId(null);
      await query.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update customer"));
    }
  };
  const selectedCustomer = (query.data?.data || []).find((customer) => customer._id === notesCustomerId) || null;

  const addCustomerNote = async () => {
    if (!notesCustomerId || !noteText.trim()) return;
    setNotesSaving(true);
    try {
      await customersApi.addNote(notesCustomerId, noteText.trim());
      setNoteText("");
      await query.refetch();
    } finally {
      setNotesSaving(false);
    }
  };

  const deleteCustomerNote = async (customerId: string, noteId: string) => {
    if (!window.confirm("Delete this note?")) return;
    await customersApi.deleteNote(customerId, noteId);
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
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Customer Name</p>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bilal Ahmed" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Phone Numbers</p>
                  <Input value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="03001234567, 03211234567" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Preference</p>
                  <Select value={preference} onChange={(e) => setPreference(e.target.value as "buy" | "rent")}>
                    <option value="buy">buy</option>
                    <option value="rent">rent</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Priority</p>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Property Type</p>
                  <Select value={propertyType} onChange={(e) => setPropertyType(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                    <option value="House">House</option>
                    <option value="Plot">Plot</option>
                    <option value="Shop">Shop</option>
                    <option value="Flat">Flat</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Size</p>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="5 Marla / 1200 sq ft" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Requirements</p>
                  <Input value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Near park, corner house, 3 bed" className="md:col-span-2" />
                </div>
              </div>
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
                  <th className="px-3 py-2">Property Type</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Requirements</th>
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(query.data?.data || []).map((c) => (
                  <tr
                    key={c._id}
                    className="cursor-pointer hover:bg-[var(--surface-muted)]"
                    onClick={() => setNotesCustomerId(c._id)}
                  >
                    <td className="px-3 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <UserCircle2 className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                        <span className="text-left hover:underline">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{c.phone_number.join(", ")}</td>
                    <td className="px-3 py-2">{c.preference}</td>
                    <td className="px-3 py-2">{c.property_type || "-"}</td>
                    <td className="px-3 py-2">{c.size || "-"}</td>
                    <td className="px-3 py-2">{c.requirements || "-"}</td>
                    <td className="px-3 py-2">{c.priority}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                      {user?.admin_flag ? (
                        <Button
                          className="h-8 px-2.5"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(c._id);
                          }}
                          title="Edit customer"
                          aria-label="Edit customer"
                        >
                          <span className="text-[11px] font-semibold text-[var(--foreground)]">Edit</span>
                        </Button>
                      ) : null}
                      {!c.is_deleted ? (
                        <Button
                          className="h-8 px-2.5"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveCustomer(c._id);
                          }}
                          title="Archive customer"
                          aria-label="Archive customer"
                        >
                          <span className="text-[10px] font-semibold text-[var(--foreground)]">Archive</span>
                        </Button>
                      ) : (
                        <Button
                          className="h-8 px-2.5"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreCustomer(c._id);
                          }}
                          title="Restore customer"
                          aria-label="Restore customer"
                        >
                          <span className="text-[10px] font-semibold text-[var(--foreground)]">Restore</span>
                        </Button>
                      )}
                      </div>
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
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Customer Name</p>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Customer name" />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Phone Numbers</p>
                    <Input value={editPhones} onChange={(e) => setEditPhones(e.target.value)} placeholder="Phone numbers (comma separated)" />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Preference</p>
                      <Select value={editPreference} onChange={(e) => setEditPreference(e.target.value as "buy" | "rent")}>
                        <option value="buy">buy</option>
                        <option value="rent">rent</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Priority</p>
                      <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as "Low" | "Medium" | "High")}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Size Requirement</p>
                      <Input value={editSize} onChange={(e) => setEditSize(e.target.value)} placeholder="Size requirement" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Property Type</p>
                      <Select value={editPropertyType} onChange={(e) => setEditPropertyType(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                        <option value="House">House</option>
                        <option value="Plot">Plot</option>
                        <option value="Shop">Shop</option>
                        <option value="Flat">Flat</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Requirements</p>
                      <Input value={editRequirements} onChange={(e) => setEditRequirements(e.target.value)} placeholder="Requirements" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveEdit}>Save Changes</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              </PopupContent>
            </Popup>
          ) : null}
          {selectedCustomer ? (
            <Popup open onOpenChange={(open) => !open && setNotesCustomerId(null)}>
              <PopupContent title="Customer Notes">
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4">
                    <div className="mb-3">
                      <p className="text-base font-semibold">{selectedCustomer.name}</p>
                      <p className="text-sm text-[var(--muted)]">{selectedCustomer.phone_number.join(", ")}</p>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p><span className="font-semibold">Preference:</span> {selectedCustomer.preference}</p>
                      <p><span className="font-semibold">Priority:</span> {selectedCustomer.priority}</p>
                      <p><span className="font-semibold">Property Type:</span> {selectedCustomer.property_type || "-"}</p>
                      <p><span className="font-semibold">Size:</span> {selectedCustomer.size || "-"}</p>
                      <p className="md:col-span-2"><span className="font-semibold">Requirements:</span> {selectedCustomer.requirements || "-"}</p>
                      <p className="md:col-span-2 text-[var(--muted)]"><span className="font-semibold">Created by:</span> {selectedCustomer.created_by_name || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                    />
                    <Button disabled={!noteText.trim() || notesSaving} onClick={addCustomerNote}>
                      {notesSaving ? "Adding..." : "Add Note"}
                    </Button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {selectedCustomer.notes?.length ? (
                      [...selectedCustomer.notes]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((note) => (
                          <div key={note._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1">{note.text}</p>
                              {user?.admin_flag ? (
                                <Button
                                  className="h-7 w-7 p-0 border border-[var(--border)]"
                                  variant="secondary"
                                  onClick={() => deleteCustomerNote(selectedCustomer._id, note._id)}
                                  title="Delete note"
                                  aria-label="Delete note"
                                >
                                  <span className="text-[11px] font-bold text-[var(--foreground)]">X</span>
                                </Button>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-[var(--muted)]">
                              {new Date(note.created_at).toLocaleString()} {note.created_by_name ? `by ${note.created_by_name}` : ""}
                            </p>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-[var(--muted)]">No notes yet.</p>
                    )}
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
