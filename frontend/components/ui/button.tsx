"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const styles: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white shadow-[0_8px_24px_rgba(79,70,229,0.3)] hover:brightness-110",
  secondary: "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]",
  ghost: "bg-transparent hover:bg-[var(--surface-muted)]",
  danger: "bg-[var(--danger)] text-white hover:brightness-110",
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/35 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
