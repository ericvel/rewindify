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
chips and the loop legend with orange together, in one 320ms sweep from the
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
- Quantities get tabular figures and no monospace anywhere; monospace was doing
  wireframe duty across 36 declarations and is what made the prototype read as
  a spec.
- Keyboard-complete is a product requirement, so the focus ring is part of the
  design rather than a browser default.

## Unresolved

- **Anthracite plate.** The role tokens in `src/styles/tokens.scss` are named by
  job precisely so a dark rendition can be switched on by redefining one block.
  Braun's own range includes it, so it is not an inversion. Not designed or
  verified yet, and the practice scene (a lamp-lit room at night) argues for it.
- **Skip size.** Still settable only by editing local storage, by the user's
  explicit choice this pass. It is the centre of the product's main claim and is
  printed on both step keys, so it remains the largest open question on this
  surface.
- **`timeDisplay`.** Persisted as a preference with no control, the same class of
  gap as skip size. Nothing on the surface toggles remaining versus total.
- **Mobile keyboard shortcuts.** The global key handler lives only in
  `DesktopPlayerView`, so below 900px there are none. Awkward against a
  keyboard-complete requirement; a functional gap, not a styling one.
