/**
 * Synthetic waveform. Spotify exposes no per-sample amplitude data, so bar
 * heights are generated deterministically from the track seed instead.
 *
 * Returns `barCount` values in the range 0.14 – 1, to be scaled to pixels by
 * the caller.
 */
export function generateWaveform(seed: number, barCount: number): number[] {
  let x = seed * 9301 + 49297
  const out: number[] = []
  for (let i = 0; i < barCount; i++) {
    x = (x * 9301 + 49297) % 233280
    const noise = x / 233280
    const envelope = 0.45 + 0.55 * Math.sin((i / barCount) * Math.PI * 2.3 + seed)
    out.push(Math.max(0.14, Math.min(1, 0.35 + noise * 0.75 * Math.abs(envelope))))
  }
  return out
}
