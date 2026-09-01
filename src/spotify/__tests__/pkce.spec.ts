import { beforeAll, describe, expect, it, vi } from 'vitest'
import { webcrypto } from 'node:crypto'
import { createCodeVerifier, createState, deriveCodeChallenge } from '../pkce'

beforeAll(() => {
  // jsdom ships `getRandomValues` but not always `subtle`.
  if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto)
})

const BASE64URL = /^[A-Za-z0-9\-_]+$/

describe('createCodeVerifier', () => {
  it('produces a base64url string inside the length the spec allows', () => {
    const verifier = createCodeVerifier()
    expect(verifier).toMatch(BASE64URL)
    expect(verifier.length).toBeGreaterThanOrEqual(43)
    expect(verifier.length).toBeLessThanOrEqual(128)
  })

  it('differs between attempts', () => {
    expect(createCodeVerifier()).not.toBe(createCodeVerifier())
  })
})

describe('createState', () => {
  it('is opaque, unpadded and unique per attempt', () => {
    const state = createState()
    expect(state).toMatch(BASE64URL)
    expect(state).not.toBe(createState())
  })
})

describe('deriveCodeChallenge', () => {
  /** The worked example from RFC 7636, appendix B. */
  it('matches the S256 challenge in the spec', async () => {
    await expect(deriveCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).resolves.toBe(
      'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    )
  })

  it('never emits characters that would need escaping in a query', async () => {
    const challenge = await deriveCodeChallenge(createCodeVerifier())
    expect(challenge).toMatch(BASE64URL)
  })
})
