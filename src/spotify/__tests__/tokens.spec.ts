import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('../config', () => ({
  CLIENT_ID: 'test-client-id',
  REDIRECT_URI: 'http://127.0.0.1:5173/callback',
  TOKEN_ENDPOINT: 'https://accounts.spotify.com/api/token',
}));

/** The module holds a cache and an in-flight refresh, so each test gets its own. */
async function loadTokens() {
  vi.resetModules();
  return import('../tokens');
}

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) } as Response;
}

function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: () => Promise.resolve(body) } as Response;
}

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>;

beforeEach(() => {
  localStorage.clear();
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('exchangeCode', () => {
  it('sends the verifier and stores what comes back', async () => {
    const { exchangeCode, readTokens } = await loadTokens();
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 3600 }),
    );

    const tokens = await exchangeCode('the-code', 'the-verifier');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as unknown as string);
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('the-code');
    expect(body.get('code_verifier')).toBe('the-verifier');
    expect(body.get('client_id')).toBe('test-client-id');

    expect(tokens.accessToken).toBe('access-1');
    expect(readTokens()).toEqual(tokens);
  });

  it('surfaces the description Spotify gives for a rejected exchange', async () => {
    const { exchangeCode } = await loadTokens();
    fetchMock.mockResolvedValue(
      errorResponse(400, {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      }),
    );
    await expect(exchangeCode('stale', 'verifier')).rejects.toThrow('Invalid authorization code');
  });
});

describe('getAccessToken', () => {
  it('refuses when there is nothing stored', async () => {
    const { getAccessToken, AuthLostError } = await loadTokens();
    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthLostError);
  });

  it('hands back a token that is still good without asking Spotify', async () => {
    const { exchangeCode, getAccessToken } = await loadTokens();
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 3600 }),
    );
    await exchangeCode('code', 'verifier');
    fetchMock.mockClear();

    await expect(getAccessToken()).resolves.toBe('access-1');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  /** A token about to lapse would be handed to a request that outlives it. */
  it('refreshes a token inside the expiry margin', async () => {
    const { getAccessToken } = await loadTokens();
    localStorage.setItem(
      'rewindify:tokens',
      JSON.stringify({
        accessToken: 'nearly-spent',
        refreshToken: 'refresh-1',
        expiresAt: Date.now() + 10_000,
      }),
    );
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 3600 }),
    );

    await expect(getAccessToken()).resolves.toBe('access-2');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  /**
   * Spotify rotates refresh tokens, so parallel refreshes would leave the losers
   * holding one that has already been spent.
   */
  it('shares a single refresh between concurrent callers', async () => {
    const { getAccessToken } = await loadTokens();
    localStorage.setItem(
      'rewindify:tokens',
      JSON.stringify({ accessToken: 'spent', refreshToken: 'refresh-1', expiresAt: 0 }),
    );
    fetchMock.mockResolvedValue(
      okResponse({ access_token: 'access-2', refresh_token: 'refresh-2', expires_in: 3600 }),
    );

    const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()]);

    expect(tokens).toEqual(['access-2', 'access-2', 'access-2']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the previous refresh token when the response omits a new one', async () => {
    const { getAccessToken, readTokens } = await loadTokens();
    localStorage.setItem(
      'rewindify:tokens',
      JSON.stringify({ accessToken: 'spent', refreshToken: 'refresh-1', expiresAt: 0 }),
    );
    fetchMock.mockResolvedValue(okResponse({ access_token: 'access-2', expires_in: 3600 }));

    await getAccessToken();
    expect(readTokens()?.refreshToken).toBe('refresh-1');
  });

  it('clears the session and says so when Spotify refuses the refresh', async () => {
    const { getAccessToken, onAuthLost, hasTokens, AuthLostError } = await loadTokens();
    localStorage.setItem(
      'rewindify:tokens',
      JSON.stringify({ accessToken: 'spent', refreshToken: 'revoked', expiresAt: 0 }),
    );
    fetchMock.mockResolvedValue(errorResponse(400, { error: 'invalid_grant' }));

    const lost = vi.fn<() => void>();
    onAuthLost(lost);

    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthLostError);
    expect(lost).toHaveBeenCalledTimes(1);
    expect(hasTokens()).toBe(false);
  });

  /** A flaky network is not a revoked grant, so the tokens survive it. */
  it('keeps the tokens when the refresh fails on the network', async () => {
    const { getAccessToken, hasTokens } = await loadTokens();
    localStorage.setItem(
      'rewindify:tokens',
      JSON.stringify({ accessToken: 'spent', refreshToken: 'refresh-1', expiresAt: 0 }),
    );
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(getAccessToken()).rejects.toThrow('Failed to fetch');
    expect(hasTokens()).toBe(true);
  });
});

describe('readTokens', () => {
  it('treats unparseable storage as empty', async () => {
    localStorage.setItem('rewindify:tokens', '{not json');
    const { readTokens } = await loadTokens();
    expect(readTokens()).toBeNull();
  });

  it('rejects a stored value of the wrong shape', async () => {
    localStorage.setItem('rewindify:tokens', JSON.stringify({ accessToken: 'only-this' }));
    const { readTokens } = await loadTokens();
    expect(readTokens()).toBeNull();
  });
});
