import { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={cn(
          "w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 pr-10 text-sm font-medium shadow-[0_2px_10px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[color-mix(in_srgb,var(--accent)_30%,var(--border))] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35 focus:ring-offset-2 focus:ring-offset-[var(--background)]",
          props.className,
        )}
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[var(--muted)]">
        <ChevronDown className="h-4 w-4" />
      </span>
    </div>
  );
}
