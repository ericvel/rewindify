# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is the project's author, practising at an instrument, plus a small
circle of teachers, bandmates and students who are handed a link. The job is
learning a passage by ear: move back a few seconds again and again to hear the
same bars, and pin them into a loop once they are found.

The defining situation is hands-on-instrument. The user is not sitting at the
keyboard waiting to click — they are holding a guitar or sitting at keys, eyes on
the fretboard rather than the screen, and reaching for the app is an
interruption of practice. Moving inside the track must cost as little attention
and as few movements as possible.

Not a public product. It must survive other people opening a shared link, but it
is not designed to be discovered by strangers, and needs no growth surface.

## Product Purpose

Rewindify gives a practising musician real navigation inside a Spotify track:
step back and forward by a known number of seconds, and loop an arbitrary passage
between two points. Success is a user who can land on the bar they are working on
without aiming at anything, and then forget the app exists while they play.

Navigation is the primary job; looping is built on top of it. A session is mostly
"take that again from just before the change" — the loop is what happens once the
passage is pinned down.

## Positioning

Three claims, in order of weight. A neighbouring product could not truthfully
copy them together.

1. **Granular, repeatable rewind and fast-forward — the core differentiator.**
   Spotify gives the user exactly one way to move inside a track: drag a
   progress bar. That is aiming, not navigating. It is imprecise, it is
   irreproducible, it needs a pointer and a look, and on a phone-width bar a few
   pixels are several seconds. Rewindify replaces it with a step of a known
   size: one press moves back or forward by an exact number of seconds, the same
   amount every time, from a control that is trivial to hit repeatedly and is
   also on the keyboard. "Again, from four seconds earlier" is a thing the user
   can actually do.
2. **Sub-second A/B looping on Spotify audio.** Loop points set visually on a
   timeline and nudged from the keyboard. Spotify's own repeat loops whole tracks
   only; nothing in the Spotify clients loops a passage.
3. **Practice without leaving the streaming catalogue.** No downloads, no
   ripping, no separate practice library, no file management. The music the user
   already pays for becomes practice material in a browser tab.

## Operating Context

- Practice happens with an instrument in hand. The keyboard is the primary
  control surface during a session; the pointer is for setting things up.
- A shared loop is a URL. `?a`, `?b` and `?loop` ride on `/track/:trackId`, so an
  exact passage can be sent to someone else and opened cold.
- Sessions are interrupted and resumed. The app is opened mid-practice, left, and
  come back to; `/` resolves to the last thing played.
- Playback competes with the user's other Spotify clients. The browser has to
  register as a playback device and can lose it to a phone or desktop app
  mid-session.

## Capabilities and Constraints

Confirmed capabilities:

- Fixed-size rewind and fast-forward. Each press moves by `skipSeconds`
  (default 5), clamped to the loop bounds while looping and to the track
  otherwise, so repeated presses inside a passage cannot overshoot out of it.
  Reachable as the two outer transport buttons and as the left/right arrow keys.
- A/B loop over the waveform timeline, with draggable playhead and A/B handles,
  and a minimum loop length of 2 seconds.
- Keyboard control: space toggles play, arrows step back and forward by the
  configured skip, holding A or B turns the arrows into a nudge of that loop
  point, L toggles the loop.
- Track search and a recently played list, both reading the Spotify account.
- Per-user preferences persisted locally: skip size
  (`rewindify:skipSeconds`) and remaining-versus-total time display.
- Loop state mirrored into the URL, debounced, so sharing and reloading both
  work.
- Separate desktop and mobile player views behind a breakpoint.
- A fixture mode (`npm run dev:fake`, `VITE_FAKE_SPOTIFY`) that boots the whole
  app with no account, client id, tokens or network. Auth, playback and the API
  each sit behind an interface with a fake implementation. It is a development
  flag, dropped from production bundles.

Durable constraints, all four confirmed binding:

- **Spotify Premium and the Web Playback SDK.** All sound comes from Spotify.
  Premium is required, the browser must be registered as a device, and the
  transport has to be able to say when no device is available.
- **No backend.** Authorisation code flow with PKCE, a public client id, and
  deployment as static files. Nothing may require a server or a secret.
- **The waveform is fabricated.** Spotify exposes no audio samples, so the bars
  are generated from a hash of the track id (`src/playback/waveform.ts`,
  `src/spotify/track.ts`) and drawn to read as a real waveform. This is a
  deliberate trade taken for the portfolio: the shape is scenery that makes the
  surface read as practice software, and it carries no information about the
  audio. Nothing in the interface may state or label it as the track's audio,
  and no feature may be built that asks the user to read meaning from it —
  every exact value comes from the position readout, the printed scale and the
  A and B rows.
- **Desktop and mobile web are both first-class.** Two real views, not one
  responsive compromise. Neither may be treated as the degraded case.

Known gap, not a decision: the skip size is the centre of the product's main
claim, is persisted, and is printed on both transport buttons — but nothing in
the interface can change it. It is settable only by editing local storage.
Whether it becomes a control, a set of preset sizes, or something adaptive is
open.

Terminology: **step** (or rewind/fast-forward) is a fixed-size move by the skip
amount, and it is what Spotify's drag-only progress bar cannot do; **A** and
**B** are the loop points; **the loop** is the passage
between them; **nudge** is a keyboard-sized adjustment of one point; **the
timeline** is the waveform display the loop is set on — "the timeline" stays the
user-facing word, because calling it the waveform in copy would be a claim about
the audio that the fabricated shape cannot back.

## Brand Commitments

- Name: **Rewindify**. Author credit "Eric Veliyulin" appears in the footer.
- Spotify attribution is an outstanding obligation, not a settled state. The
  official Spotify mark and "content from Spotify" attribution are required by
  Spotify's developer terms, and neither is satisfied yet. The connect button now
  carries Phosphor's `SpotifyLogo` (`spotify` in `AppIcon.vue`), filled and
  monochrome in the cap's own ink — a third-party redraw of the real mark rather
  than the empty slot the neutral disc was, and rather than a competing mark
  invented here. Two things remain open: it is not the official asset Spotify's
  terms ask for, and no "content from Spotify" attribution appears anywhere in
  the product. Future work should treat both as the target, and must still never
  invent a mark of its own for the connect action.
- The design register is the familiar end of the spectrum, by the author's
  standing preference: on the round that produced the current look, two
  successive re-rolls asked for safer, conventional directions, with the steer
  "I want to keep the general current layout. the application should be easy to
  look at and understand." Treat legibility and convention as the bar for future
  surfaces rather than expression, unless the author says otherwise.
- The visual world is **the Bench Instrument** — Braun product graphics: a warm
  off-white plate, printed scales, dark control caps, and a single orange that
  means the loop and nothing else. That last rule is load-bearing: playback
  errors deliberately use inverted ink rather than a second colour so the accent
  stays exclusive. DESIGN.md holds the system; this is the commitment behind it.

## Evidence on Hand

- Working implementation with unit tests across auth, playback, loop
  transitions, router guards, stores and the desktop view.
- A thirty-track fixture catalogue (`src/fake/catalogue.ts`) driving the fake
  mode.
- `README.md` documents the real Spotify setup and the fixture mode accurately.
- No real users beyond the author and their circle. There are no testimonials,
  usage numbers, case studies, press, endorsements or partnerships, and none may
  be fabricated. Album artwork and track metadata come from Spotify at runtime;
  there are no owned photographic or illustrative assets.

## Product Principles

1. **Navigating beats aiming.** The user should never have to hit a target to
   move inside a track. Any movement worth making is worth having as a
   fixed-size, repeatable step that lands in the same place every time.
2. **The instrument comes first.** Every action must be reachable without
   letting go of the instrument, and worth the attention it costs. Stepping back
   is the most frequent action in a session and must stay the cheapest.
3. **Precision is the product.** Steps, loop points, times and ranges are stated
   exactly; nothing about position in the track may be approximate or ambiguous.
4. **Never overstate what Spotify gives us.** The device requirement and
   playback failures are told truthfully rather than dressed up. The waveform is
   the one deliberate exception, taken with eyes open and bounded by the
   constraint above: it may look real, but nothing may claim it is, and no
   decision the user makes may depend on reading it.
5. **A loop is a link.** Any state worth keeping is state worth sharing and
   restoring.
6. **Survive the interruption.** Practice is resumed, devices are stolen,
   sessions expire. The app should come back to where the user was rather than
   starting over.

## Accessibility & Inclusion

Keyboard-complete is a product requirement, not a courtesy: every action must be
reachable and operable without a pointer, because the primary user's hands are on
an instrument. No published standard has been adopted, so treat WCAG conformance
as unclaimed rather than as a floor.
