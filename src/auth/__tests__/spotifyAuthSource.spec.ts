import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { effectScope } from 'vue';
import { createSpotifyAuthSource } from '../spotifyAuthSource';
import { fetchProfile } from '@/spotify/api';
import { clearTokens, exchangeCode, hasTokens } from '@/spotify/tokens';
import type { AuthSource } from '../types';

vi.mock('@/spotify/config', () => ({
  CLIENT_ID: 'test-client-id',
  IS_CONFIGURED: true,
  IS_REDIRECT_ORIGIN_ALLOWED: true,
  REDIRECT_URI: 'http://127.0.0.1:5173/callback',
  SCOPES: ['streaming', 'user-read-private'],
  AUTHORIZE_ENDPOINT: 'https://accounts.spotify.com/authorize',
}));

vi.mock('@/spotify/api', () => ({ fetchProfile: vi.fn<typeof fetchProfile>() }));

vi.mock('@/spotify/tokens', async () => {
  const actual = await import('@/spotify/tokens');
  return {
    AuthLostError: actual.AuthLostError,
    exchangeCode: vi.fn<typeof actual.exchangeCode>(),
    clearTokens: vi.fn<typeof actual.clearTokens>(),
    hasTokens: vi.fn<typeof actual.hasTokens>(() => true),
    onAuthLost: vi.fn<typeof actual.onAuthLost>(() => () => undefined),
  };
});

const profileFor = vi.mocked(fetchProfile);
const exchange = vi.mocked(exchangeCode);
const tokensPresent = vi.mocked(hasTokens);
const forget = vi.mocked(clearTokens);

const PREMIUM = { displayName: 'Eric Veliyulin', product: 'premium' } as const;
const assign = vi.fn<(url: string) => void>();

beforeAll(() => {
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
  // jsdom refuses a real navigation, and `connect` is nothing but one.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin: 'http://127.0.0.1:5173', search: '', assign },
  });
});

let scopes: ReturnType<typeof effectScope>[] = [];

/** The source is built inside a store's scope in the app; mirror that here. */
function createInScope(): AuthSource {
  const scope = effectScope();
  const source = scope.run(() => createSpotifyAuthSource());
  if (!source) throw new Error('Scope did not run.');
  scopes.push(scope);
  return source;
}

function pending(overrides: Record<string, string> = {}) {
  sessionStorage.setItem(
    'rewindify:pendingAuth',
    JSON.stringify({
      verifier: 'the-verifier',
      state: 'the-state',
      redirectTo: '/track/abc?a=30&b=60&loop=true',
      ...overrides,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllMocks();
  tokensPresent.mockReturnValue(true);
  profileFor.mockResolvedValue({ ...PREMIUM });
});

afterEach(() => {
  for (const scope of scopes) scope.stop();
  scopes = [];
});

describe('connect', () => {
  it('sends the browser to Spotify with an S256 challenge and remembers the attempt', async () => {
    await createInScope().connect('/track/abc');

    const [target] = assign.mock.calls[assign.mock.calls.length - 1] as [string];
    const url = new URL(target);
    expect(url.origin + url.pathname).toBe('https://accounts.spotify.com/authorize');
    expect(url.searchParams.get('client_id')).toBe('test-client-id');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe('http://127.0.0.1:5173/callback');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9\-_]{43}$/);

    const stored = JSON.parse(sessionStorage.getItem('rewindify:pendingAuth') ?? '{}');
    expect(stored.state).toBe(url.searchParams.get('state'));
    expect(stored.redirectTo).toBe('/track/abc');
    // The verifier itself must never leave in the URL.
    expect(target).not.toContain(stored.verifier);
  });
});

describe('completeRedirect', () => {
  it('exchanges the code and adopts a Premium account', async () => {
    pending();
    const source = createInScope();

    const target = await source.completeRedirect(
      new URLSearchParams({ code: 'the-code', state: 'the-state' }),
    );

    expect(exchange).toHaveBeenCalledWith('the-code', 'the-verifier');
    expect(target).toBe('/track/abc?a=30&b=60&loop=true');
    expect(source.session.value).toEqual(PREMIUM);
    expect(source.failure.value).toBeNull();
  });

  it('turns a Free account away rather than letting it reach a dead player', async () => {
    pending();
    profileFor.mockResolvedValue({ displayName: 'Free Listener', product: 'free' });
    const source = createInScope();

    const target = await source.completeRedirect(
      new URLSearchParams({ code: 'the-code', state: 'the-state' }),
    );

    expect(target).toBeNull();
    expect(source.session.value).toBeNull();
    expect(source.failure.value).toBe('free-account');
    expect(forget).toHaveBeenCalled();
  });

  it('reports a declined authorisation as declined', async () => {
    pending();
    const source = createInScope();

    const target = await source.completeRedirect(new URLSearchParams({ error: 'access_denied' }));

    expect(target).toBeNull();
    expect(source.failure.value).toBe('denied');
    expect(exchange).not.toHaveBeenCalled();
  });

  it('rejects a callback whose state does not match the attempt', async () => {
    pending();
    const source = createInScope();

    const target = await source.completeRedirect(
      new URLSearchParams({ code: 'the-code', state: 'somebody-elses-state' }),
    );

    expect(target).toBeNull();
    expect(source.failure.value).toBe('invalid-callback');
    expect(exchange).not.toHaveBeenCalled();
  });

  it('rejects a callback with no attempt behind it', async () => {
    const source = createInScope();

    const target = await source.completeRedirect(
      new URLSearchParams({ code: 'the-code', state: 'the-state' }),
    );

    expect(target).toBeNull();
    expect(source.failure.value).toBe('invalid-callback');
  });

  /** A verifier outlives its code by nothing; leaving it would poison the next try. */
  it('consumes the attempt even when the callback is unusable', async () => {
    pending();
    await createInScope().completeRedirect(new URLSearchParams({ error: 'server_error' }));
    expect(sessionStorage.getItem('rewindify:pendingAuth')).toBeNull();
  });

  it('reports a failed exchange and keeps nothing behind', async () => {
    pending();
    exchange.mockRejectedValue(new Error('invalid_grant'));
    const source = createInScope();

    const target = await source.completeRedirect(
      new URLSearchParams({ code: 'stale-code', state: 'the-state' }),
    );

    expect(target).toBeNull();
    expect(source.failure.value).toBe('exchange-failed');
    expect(source.session.value).toBeNull();
    expect(forget).toHaveBeenCalled();
  });
});

describe('a session restored from storage', () => {
  function storeSession() {
    localStorage.setItem('rewindify:session', JSON.stringify(PREMIUM));
  }

  it('is trusted synchronously, so a reload does not flash the gate', () => {
    storeSession();
    expect(createInScope().session.value).toEqual(PREMIUM);
  });

  it('is dropped when the tokens that went with it are gone', async () => {
    storeSession();
    tokensPresent.mockReturnValue(false);
    const source = createInScope();

    await source.revalidate();

    expect(source.session.value).toBeNull();
    expect(profileFor).not.toHaveBeenCalled();
  });

  it('survives a revalidation that fails on the network', async () => {
    storeSession();
    profileFor.mockRejectedValue(new TypeError('Failed to fetch'));
    const source = createInScope();

    await source.revalidate();

    expect(source.session.value).toEqual(PREMIUM);
  });

  it('ends when Spotify has stopped honouring the tokens', async () => {
    storeSession();
    const { AuthLostError } = await import('@/spotify/tokens');
    profileFor.mockRejectedValue(new AuthLostError());
    const source = createInScope();

    await source.revalidate();

    expect(source.session.value).toBeNull();
    expect(source.failure.value).toBe('expired');
  });

  /** Tokens with no profile are wreckage from an interrupted exchange. */
  it('clears orphaned tokens when there is no session to revalidate', async () => {
    const source = createInScope();
    await source.revalidate();
    expect(forget).toHaveBeenCalled();
  });
});

describe('disconnect', () => {
  it('clears the session and the tokens together', async () => {
    localStorage.setItem('rewindify:session', JSON.stringify(PREMIUM));
    const source = createInScope();

    await source.disconnect();

    expect(source.session.value).toBeNull();
    expect(source.failure.value).toBeNull();
    expect(forget).toHaveBeenCalled();
  });
});
