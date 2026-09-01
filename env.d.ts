/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Spotify application client id, from `.env.local`. See `.env.example`. */
  readonly VITE_SPOTIFY_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
