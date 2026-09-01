# Rewindify

A looping player for practising a passage: pick A and B on the waveform and the
track repeats between them. Playback runs through the Spotify Web Playback SDK,
so a Spotify Premium account is required.

## Spotify setup

1. Create an app in the [Spotify for Developers dashboard](https://developer.spotify.com/dashboard).
2. Under **Which API/SDKs are you planning to use**, tick **Web API** and **Web Playback SDK**.
3. Add `http://127.0.0.1:5173/callback` as a redirect URI.
4. Copy `.env.example` to `.env.local` and put the app's client id in it.

Two things about that redirect URI:

- **It must be `127.0.0.1`, not `localhost`.** Spotify allows plain `http` only
  for the loopback address, and compares the string exactly. Open the dev server
  at `http://127.0.0.1:5173`, or the exchange fails with `INVALID_CLIENT`.
- The app derives its own redirect from `window.location.origin`, so deploying
  somewhere else means registering that origin's `/callback` too. Nothing in the
  code needs to change.

While the app is in development mode, only accounts you add under
**User Management** in the dashboard can authorise it.

The client id is public — the authorisation code flow with PKCE proves the
client with a per-attempt code verifier rather than a secret, which is why this
app needs no server of its own. It lives in `.env.local` (git-ignored) so a fork
points at its own Spotify app rather than inheriting this one's user allowlist
and rate limit.

## Running without Spotify

`npm run dev:fake` starts the app on fixtures at `http://127.0.0.1:5174` — no
account, no client id, no tokens, no network. It stands in for the three things
that need Spotify, each behind an interface the app already had:

| Real                        | Fixture                       |
| --------------------------- | ----------------------------- |
| `createSpotifyAuthSource`   | `createFakeAuthSource`        |
| `createSpotifyPlaybackSource` | `createFakePlaybackSource`  |
| `spotify/api`               | `fake/fakeApi`                |

The app boots already connected, the recently played list and search read a
thirty-track fixture catalogue, and the playhead advances on a timer — silent,
but the loop, transport and waveform behave as they do against a real device.

Useful for UI work, for a browser agent driving the app, and for anyone without
Premium. It is a development flag: `VITE_FAKE_SPOTIFY` unset folds to `false` at
build time, and the fixtures are dropped from the bundle with it.

## Development

### Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

### Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

### Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

### Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
