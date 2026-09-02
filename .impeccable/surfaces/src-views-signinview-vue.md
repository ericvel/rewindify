---
version: 1
slug: "src-views-signinview-vue"
primary_target: "src/views/SignInView.vue"
related_targets: ["src/components/LoopDemo.vue"]
---

# Sign-in view

Scope: the gate at `/sign-in` and the demonstration component it owns
(`src/components/LoopDemo.vue`). Visitor mode: **Persuade** — it is the one
screen in this product whose job is a decision rather than a task, and the only
screen a stranger arriving on a shared loop link sees before the app.

## Audience and job

Two visitors, one screen. A returning user who needs the key and nothing else,
and a stranger handed a link who has never seen the instrument. The gate has to
serve the first in one press without spending the second's only visit on a
paragraph.

## Direction

The Bench Instrument, shown rather than described. The working panel — the same
`well(4px)` recess, the same padding pair, the same field, the same printed
scale — is cut into the gate above the heading, and it runs a scripted session
on a fourteen-second cycle: the head runs from the top of the track, the loop
arms in the system's own 320ms sweep as the head reaches A, the passage wraps at
B twice, the loop releases, and playback carries on to the end before the track
starts over. The claim in the heading is the thing the recess is doing while it
is read.

The text under it was brought up to the same conviction in a second round. The
heading takes the numeral steps — 46/64, the pair the position readout owns —
because this is the one screen with no position on it, so nothing here is
outranked by a title set that large; it is cut to **Loop any passage**, two
lines, at Position's weight and tracking. The copy keeps its claims in one
shorter sentence. The requirement stays a single printed legend: a three-row
spec plate of nomenclature and values (REQUIRES / PLAYS IN / STEP SIZE, on the
nudger's dotted leader) was built here and taken back out on the author's call —
the gate has one precondition, and printing it as a table gave two more
statements a room they did not need.

This replaced a 420px column at View Title on bare plate — the one screen in the
product that carried none of the product's own devices. The alert slot, the
requirement line and the key keep their place and their order.

## Constraints this surface carries

- **The recess is a depiction, not a player.** No track, no artwork, no title,
  no readout, nothing claiming to be Spotify data. It is `aria-hidden`, has
  `pointer-events: none`, and exposes no control. A figure that would state a
  quantity about a real track may not be added to it.
- **`LoopDemo.vue` is deliberately not `TrackTimeline.vue`.** The player's
  timeline is store-bound, draggable, and owns the interactive geometry; wiring
  a fake store through it to make a picture would put demo branches inside the
  component the product exists for. The demo redraws the devices, and follows
  them when they change.
- **The head is a value that ticks, never a transition.** Same rule as the
  player: no position is eased or interpolated. `prefers-reduced-motion` cannot
  reach a `requestAnimationFrame` clock through the motion tokens, so the clock
  is stopped explicitly and the gate keeps the frame that carries the claim —
  armed, head inside the passage.
- **The head only moves forward under its own steam.** It cuts in exactly two
  places, both events the product owns: the wrap at B and the track ending. A
  demonstration of the fixed-size step ran here first and was cut on the
  author's call — a cut backwards mid-track reads as a broken animation rather
  than as a control, because nothing on this surface shows the press behind it.
  A future attempt at showing the step needs to show the press too.
- **The heading may take the numeral steps only while the gate has no position
  readout on it.** DESIGN.md carries this as the Gate Title role and states the
  condition; a heading at 46/64 on a screen that prints a position is what the
  One Numeral Rule exists to stop.
- **The passage may not be narrowed much below a quarter of the field.** At 24s
  of 90s the bracket reads as two marks on a span; tighter than that the two
  boundary rules close into an outline around it, which is the one figure this
  system does not draw.
- **A short plate gives up field height, never the key.** Under 700px of
  viewport height the field drops to 72px and the gaps close, so the error state
  still fits above the fold at 1000×560.
- **Spotify's official mark is still outstanding.** The key carries Phosphor's
  `SpotifyLogo`; the terms ask for the official asset and a "content from
  Spotify" attribution, and neither is satisfied. No mark may be invented here.

## Unresolved

- **The gate makes no claim about what the loop is for.** The demonstration
  shows the mechanism; nothing on the surface says a practice session is the
  scene. Whether that belongs here or is the copy's job is open.
- **The step is nowhere on this surface.** The fixed-size step is the product's
  primary claim, and the gate now shows and says only the loop: the step demo
  was cut for reading as broken, the heading was cut to `Loop any passage`, and
  the spec row that named the size went with the plate. Nothing here is untrue,
  but the differentiator arrives only after sign-in.
- **The cycle has no entry point.** A visitor lands mid-script, wherever the
  clock happens to be. Starting the cycle on mount was not tried; it would make
  the first three seconds the same for everyone, at the cost of a component that
  cares when it is looked at.
