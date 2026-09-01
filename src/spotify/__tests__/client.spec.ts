import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { spotifyRequest, SpotifyApiError } from '../client'
import { getAccessToken } from '../tokens'

vi.mock('../config', () => ({ API_BASE: 'https://api.spotify.com/v1' }))
vi.mock('../tokens', () => ({ getAccessToken: vi.fn<typeof getAccessToken>() }))

const tokenFor = vi.mocked(getAccessToken)

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: () => Promise.resolve(body),
  } as Response
}

let fetchMock: Mock<(url: string, init: RequestInit) => Promise<Response>>

beforeEach(() => {
  fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
  vi.stubGlobal('fetch', fetchMock)
  tokenFor.mockReset()
  tokenFor.mockResolvedValue('access-1')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('spotifyRequest', () => {
  it('builds the url, attaches the bearer and drops undefined query values', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }))

    await spotifyRequest('/search', { query: { q: 'brightside', limit: 20, market: undefined } })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.spotify.com/v1/search?q=brightside&limit=20')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-1')
    expect(init.body).toBeUndefined()
  })

  it('sends a json body only when there is one', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, null))

    await spotifyRequest<void>('/me/player/play', {
      method: 'PUT',
      body: { uris: ['spotify:track:x'] },
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"uris":["spotify:track:x"]}')
  })

  it('resolves to undefined for the player endpoints that answer 204', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, null))
    await expect(
      spotifyRequest<void>('/me/player/pause', { method: 'PUT' }),
    ).resolves.toBeUndefined()
  })

  /**
   * A token can lapse between the freshness check and the server reading it, so
   * the first 401 buys a forced refresh.
   */
  it('forces one refresh and retries after a 401', async () => {
    tokenFor.mockResolvedValueOnce('stale').mockResolvedValueOnce('fresh')
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { error: { message: 'The access token expired' } }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

    await expect(spotifyRequest('/me')).resolves.toEqual({ ok: true })

    expect(tokenFor).toHaveBeenNthCalledWith(1, false)
    expect(tokenFor).toHaveBeenNthCalledWith(2, true)
    const [, retry] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect((retry.headers as Record<string, string>).Authorization).toBe('Bearer fresh')
  })

  /** A second 401 means the token is being refused, not merely stale. */
  it('gives up after a second 401', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: { message: 'Invalid access token' } }))

    await expect(spotifyRequest('/me')).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('waits out the window a 429 names, then retries', async () => {
    vi.useFakeTimers()
    try {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(429, null, { 'Retry-After': '2' }))
        .mockResolvedValueOnce(jsonResponse(200, { ok: true }))

      const pending = spotifyRequest('/search', { query: { q: 'x' } })
      await vi.advanceTimersByTimeAsync(2000)

      await expect(pending).resolves.toEqual({ ok: true })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('surfaces a throttle it would have to wait too long for', async () => {
    fetchMock.mockResolvedValue(jsonResponse(429, null, { 'Retry-After': '600' }))
    await expect(spotifyRequest('/search')).rejects.toMatchObject({ status: 429 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports the message Spotify sent with a failure', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, {
        error: { status: 403, message: 'Player command failed: Premium required' },
      }),
    )

    await expect(spotifyRequest('/me/player/play', { method: 'PUT' })).rejects.toThrow(
      'Player command failed: Premium required',
    )
  })

  it('still names the status when the failure body is not json', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      headers: { get: () => null },
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response)

    const failure = await spotifyRequest('/me').catch((error: unknown) => error)
    expect(failure).toBeInstanceOf(SpotifyApiError)
    expect((failure as SpotifyApiError).message).toContain('502')
  })
})
