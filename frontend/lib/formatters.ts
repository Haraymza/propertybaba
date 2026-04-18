const pkrFullFormatter = new Intl.NumberFormat("en-PK");

export function formatPKR(value: number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "PKR -";
  return `PKR ${pkrFullFormatter.format(amount)}`;
}

export function formatPKRCompact(value: number | null | undefined): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "PKR -";
  if (amount >= 10_000_000) return `PKR ${(amount / 10_000_000).toFixed(1).replace(/\.0$/, "")} Crore`;
  if (amount >= 100_000) return `PKR ${(amount / 100_000).toFixed(1).replace(/\.0$/, "")} Lakh`;
  return formatPKR(amount);
}

export function splitAddressParts(address: string): string[] {
  return (address || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);
}
