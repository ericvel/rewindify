import { API_BASE } from './config';
import { getAccessToken } from './tokens';

export class SpotifyApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

/**
 * Spotify's own limit is a rolling window, and it tells you how long to wait.
 * Two retries covers the incidental burst — a search racing a track fetch —
 * without holding a click hostage to a genuinely throttled account.
 */
const MAX_RATE_LIMIT_RETRIES = 2;
const MAX_RATE_LIMIT_WAIT_MS = 10_000;

export interface SpotifyRequest {
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

interface ApiErrorBody {
  error?: { status?: number; message?: string };
}

function buildUrl(path: string, query: SpotifyRequest['query']): string {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** `Retry-After` is in seconds; a missing or junk header falls back to a second. */
function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 1000;
}

async function toApiError(response: Response): Promise<SpotifyApiError> {
  const body: unknown = await response.json().catch(() => null);
  const message = (body as ApiErrorBody | null)?.error?.message;
  return new SpotifyApiError(
    response.status,
    message ?? `Spotify request failed (${response.status}).`,
  );
}

/**
 * One Web API call, with the bearer token attached and the two failures that
 * are not really failures absorbed.
 *
 * A 401 buys exactly one forced refresh and retry: the token can lapse between
 * the freshness check and the server reading it, but a second 401 means the
 * token is being refused rather than merely stale. A 429 waits out the window
 * Spotify names. Everything else surfaces as a `SpotifyApiError` for the caller
 * to decide about — a 404 on a track is a routing fallback, a 403 on playback is
 * a message to show.
 *
 * Endpoints that answer 204 (the player commands) resolve to `undefined`, so
 * only call those with `T` as `void`.
 */
export async function spotifyRequest<T>(path: string, request: SpotifyRequest = {}): Promise<T> {
  const { method = 'GET', query, body, signal } = request;
  const url = buildUrl(path, query);

  let hasRefreshed = false;
  let forceRefresh = false;
  let rateLimitRetries = 0;

  for (;;) {
    const token = await getAccessToken(forceRefresh);
    forceRefresh = false;

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });

    if (response.status === 401 && !hasRefreshed) {
      hasRefreshed = true;
      forceRefresh = true;
      continue;
    }

    if (response.status === 429 && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
      const wait = retryAfterMs(response);
      if (wait <= MAX_RATE_LIMIT_WAIT_MS) {
        rateLimitRetries++;
        await delay(wait);
        continue;
      }
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
}
