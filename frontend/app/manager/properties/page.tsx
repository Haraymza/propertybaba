"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Filter } from "lucide-react";
import { propertiesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKR, splitAddressParts } from "@/lib/formatters";
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
  const [size, setSize] = useState("Not specified");
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
  const [editSize, setEditSize] = useState("Not specified");
  const [editSellerName, setEditSellerName] = useState("");
  const [editSellerPhones, setEditSellerPhones] = useState("");
  const [editStatus, setEditStatus] = useState<"available" | "assigned" | "sold">("available");
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
      await propertiesApi.create({
        title,
        address,
        price: Number(price),
        type,
        type_of_property: typeOfProp,
        size,
        seller_name: sellerName,
        seller_phone: sellerPhoneInput
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      });
      setTitle("");
      setAddress("");
      setPrice(0);
      setType("sell");
      setTypeOfProp("House");
      setSize("Not specified");
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
    setEditSize(property.size);
    setEditSellerName(property.seller_name);
    setEditSellerPhones(property.seller_phone.join(", "));
    setEditStatus(property.status);
  };
  const saveEdit = async () => {
    if (!editingId) return;
    await propertiesApi.update(editingId, {
      title: editTitle,
      address: editAddress,
      price: Number(editPrice),
      type: editType,
      type_of_property: editTypeOfProp,
      size: editSize,
      seller_name: editSellerName,
      seller_phone: editSellerPhones.split(",").map((x) => x.trim()).filter(Boolean),
      status: editStatus,
    });
    setEditingId(null);
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
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" required />
              <Input value={price || ""} onChange={(e) => setPrice(Number(e.target.value || 0))} placeholder="Price" type="number" required />
              <Select value={type} onChange={(e) => setType(e.target.value as "sell" | "rent")}>
                <option value="sell">sell</option>
                <option value="rent">rent</option>
              </Select>
              <Select value={typeOfProp} onChange={(e) => setTypeOfProp(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                <option value="House">House</option>
                <option value="Plot">Plot</option>
                <option value="Shop">Shop</option>
                <option value="Flat">Flat</option>
              </Select>
              <Input value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" />
              <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} placeholder="Seller name" required />
              <Input value={sellerPhoneInput} onChange={(e) => setSellerPhoneInput(e.target.value)} placeholder="Seller phone(s), comma separated" required />
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
                  <th>Area / Sector</th>
                  <th>Price</th>
                  <th>Type</th>
                  <th>Property Type</th>
                  <th>Size</th>
                  <th>Seller</th>
                  <th>Phones</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((p) => (
                  <tr key={p._id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                        <span className="text-[var(--foreground)]">{p.title}</span>
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
                    <td>{p.created_by_name || "-"}</td>
                    <td className="flex gap-2">
                      {user?.admin_flag ? (
                        <Button variant="secondary" onClick={() => startEdit(p._id)}>
                          Edit
                        </Button>
                      ) : null}
                      {!p.is_deleted ? (
                        <Button variant="danger" onClick={() => archiveProperty(p._id)}>
                          Archive
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => restoreProperty(p._id)}>
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
              <PopupContent title="Edit Property">
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                    <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} placeholder="Address" />
                    <Input value={editPrice || ""} onChange={(e) => setEditPrice(Number(e.target.value || 0))} placeholder="Price" type="number" />
                    <Select value={editType} onChange={(e) => setEditType(e.target.value as "sell" | "rent")}>
                      <option value="sell">sell</option>
                      <option value="rent">rent</option>
                    </Select>
                    <Select value={editTypeOfProp} onChange={(e) => setEditTypeOfProp(e.target.value as "House" | "Plot" | "Shop" | "Flat")}>
                      <option value="House">House</option>
                      <option value="Plot">Plot</option>
                      <option value="Shop">Shop</option>
                      <option value="Flat">Flat</option>
                    </Select>
                    <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value as "available" | "assigned" | "sold")}>
                      <option value="available">available</option>
                      <option value="assigned">assigned</option>
                      <option value="sold">sold</option>
                    </Select>
                    <Input value={editSize} onChange={(e) => setEditSize(e.target.value)} placeholder="Size" />
                    <Input value={editSellerName} onChange={(e) => setEditSellerName(e.target.value)} placeholder="Seller name" />
                    <Input value={editSellerPhones} onChange={(e) => setEditSellerPhones(e.target.value)} placeholder="Seller phone(s), comma separated" className="md:col-span-2" />
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
