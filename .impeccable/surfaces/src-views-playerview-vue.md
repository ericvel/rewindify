---
version: 1
slug: "src-views-playerview-vue"
primary_target: "src/views/PlayerView.vue"
related_targets: ["src/views/DesktopPlayerView.vue","src/views/MobilePlayerView.vue"]
---

# Player view

Scope: the two player views and the components they own, plus the app-wide
plate they established (Connect, Start, Callback inherit it). Visitor mode:
**Operate**.

## Audience and job

A practising musician with the instrument in hand, eyes on the fretboard, at a
phone on a music stand or a laptop off to the side — both first-class, neither
the degraded case. The job is to land on the bar being worked on without aiming
at anything, pin it as a loop, and then forget the interface exists. Stepping
back is the most frequent action in a session and must stay the cheapest thing
on the surface.

## Direction

**The Bench Instrument** — Braun product graphics. A warm off-white plate,
printed scales, dark control caps, and exactly one orange that means the loop
and nothing else. Chosen from the familiar register after two re-rolls, under a
binding steer: keep the existing layout, and make it easy to look at and
understand. Seed 701ed916.

The memorable moment is the neutral state: with the loop off there is no accent
anywhere on the surface. Arming it fills the span, both A/B markers, the nudger
chips and the switch label with orange together, in one 320ms sweep from the
span's centre. One colour, one meaning, learnable in a single session without a
hint line.

## Constraints this surface carries

- The layout is pinned by the user. Section order and skeleton of both player
  views stay; expression lives in material, weight and hierarchy, not
  arrangement.
- The timeline is synthetic, hashed from the track id. It sits on a real
  graduated scale so a glance yields a time, and it is never labelled or
  implied to be audio.
- Errors use inverted ink, never a second hue, so the accent stays exclusive to
  the loop. This is why a lost device reads as a dark chip rather than a red one.
- Two things leave the plate and both are choosers — the search results and the
  saved-loops list. What earns the top layer is being a set of candidates
  anchored to the field you pick in; a tooltip, a menu of actions or a dialog
  does not. Everything else is a well, a cap or print.
- Quantities get tabular figures and no monospace anywhere; monospace was doing
  wireframe duty across 36 declarations and is what made the prototype read as
  a spec.
- Keyboard-complete is a product requirement, so the focus ring is part of the
  design rather than a browser default.
- Three layout bands, two views. The phone view is full-bleed at every width
  below 900px and has a wide band of its own from 640px: two-up loop rows,
  desktop type steps for Position and Track Title, 24px gutters, and the working
  block centred instead of bottom-anchored. Neither the phone nor the tablet is
  the degraded case, and no third type step may be invented for the middle.
- A wide phone window at 480px high or below becomes two banks: track and
  timeline on the left, every practice control on the right. It returns to the
  existing phone type step, shortens the timeline field, and stacks A/B rather
  than shrinking a target or sending transport below the fold.
- Step size is a compact recessed quantity selector in the chassis strip, never
  a transport cap or a practice-control bay: 2, 5, 10 and 15 seconds. It sits
  beside the desktop arrow-key legend and opposite the mobile credit. The two
  dark step keys remain one-press actions and update their printed amount
  immediately.

## Unresolved

- **Anthracite plate.** The role tokens in `src/styles/tokens.scss` are named by
  job precisely so a dark rendition can be switched on by redefining one block.
  Braun's own range includes it, so it is not an inversion. Not designed or
  verified yet, and the practice scene (a lamp-lit room at night) argues for it.
- **`timeDisplay`.** Persisted as a preference with no control, the same class of
  gap as skip size. Nothing on the surface toggles remaining versus total.
- **No keyboard legends below 900px.** `usePlayerKeyboard` is mounted by both
  views, so the shortcuts themselves work at every width — but only the desktop
  statusbar prints them. In the wide band, where a keyboard is likely attached,
  the chassis strip carries the step preference and credit, but no shortcut
  legends.
- **Short desktop windows.** Below about 700px of desktop height the controls
  row can scroll out of the main column, and an anchored plate follows its field
  off-screen. Short, wide mobile windows now use a two-bank landscape layout;
  the remaining case is desktop height rather than phone orientation.
- **The scope of a saved loop is unprinted while the list has rows.** The
  drawer's `SAVED ON THIS TRACK` legend went with the header this pass removed;
  first-use guidance still says it, a populated plate does not. See DESIGN.md's
  `## Open` — the fact is load-bearing and the window's legend has no room for
  the qualifier at the width the controls row can spare.
