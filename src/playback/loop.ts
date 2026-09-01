export interface LoopState {
  position: number
  duration: number
  loopOn: boolean
  loopA: number
  loopB: number
}

/**
 * What the player should do about the position the source just reported.
 *
 * `wrap` restarts the loop at A; `end` stops a finished track, which the design
 * left playing forever. Kept pure so the rule is testable without a clock.
 */
export function resolveLoopTransition(state: LoopState): 'wrap' | 'end' | null {
  const { position, duration, loopOn, loopA, loopB } = state
  if (loopOn && loopB > loopA && position >= loopB) return 'wrap'
  if (!loopOn && duration > 0 && position >= duration) return 'end'
  return null
}
