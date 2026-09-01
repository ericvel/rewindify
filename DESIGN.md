---
name: Rewindify
description: Practice hardware for looping a passage — one warm plate, printed scales, dark control caps, and one orange that means only the loop.
colors:
  surface-plate: "#ede9e2"
  surface-raised: "#f4f1ea"
  surface-well: "#e3dfd6"
  surface-well-deep: "#dcd7cc"
  surface-edge: "#d3cec2"
  surface-rule: "#dcd7cc"
  timeline-bar: "#827c71"
  timeline-bar-in-loop: "#7b7568"
  ink: "#2b2b2a"
  ink-body: "#55534d"
  ink-label: "#5f5c55"
  ink-inverse: "#f4f1ea"
  cap-top: "#3d3d38"
  cap-bottom: "#2a2a27"
  cap-ink: "#f2efe8"
  cap-edge: "#1f1f1d"
  accent: "#e2510f"
  accent-strong: "#c24309"
  accent-text: "#ab3d07"
  accent-wash: "rgba(226, 81, 15, 0.11)"
  on-accent: "#ffffff"
  surface-hi: "#ffffff"
typography:
  # Every role carries a desktop step and a phone step. `fontSize` below is the
  # desktop step; `scale` enumerates the full 15-step ramp both breakpoints draw
  # from, and the Typography section tables the pairs.
  scale:
    position-desktop: "64px"
    position-phone: "46px"
    view-title-desktop: "29px"
    view-title-phone: "25px"
    track-title-desktop: "24px"
    track-title-phone: "19px"
    readout-phone: "18px"
    brand-phone: "17px"
    readout-desktop: "16px"
    shared-15: "15px"
    shared-14: "14px"
    shared-13: "13px"
    shared-12: "12px"
    shared-11: "11px"
    legend-10: "10px"
  position:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "64px"
    fontWeight: 500
    lineHeight: 0.9
    letterSpacing: "-0.03em"
    fontFeature: "tnum 1"
  view-title:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "29px"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "-0.022em"
  track-title:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.012em"
  readout:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum 1"
  brand:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  row-title:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.006em"
  figure:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
    fontFeature: "tnum 1"
  meta:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.01em"
  legend:
    fontFamily: "Archivo Variable, Archivo, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.09em"
rounded:
  hair: "0.5px"
  tight: "2px"
  default: "3px"
  panel: "4px"
  switch-track-desktop: "13px"
  switch-track-phone: "14px"
  pill: "50%"
spacing:
  "3": "3px"
  "6": "6px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "18": "18px"
  "22": "22px"
  "24": "24px"
  "32": "32px"
components:
  key-transport:
    backgroundColor: "{colors.cap-top}"
    textColor: "{colors.cap-ink}"
    rounded: "{rounded.pill}"
    height: "60px"
    width: "60px"
  key-transport-mobile:
    backgroundColor: "{colors.cap-top}"
    textColor: "{colors.cap-ink}"
    rounded: "{rounded.pill}"
    height: "76px"
    width: "76px"
  button-primary:
    backgroundColor: "{colors.cap-top}"
    textColor: "{colors.cap-ink}"
    rounded: "{rounded.default}"
    height: "50px"
    padding: "0 16px"
  button-primary-disabled:
    backgroundColor: "{colors.surface-well-deep}"
    textColor: "{colors.ink-label}"
    rounded: "{rounded.default}"
    height: "50px"
  button-light:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    height: "34px"
    width: "34px"
  button-light-mobile:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.default}"
    height: "40px"
    width: "40px"
  input-search:
    backgroundColor: "{colors.surface-well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    height: "34px"
    padding: "0 9px"
  panel-well:
    backgroundColor: "{colors.surface-well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "22px 22px 14px"
  row-index:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "9px 14px"
  row-index-active:
    backgroundColor: "{colors.surface-well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.default}"
    padding: "9px 14px"
  chip-loop-point:
    backgroundColor: "{colors.accent-strong}"
    textColor: "#ffffff"
    rounded: "{rounded.tight}"
    height: "20px"
    width: "24px"
  chip-loop-point-off:
    backgroundColor: "{colors.surface-well-deep}"
    textColor: "{colors.ink-label}"
    rounded: "{rounded.tight}"
    height: "18px"
    width: "22px"
  chip-alert:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.default}"
    padding: "11px 13px"
  keycap:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.tight}"
    padding: "4px 5px"
  keycap-held:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ink-inverse}"
    rounded: "{rounded.tight}"
    padding: "4px 5px"
---

# Design System: Rewindify

## Overview

**Creative North Star: "The Bench Instrument"**

Rewindify is practice hardware, not a media player. It presents as one warm machined plate with things cut into it, things raised off it, and things printed on it — the visual grammar of Braun product graphics rather than of a streaming app. The category ships dark rounded cards floating over blurred cover art; this system refuses that outright. There is one plate, one ink, and one orange, and the orange means the loop.

The density is instrument density: exact quantities, generous tap targets, and no ornament competing with the one number the user came to read. The position readout is the largest object on the surface at 64px (46px on the phone) because the story is a musician holding an instrument who glances once, reads the exact position, steps back five seconds, and pins the passage as a loop. Everything downstream of that glance — the waveform timeline, the equal-weight step keys, the printed recently-played index — is arranged so nothing has to be hunted for.

Depth is real but shallow, the way a panel is. Surfaces are wells (recessed), caps (raised, pressable, dark), or print (labels and hairline rules). Nothing floats except the one popover, and nothing is outlined. The system is built to switch to an anthracite plate by redefining one token block, which is why no consumer anywhere reads a hex value.

**Key Characteristics:**

- One warm plate (`#EDE9E2`), one ink (`#2B2B2A`), one rationed orange (`#E2510F`).
- Every edge is a recess, a raised cap, or a 1px hairline. There are no outlined boxes.
- Archivo throughout, with tabular figures on every quantity and no monospace anywhere.
- Icons drawn on one 24-unit grid at a single 1.75px stroke; no glyph or Unicode stand-ins.
- One authored motion moment (arming the loop). No position value is ever eased.
- Keyboard-complete at both breakpoints; neither is the degraded case.
- Role-named tokens only, so a second plate is a token swap and not a refactor.

## Colors

A warm, low-chroma neutral field — five steps of the same clay-toned off-white — carrying one high-chroma orange that is rationed to a single meaning.

### Primary

- **Loop Orange** (`accent`): The loop, and only the loop. Graphics duty only at 3.20:1 on the plate: the span rules on the timeline and the switch track when the loop is armed. Never text.
- **Loop Orange Deep** (`accent-strong`): The same hue pushed to carry white text at 5.12:1. The A and B markers on the timeline and their matching chips in the nudger.
- **Loop Orange Ink** (`accent-text`): Accent-coloured *text* on the plate (5.10:1) and on the well (4.64:1). The word "LOOP" when armed, and the "LOOPING A → B" legend.
- **Loop Wash** (`accent-wash`): The 11% span tint that paints the armed passage. Never applied to anything but the loop region.
- **On Accent** (`on-accent`): Pure white, for marks and text sitting *on* an accent surface — the A/B markers and the armed nudger chips, at 5.12:1 over `accent-strong`. It exists so no component carries a raw `#ffffff`.

### Neutral

- **Warm Plate** (`surface-plate`): The ground for every screen and for the browser surface behind it (`theme-color` matches). Also the popover's own ground.
- **Raised Plate** (`surface-raised`): The lit top of a light cap, and the hover/highlight state on an index row.
- **Highlight** (`surface-hi`): Pure white, and only ever the *top stop of a hovered light cap*'s gradient. It is a lift, not a surface: nothing is filled with it.
- **Well** (`surface-well`): Every recess — panels, inputs, artwork, the active row, the engraved chassis strip along the bottom of both layouts.
- **Deep Well** (`surface-well-deep`): The bottom of a recess inside a recess: the switch track when off, the disarmed A/B chip, and a disabled primary action.
- **Plate Edge** (`surface-edge`): The 1px hairline that makes every structural edge in the product, and the inset ring around every well. The single most-used colour token in the build.
- **Rule** (`surface-rule`): The hairline *between peers* — index rows, list headers. Same value as Deep Well; kept as a separate role because a divider and a recess floor change independently.
- **Ink** (`ink`): All primary text (10.66:1 on the well), the played bars, the playhead, the focus ring, `::selection`, and the alert chip's ground.
- **Body Ink** (`ink-body`): Secondary text — artist names, copy, durations in the statusbar (5.78:1 on the well).
- **Label Ink** (`ink-label`): The floor for text in this system, at 5.02:1 on the well. Printed legends, tick labels, durations, the disarmed chip. Nothing quieter than this carries text.
- **Inverse Ink** (`ink-inverse`): Text on ink — the alert chip, the held key.
- **Cap Top / Cap Bottom / Cap Ink / Cap Edge** (`cap-*`): The dark raised control. Top and bottom are the two stops of the cap gradient; Cap Ink is the mark on it at 9.51:1; Cap Edge is the shadow colour the cap sits in.
- **Timeline Bar** (`timeline-bar`): An unplayed waveform bar, at 3.11:1 against the well.
- **Timeline Bar In Loop** (`timeline-bar-in-loop`): An unplayed waveform bar *inside the armed span*, where the washed ground is lighter. Holds 3.04:1 against that ground and 3.10:1 against the played bar.

### Named Rules

**The One Orange Rule.** `accent`, `accent-strong`, `accent-text` and `accent-wash` are one hue split by contrast duty, and they mean *the loop*. Nothing else on any surface may take orange — not a play button, not a link, not a brand mark, not a chart, not an error. This is why playback failures use an inverted-ink chip instead of red, why the focus ring is ink, and why `::selection` is ink. If a new element wants the accent, the question to answer first is whether it is the loop.

**The Ink Alert Rule.** The alert register is inverted ink: `ink` ground, `ink-inverse` text, 3px radius, with the drawn `alert` mark. There is no red, amber or green in this system, and adding one would be a second colour with a meaning — which is what the One Orange Rule exists to prevent.

**The Reserved Band Rule.** No generated, placeholder or decorative fill may land in HSL hue 5–45°, the band the accent occupies (`#E2510F` is ~19°). `src/fake/catalogue.ts` constrains fixture artwork to 70–300° for exactly this reason, and computes its inner disc as `hue + 40` so neither the ground nor the disc can wrap into the band. Any future generated imagery inherits this constraint.

**The Floor Rule.** The well, not the plate, is the binding surface: tick labels, legends, durations and the loop range all sit on it. `ink-label` at 5.02:1 there is the floor. A new text colour earns its place by measurement on the well, not by looking about right on the plate.

## Typography

**Display / Body / Label Font:** Archivo Variable (with Archivo, then `ui-sans-serif`, `system-ui`, `-apple-system`, `sans-serif`). One family does every job.

**Label/Mono Font:** none. There is deliberately no monospace in this system.

**Character:** A tight, high-legibility grotesque with a wide weight axis and real tabular figures — the face of a screen-printed instrument panel rather than of an editorial page. Titles are set tight and dark (negative tracking from -0.006em to -0.03em); labels are set small, bold and wide (+0.09em, uppercase) so the two registers can never be confused for each other.

### Hierarchy

**Every role has two steps: a desktop step and a phone step.** There is no fluid type in this build — no `clamp()`, no `vw` — so each role switches at the single 900px breakpoint. The frontmatter's per-role `fontSize` carries the desktop step; `typography.scale` enumerates the full 15-step ramp, and both steps are tabled here.

| Role | Desktop | Phone | Weight / setting | Where |
|---|---|---|---|---|
| **Position** | 64px | 46px | 500, 0.9, -0.03em, tabular | The playback position, top-left of the recessed panel. The single largest object on any screen; nothing else is set at either size. |
| **View Title** | 29px | 25px | 700, 1.14, -0.022em, `text-wrap: pretty` | The `h1` on Connect and Start. |
| **Track Title** | 24px | 19px | 600, 1.15, -0.012em | What is loaded, in the now-playing header. Deliberately a step below Position: it is what you are playing, not what you are working on. |
| **Readout** | 16px | 18px | 500, -0.01em, tabular | The A and B times in the nudger rows. **Inverted:** smaller on desktop, where the row is compact. |
| **Brand** | 15px | 17px | 700, -0.015em desktop / -0.018em phone | "Rewindify" in every header. **Inverted:** smaller on desktop, where it sits in a dense 56px chassis rather than at the top of a phone column. |
| **Body** | 15px | 14px | 400, 1.45 (copy) / 1.2 (artist) | Explanatory copy on Connect and Start, and the artist line, in Body Ink. Its smallest step is 13px, at the alert chips and the desktop search input. |
| **Row Title** | 14px | 14px | 600, -0.006em | Track titles in the printed index, single-line with ellipsis. Steps with the row size prop, not the breakpoint: 13px at `sm`, 15px at `lg`. |
| **Figure** | 12px | 12px | 500, tabular | Every quantity that is not the Position or the Readout. A band, not one step: 14/13px at the duration beside the position, 12px at the loop range and row durations, 11px at the smaller variants and the A/B markers, 10px at the keycaps and the phone tick labels. |
| **Meta** | 12px | 12px | 500, 0.01em | Album, session name, loop hint, empty-state text. 11px at the credit line. |
| **Legend** | 10px | 10px | 600, +0.09em, uppercase, Label Ink | The `legend()` mixin. Printed nomenclature: section titles, the status line, keyboard labels, "LOOP START", "SPOTIFY PREMIUM REQUIRED". Its one exception is `legend(11px)` on the callback screen. |

**How the ramp is shaped.** Above 16px, every step belongs to exactly one role at one breakpoint — those nine steps (64, 46, 29, 25, 24, 19, 18, 17, 16) are unambiguous, and a new value in that range is drift. From 15px down, the six remaining steps (15, 14, 13, 12, 11, 10) are shared across roles and distinguished by weight, tracking and tabular setting rather than by size. That sharing is what keeps a 15-step ramp from being 15 unrelated numbers, and it is also the ramp's weakest region — see `## Open`.

### Named Rules

**The Tabular Figures Rule.** Every figure the user reads as a quantity carries `font-variant-numeric: tabular-nums` and `font-feature-settings: 'tnum' 1`, applied through the `figures()` mixin and globally to `input`, `output`, `time` and `kbd`. Quantities never shift width as they tick. The corollary is absolute: **no monospace face anywhere** — the grotesque's own tabular figures do this job, and a mono face would read as a code editor, not an instrument.

**The Printed Legend Rule.** Small text is set through `legend()` — bold, tracked, uppercase, Label Ink — or it is not set small. There is no 10px sentence case in this system. Legends may be carried to their value on a dotted leader (`surface-edge`, 1px, `dotted`), the way a printed index carries a title to its duration.

**The One Numeral Rule.** Position is set larger than the track title, always. The build this replaced had a 20px clock beside a 22px title and consequently no focal point at all.

**The Two Steps Rule.** A role has a desktop step and a phone step, switched at the single 900px breakpoint — never a fluid `clamp()` or a `vw` term. A new size that is not one of the 15 documented steps is drift, and a new *role* must declare both of its steps before it ships.

**The Inverted Pair Rule.** Exactly two roles get *smaller* on desktop rather than larger: Brand (17→15) and Readout (18→16). Both sit in dense desktop chrome — a 56px header and a compact 52px nudger row — where the phone gives them a whole column. Every other role scales up. A third inversion needs a reason of the same kind, or it is a mistake.

## Layout

**One breakpoint: 900px.** Declared once, in `src/styles/media-queries.scss`, as `$screen-desktop: 900` and consumed by SCSS through the `screen-desktop` mixin and by TypeScript through an ICSS `:export` in `breakpoints.module.scss`. No pixel value for a breakpoint is restated anywhere else. 900px is the width where a 300px sidebar plus a workable timeline both fit.

**Desktop (≥900px)** is a fixed-height chassis: `height: 100dvh` with `overflow: hidden`, a 56px header, a body grid of `300px minmax(0, 1fr)`, and a 40px engraved statusbar. The height is fixed, not minimum, on purpose — the play log is as long as the history is, and it is the list that scrolls (`overflow-y: auto` on the sidebar list and on the main column), never the page. The main column uses `justify-content: safe center` so a tall window does not leave dead plate under the controls while a short one keeps its overflow reachable.

**Phone (<900px)** is a single 430px-max column, centred, with hairline plate edges down both sides, `min-height: 100dvh`, and 16px side padding. The control group is bottom-anchored (`margin-top: auto` on the transport) so the keys land under the thumb instead of leaving an empty tail. The 40px chassis strip is bled to the column edges.

**Density and rhythm.** Spacing is a 2px-granularity optical rhythm, not a ratio scale: 3 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 22 / 24 / 32 are the reused steps. Gutters are 16px on the phone, 20px in desktop chrome, 32px in the desktop working column. Component internals are tuned per component (a 54px nudger row, a 34px search field, a 60px header) rather than snapped to a scale.

**Wrap, don't squash.** The desktop controls row is `flex-wrap: wrap` with `gap: 16px 22px`, and the loop switch keeps to the right edge of whichever line it lands on. At 900px the three control groups need more room than the column has, and an unwrapped row scrolled the whole column sideways.

### Named Rules

**The Single Source Breakpoint Rule.** The 900px boundary lives in SCSS and is exported to TS. Never hard-code a media query width in a component, and never restate the number in JavaScript.

**The Keyboard Parity Rule.** `src/composables/usePlayerKeyboard.ts` is mounted by *both* player views. Space, arrow-step, `L`, and A/B-hold nudge work at every width; the phone layout is not the degraded case. A phone-width window is not necessarily a touch-only one, and the primary user's hands are on an instrument. Any new control that gains a keyboard path gains it in the shared composable, not in one view.

## Elevation & Depth

This system is neither flat nor floating: it is **machined**. Depth is shallow, physical and structural — a thing is cut into the plate, raised off it, or printed on it. There are exactly three depth devices and one exception (the search popover, which genuinely leaves the surface into the browser's top layer).

Every recess carries an inset 1px ring in `surface-edge` as part of its shadow, so a well's edge and its depth are one declaration. Every raised control carries a downward offset plus blur *and* a 13% white inset highlight along its top edge, which is what makes a cap read as lit from above rather than as a card with a drop shadow.

### Shadow Vocabulary

- **Well** (`box-shadow: inset 0 1px 2px rgba(88,80,64,0.16), inset 0 0 0 1px var(--surface-edge)`): Anything cut into the plate — panels, inputs, artwork, the active index row, the switch track.
- **Cap** (`box-shadow: 0 1px 1px rgba(31,31,29,0.3), 0 2px 5px rgba(31,31,29,0.16), inset 0 1px 0 rgba(255,255,255,0.13)`): Any raised pressable control, dark or light.
- **Cap Pressed** (`box-shadow: 0 1px 1px rgba(31,31,29,0.34), inset 0 1px 3px rgba(0,0,0,0.34)`): The `:active` state, paired with `transform: translateY(1px)`.
- **Key Held** (`box-shadow: inset 0 1px 3px rgba(0,0,0,0.45)`): A held A/B keycap. Same convention as Cap Pressed, one step deeper, because a held key is pressed and stays pressed rather than being pressed for a moment.
- **Popover** (`box-shadow: 0 1px 2px rgba(72,66,54,0.16), 0 10px 28px rgba(72,66,54,0.18)`): The search results plate, and nothing else.
- **Hairline** (`box-shadow: inset 0 ±1px 0 var(--surface-edge)` / `var(--surface-rule)`): Not depth but the same mechanism — every structural edge in the product is an inset hairline rather than a `border`. Edge for chrome boundaries, Rule for dividers between peers.

### Named Rules

**The Three Edges Rule.** `well()`, `cap()` and `cap-light()` in `src/styles/surfaces.scss` are the *only* ways to make an edge, alongside a printed hairline. **There are no outlined boxes in this system** — no `border: 1px solid`, no card outline, no ring. This one constraint is what makes eleven components and five views read as a single machined surface, and it is the first thing an accidental change will break.

**The Offset-Plus-Blur Rule.** Every shadow has a vertical offset. A zero-offset halo (`0 0 Npx`) is a glow, belongs to a different world, and is not used here.

**The One Popover Rule.** Exactly one thing in this product leaves the surface: the desktop search results, anchored with CSS anchor positioning (`anchor-name`, `position-area`, `position-try-fallbacks: flip-block`) and rendered on a plate-coloured ground. Everything else is in the plate. A second floating layer would break the "one panel" reading.

## Shapes

Radii are small and deliberate — a machined chamfer, not a soft card. Five steps, and each one has a job:

- **Hair (0.5px)**: declared, currently unused — the timeline bars moved to 1px when the field became a waveform render.
- **Tight (2px)**: printed-on things — the A/B markers and chips, keycaps, the artwork recess, the search clear button.
- **Default (3px)**: every control and every recess unless stated otherwise. This is the system's resting radius.
- **Panel (4px)**: the one recessed working panel on each layout, and the search popover.
- **Pill (50%)**: anything that is a true circle — the transport keys, the playhead knob, the switch knob, the Connect placeholder disc.
- **Switch track (14px phone / 13px desktop)**: not two chosen numbers but one derivation — see the rule below.

Silhouette rules: the transport keys are perfect circles of equal diameter (60px desktop, 76px phone) because a transport row on real gear has equal keys — stepping back is the most frequent action in a practice session and may never be the smallest key on the panel. The loop switch is a well cut into a light cap with a raised dark knob riding in it, which is the only compound recess-inside-a-cap in the system.

**Icons.** One drawn set in `src/components/AppIcon.vue`: a 24-unit `viewBox`, `stroke-width: 1.75`, round caps and joins, `currentColor`. Transport marks (play, pause) are filled, matching every physical transport; everything else is stroked. No icon library, no icon font, no Unicode character standing in for a mark. The step chevrons deliberately carry **no** track-boundary bar — a bar makes them read as "skip to the start of the track", which is the one thing those keys do not do.

### Named Rules

**The Half-Height Pill Rule.** A track that a knob rides in takes a radius of **half its own height, rounded up** — never a fixed step from the radius scale and never `9999px`. The loop switch is the only such track today, at both its sizes: 28px tall → 14px, 25px tall → 13px (12.5 rounded up). Those two values are therefore derived, not chosen; resize the track and the radius follows it. A true circle uses `50%` instead.

**The Drawn Mark Rule.** New icons are drawn on the 24-unit grid at 1.75 stroke and added to `AppIcon.vue`. Importing an icon package, or shipping a glyph like `»` or `▶` as an icon, breaks the set — the whole point is that a step key and a search field read as parts of one machine.

## Components

### Buttons

- **Shape:** the resting 3px chamfer, except transport keys (circular) and keycaps (2px).
- **Primary — dark cap** (`cap()`): the cap gradient with Cap Ink at 9.51:1. Used for transport keys and for "Continue with Spotify" (50px, full width). Presses by 1px into the Cap Pressed shadow over 110ms. Hover lightens the gradient top to `#474741`, behind `@media (hover: hover)`. Disabled drops to a Deep Well recess with Label Ink and `cursor: not-allowed`.
- **Secondary — light cap** (`cap-light()`): a raised plate-toned control for anything that must not read as primary — nudge keys (34/40px square), search buttons and the disconnect key (38px, expanding to a labelled 28px pill at desktop), the mobile search close (42px), keycaps. Hover lifts the gradient top to white.
- **Focus:** defined once in `base.scss` as `outline: 2px solid var(--ink)` at `2px` offset, inherited by every interactive element. Dark caps add `.cap-surface`, which swaps the ring to `surface-raised` at `3px` offset so it does not disappear into the cap. The ring is ink, never accent.
- **Icon-only buttons carry `aria-label`; every stepper label states its amount** ("Rewind 5 seconds", "Nudge A back 1 second").

### Chips

- **Loop point (A / B)** — the signature chip. `accent-strong` ground with white text at 5.12:1, 2px radius, tabular bold. The same chip appears at two scales: as a marker on the timeline (24×20 desktop / 22×18 phone) and as the row marker in the nudger, so the two read as one control.
- **Loop point, disarmed** — Deep Well ground with Label Ink. It takes the accent only when the loop is on, transitioning over `--arm-duration`.
- **Alert** — `ink` ground, `ink-inverse` text, 3px radius, drawn `alert` mark, `role="alert"`. On desktop the header status legend converts into this chip in place; on the phone it appears above the now-playing header only when there is something true to say.
- **Keycap** — `cap-light(2px)` with a tabular Body Ink letter. Its held state inverts to `ink` with an inset press shadow and `translateY(1px)`, because holding A or B is a real machine state.

### Cards / Containers

There are no cards. The container vocabulary is:

- **Working panel** — `well(4px)`, 22px padding on desktop / 18px 16px on phone. The one recess on the main column, because it is the region that must be found without looking for it.
- **Chassis strip** — a full-width 40px band of `surface-well` under an inset hairline, carrying the keyboard legends (desktop) or the credit (phone).
- **Popover** — `surface-plate` ground, 4px radius, Popover shadow, 4px padding, `max-height: 340px`.
- **Index row** — transparent by default, `inset 0 1px 0 var(--surface-rule)` between siblings, `surface-raised` on hover or keyboard highlight, and `well()` when it is the loaded track. Hairline rules instead of outlined cards: this is an index, not a stack.

### Inputs / Fields

- **Style:** `well()` — recessed, 3px radius, no border, no outline. 34px tall on desktop, 42px on the phone overlay. A drawn `search` mark in Label Ink leads; the placeholder is Label Ink.
- **Focus:** the input's own `outline: none`; the surrounding recess plus the caret (`caret-color: var(--ink)`) carry the state. Keyboard focus elsewhere in the combobox is expressed on the row, not the field.
- **Reset:** `::-webkit-search-cancel-button { appearance: none }` — the native clear affordance belongs to no design system. A drawn 14px `close` button replaces it on desktop.

### Navigation

There is no nav. Both layouts have a header that is brand + search + status + session, separated by 1px `surface-edge` dividers, sitting on the plate under an inset hairline. Brand is 15px/700 on desktop, 17px on the phone, at tight negative tracking. The session name is clipped with an ellipsis at 150px so a long Spotify display name squeezes itself before it squeezes the search control.

### Loop Timeline (signature component)

`src/components/TrackTimeline.vue`. Three stacked bands in one relative container: a knob strip (16/18px), the bar field (94px phone / 152px desktop), and a printed scale strip (24/26px). All overlays are positioned against the container using those two heights, so the geometry lives in one place.

- **The bar field** is a waveform render of 48 (phone) or 96 (desktop) bars at 2px gaps, heights from `generateWaveform()`, `border-radius: 2px`, mirrored about the centre line. Unplayed bars are Timeline Bar; played bars are `ink`; unplayed bars inside the armed span are Timeline Bar In Loop. The binning is deliberately coarse — ~4.5px bars on the phone, ~6px on desktop — because a finer render carried more contour but read as busy against the surface whose largest object is meant to be the position readout. Bars are objects here, not texture.
- **The printed scale** picks a major step from `[5, 10, 15, 30, 60, 120, 300, 600]` so the track carries roughly 8 (desktop) or 4 (phone) labelled graduations and every graduation lands on a whole number of seconds. Minor marks halve each major division. Edge labels are anchored inside the field so they cannot clip. This is what makes a glance yield a *time* rather than an impression.
- **The armed span** is `accent-wash` with 1px `accent` rules at each edge.
- **The playhead** is a 2px `ink` rule with a 12px dark cap knob riding the top strip.
- **Grips** (A, B, playhead) are 44px-wide invisible pointer targets. The A/B grips are `aria-hidden` and carry no keyboard path, because `LoopNudger` already exposes those values as real buttons — they are pointer conveniences, not controls posing as controls.

### Named Rules

**The One Variable Per Channel Rule.** On the timeline, *bar tone* carries played-versus-unplayed and *the accent* carries the loop — through the span wash, the edge rules, the A/B markers, the nudger chips, the legend and the switch. Painting played bars accent inside the span was tried and reverted: it collapsed played against unplayed to 1.24:1, making progress through the passage the least readable thing on screen in the one region this product exists for. Never give one channel two jobs.

**The Wash Behind Bars Rule.** `.timeline__region` must precede `.timeline__bars` in the template, so the span wash paints *behind* the bars. As a later sibling it tinted every bar it covered, and no bar tone could then clear 3:1 against both the washed ground and the played bar — the window was shut by 7%. Behind the bars, both pairs clear: played/unplayed 3.10:1, unplayed/ground 3.04:1. Reordering those two elements is a silent accessibility regression.

**The Fabricated Waveform Rule.** The field is drawn to read as an audio waveform, and it is not one. Spotify exposes no sample data, so `src/playback/waveform.ts` fabricates the shape from a hash of the track id alone. This is a deliberate, recorded trade: the surface is a portfolio piece and the waveform is what makes it read as practice software, so the honesty cost is accepted here and nowhere else. What makes the fake work is correlation at three scales — an arrangement of four to seven sections at distinct levels, phrase drift from summed octaves of value noise, and asymmetric per-bin scatter with sparse transients. Independent per-bar noise, which the field carried before, reads as broken rather than as audio. The field carries no periodic beat accent: one bar spans several beats at this pitch, and a beat grid would read as a pattern rather than as audio. Tests in `src/playback/__tests__/playback.spec.ts` hold the three scales: thirds of the field must diverge (arrangement), the mean step between neighbours must stay under a quarter of the field's spread (correlation), and both ends must open on air. Nothing in the interface may claim the shape is the track's audio, and no reading of it is offered as information — it is scenery around an exact position readout.

**The One Authored Moment Rule.** Arming the loop is the only designed motion in the build: the span sweeps open from its centre (`transform: scaleX(0 → 1)` plus opacity) over `--arm-duration` (320ms) on `--ease-out` (`cubic-bezier(0.16, 1, 0.3, 1)`, exponential, not a linear fade), and the grips fade in 120ms behind it. The region is mounted whether or not the loop is on, so the span *sweeps* rather than *appears*. Everything else is instant or a 110ms cap press. `prefers-reduced-motion: reduce` zeroes both durations at `:root`, which disables every transition in the system at once — new motion must be expressed through these two tokens so it inherits that.

**The Never-Eased Position Rule.** No position value is ever animated or interpolated. The playhead, the A/B handles and the span's left/width follow their values instantly (`.timeline__region { transition: none }`); only the fill is animated. An eased playhead would be a lie about where the music is.

## Do's and Don'ts

### Do:

- **Do** read a role token. Every consumer reads `var(--surface-well)` or `var(--ink-label)`, including the two whites — `--on-accent` for marks on an accent surface and `--surface-hi` for a hovered cap's top stop. Three colour literals remain, all in shadow or hover positions; see `## Open`. This is the reason an anthracite plate is close to a one-block change.
- **Do** make edges with `well()`, `cap()`, `cap-light()` or an inset hairline. Those four devices cover every surface in the product.
- **Do** measure a new text colour against `surface-well`, not the plate — the well is the binding case, and `ink-label` at 5.02:1 is the floor.
- **Do** put every quantity through `figures()`, and every small label through `legend()`.
- **Do** state amounts in labels: "Rewind 5 seconds", "Nudge B forward 1 second". Numbers in the interface are exact, and so are the words about them.
- **Do** add keyboard paths in `usePlayerKeyboard.ts` so both breakpoints get them.
- **Do** draw new icons on the 24-unit grid at 1.75 stroke in `AppIcon.vue`.
- **Do** express new motion through `--arm-duration` and `--press-duration` so `prefers-reduced-motion` keeps working.
- **Do** keep the position readout the largest thing on the surface.

### Don't:

- **Don't** put orange on anything that is not the loop. Not a play button, not a link, not a brand mark, not a percentage, not an error.
- **Don't** introduce a second signal colour. Red, amber and green do not exist here; the alert register is inverted ink.
- **Don't** draw an outlined box. No `border: 1px solid`, no card outline, no ring — a thing is recessed, raised, or printed.
- **Don't** ship a zero-offset shadow. Every shadow has a vertical offset; a halo is a different world.
- **Don't** use a monospace face for figures, or anywhere else. Archivo's tabular figures are the mechanism.
- **Don't** flatten `waveform.ts` back to independent per-bar noise, and don't let any label or copy claim the shape is the real audio.
- **Don't** move `.timeline__region` after `.timeline__bars`.
- **Don't** paint played bars with the accent inside the armed span.
- **Don't** ease a position value, and don't interpolate the playhead.
- **Don't** hard-code a breakpoint width; import it from `styles/breakpoints`.
- **Don't** give the A/B timeline grips their own keyboard path — `LoopNudger` owns those values as real buttons.
- **Don't** invent a Spotify mark. `ConnectView`'s neutral disc is a placeholder slot for the official asset (see Open below), not a design decision to defend.
- **Don't** let a pointer affordance under 40px ship on the phone. The nudge keys are 40px square because the user is holding an instrument.

## Open

Recorded as open, not as decided:

- **No anthracite rendition ships yet.** The token layer is built for it — one `:root` block behind an attribute selector — but the dark plate is undesigned and its contrast is unverified. Two anchors sit outside that block and would have to move with it: `color-scheme: light` in `base.scss`, and `<meta name="theme-color" content="#ede9e2">` in `index.html`.
- **`skipSeconds` (default 5) and `timeDisplay` (default `Remaining`) are persisted preferences with no control on any surface.** They are read from `localStorage` and shown in labels, but nothing in the UI can change them. Either they get a control or they stop being preferences.
- **Spotify's official mark is an outstanding obligation.** Spotify's developer terms require the official mark and a "content from Spotify" attribution. `ConnectView`'s `.connect__mark` is a deliberately neutral 14px disc holding the slot, and it must never be allowed to become an invented mark.
- **13px is carrying four unrelated registers.** It is the small step of Body (the alert chips, the desktop search input, the overlay empty state), the `sm` step of Row Title, the phone step of Figure (the duration beside the position), and the phone step of the loop label — which is set 600/uppercase/+0.06em and is the only one of the four that steps *down* to 12px on desktop while the rest stay at 13px. The code supports reading this as **four roles that collided on a number, not one role used four times**: each occurrence carries a different weight/tracking/tabular triple (600 uppercase tracked; 600 tight; 500 tabular; 400 plain), and none of them share a purpose. Nothing is broken today, but 13px is the one step in the ramp where a contributor cannot tell from the number which register they are in. Worth splitting the loop label off first, since it is the odd one that also breaks the pair convention.
- **The Readout role (16px desktop / 18px phone) may not be a real step.** It sits between Track Title (24/19) and Body (15/14) and exists for exactly one element, the A/B time in a nudger row. It could plausibly be Body at its large step, or Figure promoted; the ramp would lose two of its 15 steps if it went away. Recorded as a role because that is what the code does, flagged because one element is thin evidence for a step of its own.
- **`--cap-edge` is declared and unreferenced.** Its value (`#1F1F1D`) is in live use as a literal inside the three shadow tokens, so the role is real but nothing reads the variable.
- **`--on-accent` and `--surface-hi` are both pure white, and `--surface-rule` and `--surface-well-deep` are both `#DCD7CC`.** Two pairs of distinct roles sharing one value each. Deliberate — a mark on accent and a hover lift diverge the moment the plate goes dark, as do a divider and a recess floor — but a future edit that "deduplicates" them would silently couple things that are meant to move independently.
- **Three colour literals remain in components, all in shadow or hover positions.** `rgba(31,31,29,0.28)` (timeline marker shadow) and `rgba(242,239,232,0.62)` (the step count on a dark cap, 4.76:1) are alpha derivations of `--cap-edge` and `--cap-ink`; `#474741` is the lifted top stop of a hovered dark cap, and is the only cap-hover value in the system without a token. The fourth — `inset 0 1px 3px rgba(0,0,0,0.45)` on `.desktop__key--held` — was the one genuine piece of drift and is now the `--shadow-key-held` token (see Elevation), so the detector clears without anything being suppressed.
- **The `ink-label` floor is stated against the well, but one element sits deeper.** The disarmed A/B chip in `LoopNudger.vue` sets Label Ink on Deep Well at 4.65:1 rather than the 5.02:1 the token comments claim as the floor. Still AA for 11px/700, so it passes — but the floor as written does not describe that case.
