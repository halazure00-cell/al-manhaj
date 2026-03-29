export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly retryAfterSeconds?: number | null,
    readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  let message = `Request failed (${res.status})`;
  let code: string | undefined;
  let retryAfterSeconds: number | null | undefined;
  let details: unknown = undefined;

  try {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      if (payload?.error && typeof payload.error === 'string') {
        message = payload.error;
      }
      if (payload?.code && typeof payload.code === 'string') {
        code = payload.code;
      }
      if (typeof payload?.retryAfterSeconds === 'number') {
        retryAfterSeconds = payload.retryAfterSeconds;
      }
      if ('details' in (payload ?? {})) {
        details = payload.details;
      }
    } else {
      const text = await res.text();
      if (text) message = text;
    }
  } catch {
    // ignore parse failures and keep fallback message
  }

  throw new ApiError(message, res.status, code, retryAfterSeconds, details);
}
