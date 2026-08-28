const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const TOKEN_KEY = 'digitalbox_token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
  /** When true, do not set Content-Type (lets the browser set the multipart boundary). */
  rawBody?: boolean;
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { rawBody, ...init } = options;
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = new Headers(init.headers);
  if (!rawBody) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (response.status === 401) {
    onUnauthorized?.();
    throw new ApiError(401, 'Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, extractMessage(body) ?? response.statusText ?? 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

/**
 * Pull a human message out of whatever the API returned: our own `{ message }`, or an
 * ASP.NET ProblemDetails validation payload (`{ title, errors: { Field: [msg] } }`).
 */
function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.message === 'string') return b.message;
  if (b.errors && typeof b.errors === 'object') {
    const first = Object.values(b.errors as Record<string, unknown>)
      .flat()
      .find((m): m is string => typeof m === 'string');
    if (first) return first;
  }
  if (typeof b.title === 'string') return b.title;
  return null;
}

/** Shared fallback for submit-handler catch blocks: use the server's message when there is one. */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) {
    return err.message;
  }
  return fallback;
}
