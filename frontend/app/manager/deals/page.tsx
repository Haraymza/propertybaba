"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake, Kanban, Search } from "lucide-react";
import { customersApi, dealsApi, propertiesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKR, splitAddressParts } from "@/lib/formatters";
import { assertEnum, toRequiredNumber, toRequiredText } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { useAuthStore } from "@/store/auth-store";

export default function ManagerDealsPage() {
  const [activeTab, setActiveTab] = useState<"create" | "list">("list");
  const [customerId, setCustomerId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [price, setPrice] = useState(0);
  const [overrideCommission, setOverrideCommission] = useState(false);
  const [orgPercent, setOrgPercent] = useState(10);
  const [agentPercent, setAgentPercent] = useState(2);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuthStore();

  const customersQ = useQuery({ queryKey: ["customers"], queryFn: () => customersApi.list() });
  const propertiesQ = useQuery({ queryKey: ["properties"], queryFn: () => propertiesApi.list() });
  const dealsQ = useQuery({ queryKey: ["deals", showArchived, search], queryFn: () => dealsApi.list({ include_archived: showArchived, q: search || undefined }) });

  const selectedCustomer = useMemo(
    () => (customersQ.data?.data || []).find((c) => c._id === customerId) || null,
    [customersQ.data, customerId],
  );
  const availableProperties = useMemo(() => {
    const allAvailable = (propertiesQ.data?.data || []).filter((p) => p.status === "available");
    if (!selectedCustomer) return allAvailable;
    const requiredPropertyType = selectedCustomer.preference === "rent" ? "rent" : "sell";
    return allAvailable.filter((p) => p.type === requiredPropertyType);
  }, [propertiesQ.data, selectedCustomer]);
  const selectedProperty = useMemo(
    () => availableProperties.find((p) => p._id === propertyId) || null,
    [availableProperties, propertyId],
  );
  const resolvedDealType = selectedProperty ? (selectedProperty.type === "rent" ? "rent" : "buy") : "";
  const filteredCustomers = useMemo(() => {
    const customers = customersQ.data?.data || [];
    const query = customerSearch.trim().toLowerCase();
    if (!query) return [];
    return customers
      .filter((c) => {
        const phones = c.phone_number.join(" ").toLowerCase();
        return c.name.toLowerCase().includes(query) || phones.includes(query);
      })
      .slice(0, 8);
  }, [customersQ.data, customerSearch]);
  const filteredProperties = useMemo(() => {
    const query = propertySearch.trim().toLowerCase();
    if (!query) return [];
    return availableProperties
      .filter((p) => {
        const haystack = [p.title, p.address, p.seller_name, p.seller_phone.join(" ")].join(" ").toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 8);
  }, [availableProperties, propertySearch]);

  const createDeal = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const safeCustomerId = toRequiredText("Customer", customerId);
      const safePropertyId = toRequiredText("Property", propertyId);
      const safeDealType = assertEnum("Deal type", resolvedDealType, ["buy", "rent"] as const);
      const financials = overrideCommission
        ? (() => {
            const dealPrice = toRequiredNumber("Deal price", price, { min: 1 });
            const safeOrgPercent = toRequiredNumber("Organization percent", orgPercent, { min: 0, max: 100 });
            const safeAgentPercent = toRequiredNumber("Agent percent", agentPercent, { min: 0, max: 100 });
            const orgRevenueCut = (dealPrice * safeOrgPercent) / 100;
            return [
              {
                deal_price: dealPrice,
                org_revenue_cut: orgRevenueCut,
                user_revenue_cut: (dealPrice * safeAgentPercent) / 100,
              },
            ];
          })()
        : undefined;
      await dealsApi.create({
        customer_id: safeCustomerId,
        property_id: safePropertyId,
        deal_type: safeDealType,
        financials,
        override_commission: overrideCommission,
      });
      setCustomerId("");
      setPropertyId("");
      setCustomerSearch("");
      setPropertySearch("");
      setShowCustomerDropdown(false);
      setShowPropertyDropdown(false);
      setPrice(0);
      await Promise.all([dealsQ.refetch(), propertiesQ.refetch(), customersQ.refetch()]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create deal"));
    } finally {
      setSaving(false);
    }
  };

  const updateDealStatus = async (id: string, status: "completed" | "cancelled") => {
    setError("");
    try {
      await dealsApi.update(id, { status });
      await Promise.all([dealsQ.refetch(), propertiesQ.refetch(), customersQ.refetch()]);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to update deal"));
    }
  };

  const archiveDeal = async (id: string) => {
    setError("");
    try {
      await dealsApi.remove(id);
      await dealsQ.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to archive deal"));
    }
  };

  const restoreDeal = async (id: string) => {
    setError("");
    try {
      await dealsApi.restore(id);
      await dealsQ.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to restore deal"));
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Deals Pipeline" description="Kanban-style execution view with commission context." />
      <div className="flex gap-2">
        <Button variant={activeTab === "list" ? "secondary" : "ghost"} onClick={() => setActiveTab("list")}>
          Deals List
        </Button>
        <Button variant={activeTab === "create" ? "secondary" : "ghost"} onClick={() => setActiveTab("create")}>
          Create Deal
        </Button>
      </div>
      {activeTab === "create" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-[var(--accent)]" />
              Create Deal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={createDeal}>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Customer</p>
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerId("");
                      setPropertyId("");
                      setPropertySearch("");
                      setShowCustomerDropdown(true);
                    }}
                    placeholder="Search customer by name or number..."
                  />
                  {showCustomerDropdown && customerSearch.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-44 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setCustomerId(c._id);
                            setCustomerSearch(`${c.name} (${c.phone_number.join(", ")})`);
                            setPropertyId("");
                            setPropertySearch("");
                            setShowCustomerDropdown(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] ${
                            customerId === c._id ? "bg-[var(--surface-muted)]" : ""
                          }`}
                        >
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-[var(--muted)]">{c.phone_number.join(", ")}</p>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-[var(--muted)]">No customers found.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Property</p>
                <div className="relative">
                  <Input
                    value={propertySearch}
                    onFocus={() => setShowPropertyDropdown(true)}
                    onChange={(e) => {
                      setPropertySearch(e.target.value);
                      setPropertyId("");
                      setShowPropertyDropdown(true);
                    }}
                    placeholder="Search property by name, address, seller, or number..."
                  />
                  {showPropertyDropdown && propertySearch.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-sm">
                      {filteredProperties.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setPropertyId(p._id);
                            setPropertySearch(`${p.title} - ${splitAddressParts(p.address).join(", ") || p.address}`);
                            setPrice(Number(p.price || 0));
                            setShowPropertyDropdown(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] ${
                            propertyId === p._id ? "bg-[var(--surface-muted)]" : ""
                          }`}
                        >
                          <p className="font-medium">{p.title}</p>
                          <p className="text-xs text-[var(--muted)]">{splitAddressParts(p.address).join(" • ") || p.address}</p>
                          <p className="text-xs text-[var(--muted)]">
                            Seller: {p.seller_name} ({p.seller_phone.join(", ")})
                          </p>
                        </button>
                      ))}
                      {filteredProperties.length === 0 ? (
                        <p className="px-3 py-2 text-sm text-[var(--muted)]">
                          {selectedCustomer
                            ? `No ${selectedCustomer.preference === "rent" ? "rent" : "sell"} properties found.`
                            : "No properties found."}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Deal Price</p>
                <Input value={price || ""} onChange={(e) => setPrice(Number(e.target.value || 0))} type="number" placeholder="12500000" required />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Type of Deal</p>
                <Input value={resolvedDealType || "Select a property first"} readOnly />
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-sm">
                <p className="font-medium text-[var(--foreground)]">Commission rules</p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={overrideCommission} onChange={(e) => setOverrideCommission(e.target.checked)} />
                  Override on this deal
                </label>
                {overrideCommission ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input value={orgPercent} onChange={(e) => setOrgPercent(Number(e.target.value || 0))} type="number" placeholder="Org % of deal" />
                    <Input value={agentPercent} onChange={(e) => setAgentPercent(Number(e.target.value || 0))} type="number" placeholder="Agent % of deal" />
                  </div>
                ) : null}
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button className="w-full" disabled={saving}>
                {saving ? "Creating..." : "Create Deal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <Kanban className="h-4 w-4 text-[var(--accent)]" />
              Deals Pipeline
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deal type..." className="pl-9" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived deals
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Property</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Deal Made By</th>
                  <th>Customer Made By</th>
                  <th>Property Made By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dealsQ.data?.data || []).map((d) => (
                  <tr key={d._id}>
                    <td className="font-medium">{d.property?.title || "Unknown property"}</td>
                    <td>{d.customer?.name || "Unknown customer"}</td>
                    <td className="capitalize">{d.deal_type}</td>
                    <td className="font-semibold text-[var(--foreground)]">
                      {d.financials?.[0]?.deal_price ? formatPKR(d.financials[0].deal_price) : "-"}
                    </td>
                    <td>{user?.admin_flag ? (d.created_by_user?.name || "-") : "-"}</td>
                    <td>{user?.admin_flag ? (d.customer_creator?.name || "-") : "-"}</td>
                    <td>{user?.admin_flag ? (d.property_creator?.name || "-") : "-"}</td>
                    <td>
                      <Badge variant={d.status === "completed" ? "success" : d.status === "cancelled" ? "danger" : "warning"}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="flex gap-2">
                      <Button variant="secondary" onClick={() => updateDealStatus(d._id, "completed")} disabled={d.status !== "in_process" || Boolean(d.is_deleted)}>
                        Complete
                      </Button>
                      <Button variant="ghost" onClick={() => updateDealStatus(d._id, "cancelled")} disabled={d.status !== "in_process" || Boolean(d.is_deleted)}>
                        Cancel
                      </Button>
                      {!d.is_deleted ? (
                        <Button variant="danger" onClick={() => archiveDeal(d._id)}>
                          Archive
                        </Button>
                      ) : (
                        <Button variant="secondary" onClick={() => restoreDeal(d._id)}>
                          Restore
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      )}
    </main>
  );
}
