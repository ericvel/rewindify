/**
 * Everything the Spotify integration takes from its environment.
 *
 * The client id is public by design. The authorisation code flow with PKCE
 * proves the client with a per-attempt code verifier rather than a secret, so a
 * single-page app can run the flow with nothing to hide — which is the whole
 * reason this app needs no server of its own.
 */
export const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? '';

export const IS_CONFIGURED = CLIENT_ID !== '';

/**
 * Derived from the running origin rather than configured separately, so there
 * is one fewer value to keep in sync — but Spotify compares it to the registered
 * list character for character. In development that means browsing the dev
 * server at `http://127.0.0.1:5173`: Spotify allows plain http only for the
 * loopback address, and `localhost` is a different string even though it
 * resolves to the same host.
 */
export const REDIRECT_URI = `${window.location.origin}/callback`;

/**
 * Whether Spotify would accept a redirect back to this origin at all. It takes
 * https, or plain http to the loopback address as a literal — `localhost` is a
 * name, not that literal, and is refused however identically it resolves.
 *
 * Checked before the flow starts, because the alternative is a round trip that
 * ends on Spotify's own `INVALID_CLIENT` page, which says nothing about why.
 */
export const IS_REDIRECT_ORIGIN_ALLOWED =
  window.location.protocol === 'https:' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]';

/**
 * `streaming` is what lets the Web Playback SDK register a device at all, and
 * it is Premium-only. The `user-read-*` profile pair carries the display name
 * and the product tier the gate checks. The player scopes are needed because
 * cueing a track on our own device goes through the Web API, not the SDK.
 */
export const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
] as const;

export const AUTHORIZE_ENDPOINT = 'https://accounts.spotify.com/authorize';
export const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
export const API_BASE = 'https://api.spotify.com/v1';
export const PLAYER_SDK_URL = 'https://sdk.scdn.co/spotify-player.js';

/** Shown on Spotify Connect wherever this session is listed. */
export const DEVICE_NAME = 'Rewindify';
