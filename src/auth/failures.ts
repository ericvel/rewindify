import type { AuthFailure } from './types'

/**
 * What the gate says about a connection attempt that produced no session.
 *
 * Each line names the cause and, where there is one, the way out — a visitor
 * turned away by their own account tier cannot be helped by trying again.
 */
export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  unconfigured: 'This build has no Spotify client id. Set VITE_SPOTIFY_CLIENT_ID and reload.',
  'bad-origin':
    'Open Rewindify at http://127.0.0.1:5173 instead. Spotify accepts a plain-http redirect only to the loopback address, and treats localhost as a different one.',
  denied: 'Spotify authorisation was declined. Rewindify needs it to play anything.',
  'invalid-callback': 'That sign-in could not be verified. Please start again.',
  'exchange-failed': 'Spotify could not complete the sign-in. Please try again.',
  'free-account':
    'That account is on Spotify Free. Playback in the browser is a Premium feature, so Rewindify cannot stream to it.',
  expired: 'The Spotify session expired. Please connect again.',
}
