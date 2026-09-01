import { CLIENT_ID, REDIRECT_URI, TOKEN_ENDPOINT } from './config';

export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}

const STORAGE_KEY = 'rewindify:tokens';

/**
 * Refreshed this far ahead of the real expiry. An access token that is about to
 * lapse would otherwise be handed to a request that outlives it, and the 401
 * retry would pay for the difference.
 */
const REFRESH_MARGIN_MS = 60_000;

/**
 * Raised when Spotify will no longer renew the session — a revoked or rotated
 * refresh token, or an app the user has disconnected. Distinct from a transient
 * API failure because the only cure is going through the gate again.
 */
export class AuthLostError extends Error {
  constructor(message = 'The Spotify session has expired.') {
    super(message);
    this.name = 'AuthLostError';
  }
}

export class TokenError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'TokenError';
  }
}

/**
 * `undefined` means "not read from storage yet"; `null` means "read, nothing
 * there". Keeping the distinction lets a boot avoid re-parsing on every call
 * without treating a genuine absence as a cache miss.
 */
let cached: TokenSet | null | undefined;
let refreshInFlight: Promise<TokenSet> | null = null;

const lostListeners = new Set<() => void>();

/**
 * Notifies when the session dies somewhere other than a user action, which can
 * happen inside any request. The app uses it to drop its session and fall back
 * to the gate rather than showing a screen whose data can no longer load.
 */
export function onAuthLost(listener: () => void): () => void {
  lostListeners.add(listener);
  return () => lostListeners.delete(listener);
}

function isTokenSet(value: unknown): value is TokenSet {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<TokenSet>;
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.expiresAt === 'number'
  );
}

export function readTokens(): TokenSet | null {
  if (cached !== undefined) return cached;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    cached = isTokenSet(parsed) ? parsed : null;
  } catch {
    // Unparseable storage is the same situation as empty storage.
    cached = null;
  }
  return cached;
}

export function hasTokens(): boolean {
  return readTokens() !== null;
}

function storeTokens(tokens: TokenSet): TokenSet {
  cached = tokens;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Private mode or a full quota: the in-memory set still serves this tab.
  }
  return tokens;
}

export function clearTokens(): void {
  cached = null;
  refreshInFlight = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do; the in-memory clear is what the app reads.
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface TokenErrorResponse {
  error?: string;
  error_description?: string;
}

/**
 * `refresh_token` is optional on a refresh response: Spotify rotates it some of
 * the time and omits it the rest, so the previous one has to survive.
 */
function toTokenSet(body: TokenResponse, previousRefreshToken?: string): TokenSet {
  const refreshToken = body.refresh_token ?? previousRefreshToken;
  if (!refreshToken) throw new TokenError('Spotify returned no refresh token.');
  return {
    accessToken: body.access_token,
    refreshToken,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
}

async function postToken(params: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failure = (body ?? {}) as TokenErrorResponse;
    throw new TokenError(
      failure.error_description ?? failure.error ?? `Token request failed (${response.status}).`,
      failure.error,
    );
  }
  return body as TokenResponse;
}

/** Trades the one-time code from the callback for a token set. */
export async function exchangeCode(code: string, codeVerifier: string): Promise<TokenSet> {
  const body = await postToken(
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  );
  return storeTokens(toTokenSet(body));
}

async function runRefresh(tokens: TokenSet): Promise<TokenSet> {
  try {
    const body = await postToken(
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: CLIENT_ID,
      }),
    );
    return storeTokens(toTokenSet(body, tokens.refreshToken));
  } catch (error) {
    // A network blip is worth another try later, but a refusal is terminal: the
    // stored set can never work again, so it goes and the app hears about it.
    if (error instanceof TokenError) {
      clearTokens();
      for (const listener of lostListeners) listener();
      throw new AuthLostError(error.message);
    }
    throw error;
  }
}

/**
 * The access token to send with the next request, renewed when it is spent.
 *
 * Concurrent callers share a single refresh: without that, a screen firing three
 * requests at once would run three exchanges, and the two losers would be left
 * holding a refresh token Spotify had already rotated away.
 */
export async function getAccessToken(forceRefresh = false): Promise<string> {
  const tokens = readTokens();
  if (!tokens) throw new AuthLostError('Not connected to Spotify.');

  const isFresh = tokens.expiresAt - Date.now() > REFRESH_MARGIN_MS;
  if (isFresh && !forceRefresh) return tokens.accessToken;

  refreshInFlight ??= runRefresh(tokens).finally(() => {
    refreshInFlight = null;
  });
  return (await refreshInFlight).accessToken;
}
