/**
 * PKCE (RFC 7636) helpers for the authorisation code flow.
 *
 * The verifier is generated per attempt, kept in session storage while the
 * browser is away at Spotify, and sent once with the code exchange. Spotify
 * only accepts the S256 challenge method, so there is no plain fallback here.
 */

/** 64 random bytes encode to 86 characters, inside the spec's 43–128 range. */
const VERIFIER_BYTES = 64;
const STATE_BYTES = 16;

/** Base64url without padding, which is the only encoding PKCE accepts. */
function base64url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function randomBase64url(byteLength: number): string {
  return base64url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function createCodeVerifier(): string {
  return randomBase64url(VERIFIER_BYTES);
}

/** Opaque value echoed back by Spotify, so a stray callback can be rejected. */
export function createState(): string {
  return randomBase64url(STATE_BYTES);
}

export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(digest));
}
