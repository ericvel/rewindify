/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Spotify application client id, from `.env.local`. See `.env.example`. */
  readonly VITE_SPOTIFY_CLIENT_ID?: string
  /** `1` runs the app on fixtures instead of Spotify. See `src/fake/enabled.ts`. */
  readonly VITE_FAKE_SPOTIFY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
