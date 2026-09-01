/**
 * Whether the app runs on fixtures instead of Spotify.
 *
 * `VITE_FAKE_SPOTIFY=1` replaces the three things that need an account — the
 * session, the Web API and the playback device — with local stand-ins, so the
 * UI can be worked on and driven by a browser without Premium, without a
 * registered redirect origin and without a live session to hand.
 *
 * With the flag unset this folds to `false` at build time and the fixtures go
 * with it, so nothing here reaches a production bundle.
 */
export const IS_FAKE_SPOTIFY = import.meta.env.VITE_FAKE_SPOTIFY === '1';
