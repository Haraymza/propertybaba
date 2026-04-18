"use client";

import { Clock3, FileText, MessageSquare, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function CustomerDetailPage({ params }: { params: { customerId: string } }) {
  const id = params.customerId;

  return (
    <main className="space-y-6">
      <PageHeader title="Customer Detail" description="UI shell for profile, timeline, and notes experience." />
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[var(--accent)]" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <div>
                <p className="text-lg font-semibold">Customer #{id}</p>
                <p className="muted">Premium detail layout with sections and timeline.</p>
              </div>
              <Badge>Active</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary">Overview</Button>
              <Button variant="ghost">Timeline</Button>
              <Button variant="ghost">Notes</Button>
              <Button variant="ghost">Deals</Button>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <p className="text-sm font-medium">Summary</p>
              <p className="muted mt-1">This is a UI-only customer detail shell with tabbed layout placeholders.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[var(--accent)]" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">Followed up on budget discussion.</p>
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] p-3">Interested in 3BHK options near downtown.</p>
            <Button className="w-full">Add Note</Button>
          </CardContent>
        </Card>
      </section>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[var(--accent)]" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="font-medium">Lead Created</p>
            <p className="muted">Profile entered into CRM with requirement tags.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="font-medium">Property Shared</p>
            <p className="muted">Sent two shortlisted properties and schedule options.</p>
          </div>
          <div className="rounded-lg border border-[var(--border)] p-3">
            <p className="font-medium">Deal Stage Updated</p>
            <p className="muted">Status moved to negotiation.</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--accent)]" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--muted)]">Document widget placeholder for future attachment UI.</CardContent>
      </Card>
    </main>
  );
}
