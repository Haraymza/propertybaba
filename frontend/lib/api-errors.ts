type ValidationErrorItem = {
  msg?: string;
  loc?: Array<string | number>;
};

type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string | ValidationErrorItem[] | { message?: string };
      message?: string;
    };
  };
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const e = error as ApiErrorShape;
  const detail = e?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first?.msg) return first.msg;
  }

  const message = e?.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;

  if (typeof e?.message === "string" && e.message.trim()) return e.message;

  return fallback;
}
