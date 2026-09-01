import { onScopeDispose, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import type { LoopRequest } from '@/stores/player'

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

/**
 * Mirrors the loop into the URL so a practice segment can be shared and
 * survives a refresh. Writes with `replace` and only on committed changes —
 * dragging updates scrub state, not `loopA`/`loopB`.
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
          query: {
            ...route.query,
            a: String(Math.round(player.loopA * 10) / 10),
            b: String(Math.round(player.loopB * 10) / 10),
            loop: String(player.loopOn),
          },
        })
      }, DEBOUNCE_MS)
    },
  )

  onScopeDispose(() => clearTimeout(timer))
}
