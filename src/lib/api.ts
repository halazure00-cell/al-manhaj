export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);
  if (res.ok) return res;

  let message = `Request failed (${res.status})`;
  try {
    const contentType = res.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      if (payload?.error && typeof payload.error === 'string') {
        message = payload.error;
      }
    } else {
      const text = await res.text();
      if (text) message = text;
    }
  } catch {
    // ignore parse failures and keep fallback message
  }

  throw new Error(message);
}
