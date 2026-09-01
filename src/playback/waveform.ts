/**
 * The synthetic waveform the timeline is drawn from.
 *
 * Spotify exposes no per-sample amplitude data, so there is nothing real to
 * plot. This module fabricates a plausible one: the shape is derived entirely
 * from the track id's seed and has no relationship to the audio. It is
 * deliberately drawn to read as a waveform — see DESIGN.md and PRODUCT.md,
 * which record that decision and the honesty cost that comes with it.
 *
 * What makes a fake read as real is correlation, not randomness. Independent
 * per-bar noise gives an even picket fence that looks broken; a real RMS field
 * has architecture at three scales at once:
 *
 *   1. Arrangement — four to seven sections at distinct levels, with hard
 *      boundaries. This is what a listener recognises as verse/chorus.
 *   2. Phrase drift — smooth swells inside a section, from summed octaves of
 *      value noise, so no section is a flat slab.
 *   3. Bin fuzz — asymmetric per-bar scatter with sparse transients, so the
 *      outline has grain instead of a drawn edge. Deliberately no periodic beat
 *      accent: the field is binned coarsely enough that one bar spans several
 *      beats, and a beat grid at this pitch reads as a pattern, not as audio.
 *
 * Returns `barCount` values in 0.04 – 1, near-peak-normalised, to be scaled to
 * pixels and mirrored about the centre line by the caller.
 */

/** Small, fast, fully deterministic PRNG. Any seed gives the same track. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t);
}

/** Smoothstep-interpolated lattice: the one-dimensional value-noise primitive. */
function sampleLattice(points: readonly number[], t: number) {
  const last = points.length - 1;
  const x = t * last;
  const i = Math.min(Math.floor(x), last);
  const a = points[i] ?? 0;
  const b = points[Math.min(i + 1, last)] ?? a;
  return a + (b - a) * smoothstep(x - i);
}

/*
 * Cell counts are coprime-ish and roughly tripling, so the octaves never line
 * up into a repeating beat pattern across the field.
 */
const OCTAVES = [
  { cells: 5, gain: 0.38 },
  { cells: 17, gain: 0.31 },
  { cells: 53, gain: 0.2 },
  { cells: 149, gain: 0.11 },
];

export function generateWaveform(seed: number, barCount: number): number[] {
  if (barCount <= 0) return [];
  const rand = mulberry32(seed);

  /*
   * Arrangement. Boundaries are drawn from the seed rather than spaced evenly,
   * because an evenly divided track reads as a chart. One section is forced
   * low: a track with no quiet passage has no silhouette.
   */
  const sectionCount = 4 + Math.floor(rand() * 4);
  const levels = Array.from({ length: sectionCount }, () => 0.5 + rand() * 0.5);
  levels[1 + Math.floor(rand() * (sectionCount - 1))] = 0.2 + rand() * 0.16;
  const opening = levels[0] ?? 0.8;

  /** Sections cross over a short ramp; an instant jump reads as an edit, not a bar. */
  const CROSSFADE = 0.014;
  const handovers = levels.slice(1).map((level, i) => ({
    level,
    cut: (i + 1 + (rand() - 0.5) * 0.55) / sectionCount,
  }));

  function arrangement(t: number) {
    let level = opening;
    for (const handover of handovers) {
      const blend = smoothstep(
        Math.min(1, Math.max(0, (t - handover.cut) / CROSSFADE + 0.5)),
      );
      level += (handover.level - level) * blend;
    }
    return level;
  }

  const octaves = OCTAVES.map(({ cells, gain }) => ({
    gain,
    points: Array.from({ length: cells }, () => rand()),
  }));
  const totalGain = OCTAVES.reduce((sum, octave) => sum + octave.gain, 0);

  function drift(t: number) {
    let sum = 0;
    for (const octave of octaves) {
      sum += sampleLattice(octave.points, t) * octave.gain;
    }
    return sum / totalGain;
  }

  const raw: number[] = [];
  for (let i = 0; i < barCount; i++) {
    const t = (i + 0.5) / barCount;
    let value = arrangement(t) * (0.42 + 0.58 * drift(t));
    /*
     * Bin scatter is asymmetric on purpose. A peak-envelope render dips below
     * its own outline far more often than it exceeds it, and the rare bin that
     * does overshoot — a hit, a plosive, a snare — is what stops the edge
     * looking airbrushed. Symmetric jitter gives a sausage.
     */
    value *= 0.78 + 0.26 * rand();
    if (rand() < 0.045) value *= 1.16 + rand() * 0.3;
    // Tracks start and end on air, not on a cliff.
    value *= smoothstep(Math.min(1, t / 0.02));
    value *= smoothstep(Math.min(1, (1 - t) / 0.05));
    raw.push(value);
  }

  /*
   * Normalise against the near-peak rather than the single tallest bin, so one
   * outlier transient cannot flatten the whole field; the outliers then clip to
   * the top of the render, which is what a real peak render does anyway.
   */
  const sorted = [...raw].sort((a, b) => a - b);
  const ceiling = Math.max(sorted[Math.floor(sorted.length * 0.985)] ?? 0, 1e-6);
  return raw.map((value) => Math.min(1, Math.max(0.04, value / ceiling)));
}
