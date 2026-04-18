import { ReactNode } from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          </span>
        </div>
        <p className="text-2xl font-semibold text-[var(--foreground)]">{value}</p>
        {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
