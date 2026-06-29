export class ApiRequestError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(readApiErrorText(body) || `HTTP ${status}`);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

export function readApiErrorText(body: string) {
  const trimmed = body.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string;
      detail?: string;
      error?: string;
      title?: string;
      errors?: unknown;
    };
    const errorDetails =
      parsed.errors && typeof parsed.errors === "object"
        ? Object.values(parsed.errors as Record<string, unknown>)
            .flat()
            .join(" ")
        : undefined;
    const candidates = [
      parsed.detail,
      parsed.message,
      parsed.error,
      parsed.title,
      Array.isArray(parsed.errors) ? parsed.errors.join(" ") : undefined,
      errorDetails,
    ];
    return candidates.filter(Boolean).join(" ");
  } catch {
    return trimmed;
  }
}
