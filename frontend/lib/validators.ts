type NumberOptions = {
  min?: number;
  max?: number;
  integer?: boolean;
};

export function toRequiredText(field: string, value: string, minLength = 1): string {
  const next = value.trim();
  if (!next || next.length < minLength) {
    throw new Error(`${field} is required.`);
  }
  return next;
}

export function toOptionalText(value: string): string | undefined {
  const next = value.trim();
  return next ? next : undefined;
}

export function toRequiredNumber(field: string, value: number | string, options: NumberOptions = {}): number {
  const raw = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isNaN(raw)) {
    throw new Error(`${field} must be a valid number.`);
  }
  if (options.integer && !Number.isInteger(raw)) {
    throw new Error(`${field} must be a whole number.`);
  }
  if (typeof options.min === "number" && raw < options.min) {
    throw new Error(`${field} must be at least ${options.min}.`);
  }
  if (typeof options.max === "number" && raw > options.max) {
    throw new Error(`${field} must be at most ${options.max}.`);
  }
  return raw;
}

export function toPhoneList(field: string, value: string): string[] {
  const tokens = value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error(`${field} is required.`);
  }

  const normalized = tokens.map((phone) => phone.replace(/[^\d+]/g, ""));
  normalized.forEach((phone) => {
    const digitsOnly = phone.startsWith("+") ? phone.slice(1) : phone;
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      throw new Error(`${field} contains an invalid phone number: ${phone}`);
    }
  });
  return normalized;
}

export function assertEnum<T extends string>(field: string, value: string, allowed: readonly T[]): T {
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`${field} must be one of: ${allowed.join(", ")}.`);
}
