import { onScopeDispose, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import type { LoopRequest } from '@/stores/player'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/** Coalesces bursts of nudges into a single history-free URL write. */
const DEBOUNCE_MS = 150

function toSeconds(value: unknown): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  // `Number('')` is 0, so an empty `?a=` would otherwise read as a real bound.
  if (typeof raw !== 'string' || raw.trim() === '') return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

function toBoolean(value: unknown): boolean | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'true') return true
  if (raw === 'false') return false
  return undefined
}

/** Reads `?a&b&loop` off the current route. Out-of-range values are clamped later. */
export function readLoopFromQuery(query: Record<string, unknown>): LoopRequest {
  return {
    a: toSeconds(query.a),
    b: toSeconds(query.b),
    on: toBoolean(query.loop),
  }
}

/** Rounds to a tenth of a second: finer than that is noise in a shared link. */
function toParam(seconds: number) {
  return String(Math.round(seconds * 10) / 10)
}

/**
 * The loop params written over whatever else the route carries. Off means the
 * three keys are absent, not `loop=false` — the reader treats both the same.
 */
export function loopQuery(
  query: LocationQuery,
  loopOn: boolean,
  a: number,
  b: number,
): LocationQueryRaw {
  const { a: _a, b: _b, loop: _loop, ...rest } = query
  if (!loopOn) return rest
  return { ...rest, a: toParam(a), b: toParam(b), loop: 'true' }
}

/**
 * Mirrors the loop into the URL so a practice segment can be shared and
 * survives a refresh. Writes with `replace` and only on committed changes —
 * dragging updates scrub state, not `loopA`/`loopB`.
 *
 * With the loop off there is no segment to describe, so `a`/`b`/`loop` leave
 * the URL entirely rather than lingering as dead state in a shared link.
 */
export function useLoopUrlSync() {
  const route = useRoute()
  const router = useRouter()
  const player = usePlayerStore()

  let timer: ReturnType<typeof setTimeout> | undefined

  watch(
    () => [player.currentTrack?.id, player.loopOn, player.loopA, player.loopB] as const,
    () => {
      clearTimeout(timer)
      // Values are read at flush, not captured, so a track change and the loop
      // reset it triggers collapse into one write of the settled state.
      timer = setTimeout(() => {
        const track = player.currentTrack
        if (!track || track.id !== route.params.trackId) return
        void router.replace({
          name: 'track',
          params: route.params,
          query: loopQuery(route.query, player.loopOn, player.loopA, player.loopB),
        })
      }, DEBOUNCE_MS)
    },
  )

  onScopeDispose(() => clearTimeout(timer))
}
