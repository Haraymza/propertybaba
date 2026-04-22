"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Layers } from "lucide-react";
import { superAdminApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-errors";
import { toOptionalText, toRequiredText } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

type Organization = { _id: string; name: string; description?: string };

export default function OrganizationsPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const orgsQuery = useQuery({
    queryKey: ["organizations"],
    queryFn: () => superAdminApi.listOrganizations(),
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const safeName = toRequiredText("Organization name", name);
      const safeDescription = toOptionalText(description);
      await superAdminApi.createOrganization({ name: safeName, description: safeDescription });
      setName("");
      setDescription("");
      setMessage("Organization created");
      await orgsQuery.refetch();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Failed to create organization"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <PageHeader title="Organizations" description="Create and manage tenant organizations." />
      <section className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--accent)]" />
            Create Organization
          </CardTitle>
          <p className="muted">Set up a new tenant account for a real estate organization.</p>
        </CardHeader>
        <CardContent>
        <form onSubmit={submit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Organization name"
            required
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={4}
          />
          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button disabled={loading}>
            {loading ? "Creating..." : "Create Organization"}
            </Button>
        </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[var(--accent)]" />
            Organizations
          </CardTitle>
          <p className="muted">All configured organizations in Property Baba.</p>
        </CardHeader>
        <CardContent>
        {orgsQuery.isLoading ? <p>Loading...</p> : null}
        <ul className="space-y-2">
          {((orgsQuery.data?.data || []) as Organization[]).map((org) => (
              <li key={org._id} className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{org.name}</p>
                <Badge className="bg-emerald-50 text-emerald-700">Active</Badge>
              </div>
              <p className="text-sm text-zinc-600">{org.description || "No description"}</p>
            </li>
          ))}
        </ul>
        </CardContent>
      </Card>
      </section>
    </main>
  );
}
