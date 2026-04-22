"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter } from "lucide-react";
import { propertiesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKR, splitAddressParts } from "@/lib/formatters";
import { assertEnum, toPhoneList, toRequiredNumber, toRequiredText } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popup, PopupContent } from "@/components/ui/popup";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth-store";

export default function ManagerPropertiesPage() {
  const [activeTab, setActiveTab] = useState<"add" | "list">("list");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState(0);
  const [type, setType] = useState<"sell" | "rent">("sell");
  const [typeOfProp, setTypeOfProp] = useState<"House" | "Plot" | "Shop" | "Flat">("House");
  const [size, setSize] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhoneInput, setSellerPhoneInput] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editType, setEditType] = useState<"sell" | "rent">("sell");
  const [editTypeOfProp, setEditTypeOfProp] = useState<"House" | "Plot" | "Shop" | "Flat">("House");
  const [editSize, setEditSize] = useState("");
  const [editSellerName, setEditSellerName] = useState("");
  const [editSellerPhones, setEditSellerPhones] = useState("");
  const [notesPropertyId, setNotesPropertyId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const { user } = useAuthStore();
  const query = useQuery({
    queryKey: ["properties", search, showArchived],
    queryFn: () => propertiesApi.list({ q: search || undefined, include_archived: showArchived }),
  });
  const properties = useMemo(() => query.data?.data || [], [query.data]);
  const createdByOptions = useMemo(
    () => Array.from(new Set(properties.map((p) => p.created_by_name).filter(Boolean) as string[])).sort(),
    [properties],
  );
  const sellerOptions = useMemo(() => Array.from(new Set(properties.map((p) => p.seller_name))).sort(), [properties]);
  const propertyTypeOptions = useMemo(() => Array.from(new Set(properties.map((p) => p.type_of_property))).sort(), [properties]);
  const filteredRows = useMemo(() => {
    return properties.filter((p) => {
      if (createdByFilter !== "all" && p.created_by_name !== createdByFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (sellerFilter !== "all" && p.seller_name !== sellerFilter) return false;
      if (propertyTypeFilter !== "all" && p.type_of_property !== propertyTypeFilter) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (priceRangeFilter !== "all") {
        const price = Number(p.price || 0);
        if (priceRangeFilter === "0-2500000" && !(price <= 2500000)) return false;
        if (priceRangeFilter === "2500000-10000000" && !(price > 2500000 && price <= 10000000)) return false;
        if (priceRangeFilter === "10000000-30000000" && !(price > 10000000 && price <= 30000000)) return false;
        if (priceRangeFilter === "30000000+" && !(price > 30000000)) return false;
      }
      return true;
    });
  }, [properties, createdByFilter, statusFilter, sellerFilter, propertyTypeFilter, typeFilter, priceRangeFilter]);

  const createProperty = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const safeTitle = toRequiredText("Title", title);
      const safeAddress = toRequiredText("Address", address);
      const safePrice = toRequiredNumber("Price", price, { min: 1 });
      const safeType = assertEnum("Type", type, ["sell", "rent"] as const);
      const safeTypeOfProperty = assertEnum("Property type", typeOfProp, ["House", "Plot", "Shop", "Flat"] as const);
      const safeSize = toRequiredText("Size", size);
      const safeSellerName = toRequiredText("Seller name", sellerName);
      const safeSellerPhones = toPhoneList("Seller phone numbers", sellerPhoneInput);
      await propertiesApi.create({
        title: safeTitle,
        address: safeAddress,
        price: safePrice,
        type: safeType,
        type_of_property: safeTypeOfProperty,
        size: safeSize,
        seller_name: safeSellerName,
        seller_phone: safeSellerPhones,
      });
      setTitle("");
      setAddress("");
      setPrice(0);
      setType("sell");
      setTypeOfProp("House");
      setSize("");
      setSellerName("");
      setSellerPhoneInput("");
      await query.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create property"));
    } finally {
      setSaving(false);
    }
  };

  const archiveProperty = async (id: string) => {
    await propertiesApi.remove(id);
    await query.refetch();
  };

  const restoreProperty = async (id: string) => {
    await propertiesApi.restore(id);
    await query.refetch();
  };
  const startEdit = (id: string) => {
    const property = (query.data?.data || []).find((p) => p._id === id);
    if (!property) return;
    setEditingId(id);
    setEditTitle(property.title);
    setEditAddress(property.address);
    setEditPrice(property.price);
    setEditType(property.type);
    setEditTypeOfProp(property.type_of_property as "House" | "Plot" | "Shop" | "Flat");
    setEditSize(property.size || "");
    setEditSellerName(property.seller_name);
    setEditSellerPhones(property.seller_phone.join(", "));
  };
  const saveEdit = async () => {
    if (!editingId) return;
    setError("");
    try {
      const safeTitle = toRequiredText("Title", editTitle);
      const safeAddress = toRequiredText("Address", editAddress);
      const safePrice = toRequiredNumber("Price", editPrice, { min: 1 });
      const safeType = assertEnum("Type", editType, ["sell", "rent"] as const);
      const safeTypeOfProperty = assertEnum("Property type", editTypeOfProp, ["House", "Plot", "Shop", "Flat"] as const);
      const safeSize = toRequiredText("Size", editSize);
      const safeSellerName = toRequiredText("Seller name", editSellerName);
      const safeSellerPhones = toPhoneList("Seller phone numbers", editSellerPhones);
      await propertiesApi.update(editingId, {
        title: safeTitle,
        address: safeAddress,
        price: safePrice,
        type: safeType,
        type_of_property: safeTypeOfProperty,
        size: safeSize,
        seller_name: safeSellerName,
        seller_phone: safeSellerPhones,
      });
      setEditingId(null);
      await query.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update property"));
    }
  };
  const selectedProperty = (query.data?.data || []).find((property) => property._id === notesPropertyId) || null;

  const addPropertyNote = async () => {
    if (!notesPropertyId || !noteText.trim()) return;
    setNotesSaving(true);
    try {
      await propertiesApi.addNote(notesPropertyId, noteText.trim());
      setNoteText("");
      await query.refetch();
    } finally {
      setNotesSaving(false);
    }
  };

  const deletePropertyNote = async (propertyId: string, noteId: string) => {
    if (!window.confirm("Delete this note?")) return;
    await propertiesApi.deleteNote(propertyId, noteId);
    await query.refetch();
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Properties" description="Inventory board with clean listing management." />
      <div className="flex gap-2">
        <Button variant={activeTab === "list" ? "secondary" : "ghost"} onClick={() => setActiveTab("list")}>
          Properties List
        </Button>
        <Button variant={activeTab === "add" ? "secondary" : "ghost"} onClick={() => setActiveTab("add")}>
          Add Property
        </Button>
      </div>
      {activeTab === "add" ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Property</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createProperty}>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Title</p>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Brand New Corner House - DHA Phase 6" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Address</p>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street 12, DHA Phase 6, Lahore" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Price</p>
                  <Input value={price || ""} onChange={(e) => setPrice(Number(e.target.value || 0))} placeholder="45000000" type="number" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Size</p>
                  <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="10 Marla / 2250 sq ft" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Type</p>
                  <Select value={type} onChange={(e) => setType(e.target.value as "sell" | "rent")}>
                    <option value="sell">sell</option>
                    <option value="rent">rent</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Property Type</p>
                  <Select value={typeOfProp} onChange={(e) => setTypeOfProp(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                    <option value="House">House</option>
                    <option value="Plot">Plot</option>
                    <option value="Shop">Shop</option>
                    <option value="Flat">Flat</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Seller Name</p>
                  <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Rashid Jamil" required />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Seller Phone Numbers</p>
                  <Input value={sellerPhoneInput} onChange={(e) => setSellerPhoneInput(e.target.value)} placeholder="03111234567, 03221234567" required />
                </div>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="w-full" disabled={saving}>
                {saving ? "Saving..." : "Save Property"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <CardTitle>Properties</CardTitle>
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search property..." className="pl-9" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show archived
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Select value={createdByFilter} onChange={(e) => setCreatedByFilter(e.target.value)}>
                <option value="all">Created by: all</option>
                {createdByOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </Select>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Status: all</option>
                <option value="available">available</option>
                <option value="assigned">assigned</option>
                <option value="sold">sold</option>
              </Select>
              <Select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}>
                <option value="all">Seller: all</option>
                {sellerOptions.map((seller) => <option key={seller} value={seller}>{seller}</option>)}
              </Select>
              <Select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)}>
                <option value="all">Property type: all</option>
                {propertyTypeOptions.map((propType) => <option key={propType} value={propType}>{propType}</option>)}
              </Select>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Type: all</option>
                <option value="sell">sell</option>
                <option value="rent">rent</option>
              </Select>
              <Select value={priceRangeFilter} onChange={(e) => setPriceRangeFilter(e.target.value)}>
                <option value="all">Price: all</option>
                <option value="0-2500000">Up to 25 Lakh</option>
                <option value="2500000-10000000">25 Lakh - 1 Crore</option>
                <option value="10000000-30000000">1 Crore - 3 Crore</option>
                <option value="30000000+">3 Crore+</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="soft-scrollbar">
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Title</th>
                  <th>Address</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Property Type</th>
                  <th>Size</th>
                  <th>Seller</th>
                  <th>Phones</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((p) => (
                  <tr key={p._id} className="cursor-pointer hover:bg-[var(--surface-muted)]" onClick={() => setNotesPropertyId(p._id)}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                        <span className="text-left text-[var(--foreground)] hover:underline">{p.title}</span>
                      </div>
                    </td>
                    <td>
                      {splitAddressParts(p.address).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {splitAddressParts(p.address).map((part) => (
                            <span key={`${p._id}-${part}`} className="rounded-full bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)]">
                              {part}
                            </span>
                          ))}
                        </div>
                      ) : (
                        p.address
                      )}
                    </td>
                    <td className="font-semibold text-[var(--foreground)]">{formatPKR(p.price)}</td>
                    <td className="capitalize">{p.type}</td>
                    <td>{p.type_of_property}</td>
                    <td>{p.size}</td>
                    <td>{p.seller_name}</td>
                    <td>{p.seller_phone.join(", ")}</td>
                    <td>
                      <Badge variant={p.status === "available" ? "success" : p.status === "sold" ? "danger" : "warning"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-2">
                      {user?.admin_flag ? (
                        <Button
                          className="h-8 px-2.5"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(p._id);
                          }}
                          title="Edit property"
                          aria-label="Edit property"
                        >
                          <span className="text-[11px] font-semibold text-[var(--foreground)]">Edit</span>
                        </Button>
                      ) : null}
                      {!p.is_deleted ? (
                        <Button
                          className="h-8 px-2.5"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveProperty(p._id);
                          }}
                          title="Archive property"
                          aria-label="Archive property"
                        >
                          <span className="text-[10px] font-semibold text-[var(--foreground)]">Archive</span>
                        </Button>
                      ) : (
                        <Button
                          className="h-8 px-2.5"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            restoreProperty(p._id);
                          }}
                          title="Restore property"
                          aria-label="Restore property"
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
              <PopupContent title="Edit Property">
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Title</p>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Address</p>
                      <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Address" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Price</p>
                      <Input value={editPrice || ""} onChange={(e) => setEditPrice(Number(e.target.value || 0))} placeholder="Price" type="number" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Type</p>
                      <Select value={editType} onChange={(e) => setEditType(e.target.value as "sell" | "rent")}>
                        <option value="sell">sell</option>
                        <option value="rent">rent</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Property Type</p>
                      <Select value={editTypeOfProp} onChange={(e) => setEditTypeOfProp(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                        <option value="House">House</option>
                        <option value="Plot">Plot</option>
                        <option value="Shop">Shop</option>
                        <option value="Flat">Flat</option>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Size</p>
                      <Input value={editSize} onChange={(e) => setEditSize(e.target.value)} placeholder="Size" />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Seller Name</p>
                      <Input value={editSellerName} onChange={(e) => setEditSellerName(e.target.value)} placeholder="Seller name" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Seller Phone(s)</p>
                      <Input value={editSellerPhones} onChange={(e) => setEditSellerPhones(e.target.value)} placeholder="Seller phone(s), comma separated" className="md:col-span-2" />
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
          {selectedProperty ? (
            <Popup open onOpenChange={(open) => !open && setNotesPropertyId(null)}>
              <PopupContent title="Property Notes">
                <div className="space-y-4">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/50 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold">{selectedProperty.title}</p>
                        <p className="text-sm text-[var(--muted)]">{selectedProperty.address}</p>
                      </div>
                      <span className="rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--accent)]">
                        {selectedProperty.status}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm md:grid-cols-2">
                      <p><span className="font-semibold">Type:</span> {selectedProperty.type}</p>
                      <p><span className="font-semibold">Property Type:</span> {selectedProperty.type_of_property}</p>
                      <p><span className="font-semibold">Size:</span> {selectedProperty.size || "-"}</p>
                      <p><span className="font-semibold">Price:</span> {formatPKR(selectedProperty.price)}</p>
                      <p><span className="font-semibold">Seller:</span> {selectedProperty.seller_name}</p>
                      <p><span className="font-semibold">Seller Phone:</span> {selectedProperty.seller_phone.join(", ")}</p>
                      <p className="md:col-span-2 text-[var(--muted)]"><span className="font-semibold">Created by:</span> {selectedProperty.created_by_name || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note..."
                    />
                    <Button disabled={!noteText.trim() || notesSaving} onClick={addPropertyNote}>
                      {notesSaving ? "Adding..." : "Add Note"}
                    </Button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto">
                    {selectedProperty.notes?.length ? (
                      [...selectedProperty.notes]
                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((note) => (
                          <div key={note._id} className="rounded-lg border border-[var(--border)] p-3 text-sm">
                            <div className="flex items-start justify-between gap-3">
                              <p className="flex-1">{note.text}</p>
                              {user?.admin_flag ? (
                                <Button
                                  className="h-7 w-7 p-0 border border-[var(--border)]"
                                  variant="secondary"
                                  onClick={() => deletePropertyNote(selectedProperty._id, note._id)}
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
