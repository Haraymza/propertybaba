"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake, Kanban, Search } from "lucide-react";
import { adminApi, customersApi, dealsApi, propertiesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { formatPKR, splitAddressParts } from "@/lib/formatters";
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
  const [dealType, setDealType] = useState<"buy" | "rent">("buy");
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
  const commissionQ = useQuery({ queryKey: ["commission-defaults"], queryFn: () => adminApi.getCommissionDefaults() });

  const availableProperties = useMemo(
    () => (propertiesQ.data?.data || []).filter((p) => p.status === "available"),
    [propertiesQ.data],
  );
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
      if (!customerId || !propertyId) {
        setError("Please select a customer and property from search results.");
        setSaving(false);
        return;
      }
      const financials = overrideCommission
        ? [
            {
              deal_price: Number(price),
              org_revenue_cut: (Number(price) * orgPercent) / 100,
              user_revenue_cut: (Number(price) * agentPercent) / 100,
            },
          ]
        : undefined;
      await dealsApi.create({
        customer_id: customerId,
        property_id: propertyId,
        deal_type: dealType,
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

  const defaults = commissionQ.data?.data;

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
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    placeholder="Search customer by name or number..."
                  />
                  {showCustomerDropdown && customerSearch.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-[var(--border)] bg-white shadow-sm">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            setCustomerId(c._id);
                            setCustomerSearch(`${c.name} (${c.phone_number.join(", ")})`);
                            setShowCustomerDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] ${
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
                <div className="relative">
                  <Input
                    value={propertySearch}
                    onFocus={() => setShowPropertyDropdown(true)}
                    onChange={(e) => {
                      setPropertySearch(e.target.value);
                      setShowPropertyDropdown(true);
                    }}
                    placeholder="Search property by name, address, seller, or number..."
                  />
                  {showPropertyDropdown && propertySearch.trim() ? (
                    <div className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[var(--border)] bg-white shadow-sm">
                      {filteredProperties.map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          onClick={() => {
                            setPropertyId(p._id);
                            setPropertySearch(`${p.title} - ${splitAddressParts(p.address).join(", ") || p.address}`);
                            setDealType(p.type === "rent" ? "rent" : "buy");
                            setPrice(Number(p.price || 0));
                            setShowPropertyDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)] ${
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
                        <p className="px-3 py-2 text-sm text-[var(--muted)]">No properties found.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
              <Input value={price || ""} onChange={(e) => setPrice(Number(e.target.value || 0))} type="number" placeholder="Deal price" required />
              <Input value={dealType} readOnly />
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-900">Commission rules</p>
                <p className="text-xs text-slate-600">
                  Defaults: org {defaults?.org_percent ?? 10}% / agent {defaults?.agent_percent ?? 2}%
                </p>
                <label className="mt-2 flex items-center gap-2">
                  <input type="checkbox" checked={overrideCommission} onChange={(e) => setOverrideCommission(e.target.checked)} />
                  Override on this deal
                </label>
                {overrideCommission ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Input value={orgPercent} onChange={(e) => setOrgPercent(Number(e.target.value || 0))} type="number" placeholder="Org %" />
                    <Input value={agentPercent} onChange={(e) => setAgentPercent(Number(e.target.value || 0))} type="number" placeholder="Agent %" />
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
