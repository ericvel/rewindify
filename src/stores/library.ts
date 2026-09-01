import { computed, onScopeDispose, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchRecentlyPlayed, fetchTrack, searchTracks } from '@/spotify/api'
import { AuthLostError } from '@/spotify/tokens'
import type { RecentEntry, Track } from '@/playback/types'

const RECENT_LIMIT = 8

/** Long enough that typing a word is one request, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 250

function describe(cause: unknown): string {
  if (cause instanceof AuthLostError) return 'The Spotify session expired.'
  return cause instanceof Error ? cause.message : 'Spotify could not be reached.'
}

function isAbort(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === 'AbortError'
}

export const useLibraryStore = defineStore('library', () => {
  /**
   * Every track the app has seen this session, by id. The catalogue is no longer
   * a fixture the app can index into: rows, the now-playing header and the
   * router all need a `Track` for an id they were handed, and this is what
   * spares them a request each time.
   */
  const cache = ref(new Map<string, Track>())

  /** Spotify's play log, newest first, one entry per track. */
  const history = ref<RecentEntry[]>([])

  /**
   * Tracks opened in this app, held in front of Spotify's history.
   *
   * Spotify only records a play after about thirty seconds and lags behind by
   * up to a minute, so a track you just opened would otherwise be missing from
   * the list that is meant to be showing it. These entries are reconciled away
   * as the history catches up: a track in both places appears once, dated by
   * whichever knows about the more recent play.
   */
  const sessionPlays = ref<RecentEntry[]>([])

  const searchResults = ref<Track[]>([])
  const isSearching = ref(false)
  const error = ref<string | null>(null)

  function remember(tracks: Track[]) {
    for (const track of tracks) cache.value.set(track.id, track)
  }

  function cached(trackId: string): Track | undefined {
    return cache.value.get(trackId)
  }

  /** Recently played, newest first, with entries for unknown tracks dropped. */
  const recentTracks = computed(() => {
    const newestByTrack = new Map<string, number>()
    for (const entry of [...sessionPlays.value, ...history.value]) {
      const known = newestByTrack.get(entry.trackId)
      if (known === undefined || entry.playedAt > known) {
        newestByTrack.set(entry.trackId, entry.playedAt)
      }
    }

    return [...newestByTrack]
      .sort(([, left], [, right]) => right - left)
      .map(([trackId, playedAt]) => ({ track: cached(trackId), playedAt }))
      .filter((entry): entry is { track: Track; playedAt: number } => entry.track !== undefined)
      .slice(0, RECENT_LIMIT)
  })

  /** Null for an account that has never played anything Spotify remembers. */
  const mostRecentTrack = computed<Track | null>(() => recentTracks.value[0]?.track ?? null)

  let historyLoad: Promise<void> | null = null

  /**
   * Fetches the play log once per session, or again on demand. Awaited by the
   * router, so a failure has to resolve rather than throw: an account whose
   * history will not load still gets the app, minus the list.
   */
  function loadHistory(force = false): Promise<void> {
    if (force) historyLoad = null
    historyLoad ??= (async () => {
      try {
        const { entries, tracks } = await fetchRecentlyPlayed()
        remember(tracks)
        history.value = entries
        error.value = null
      } catch (cause) {
        historyLoad = null
        error.value = describe(cause)
      }
    })()
    return historyLoad
  }

  /** The track for an id, from cache or from Spotify. Null if there is no such track. */
  async function ensureTrack(trackId: string): Promise<Track | null> {
    const known = cached(trackId)
    if (known) return known

    try {
      const track = await fetchTrack(trackId)
      if (track) remember([track])
      return track
    } catch (cause) {
      error.value = describe(cause)
      return null
    }
  }

  function markPlayed(track: Track) {
    remember([track])
    sessionPlays.value = [
      { trackId: track.id, playedAt: Date.now() },
      ...sessionPlays.value.filter((entry) => entry.trackId !== track.id),
    ].slice(0, RECENT_LIMIT)
  }

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined
  let latestRequest = 0

  async function run(query: string) {
    const request = ++latestRequest
    controller?.abort()
    controller = new AbortController()

    try {
      const tracks = await searchTracks(query, controller.signal)
      if (request !== latestRequest) return
      remember(tracks)
      searchResults.value = tracks
      error.value = null
    } catch (cause) {
      if (isAbort(cause) || request !== latestRequest) return
      searchResults.value = []
      error.value = describe(cause)
    } finally {
      if (request === latestRequest) isSearching.value = false
    }
  }

  /**
   * Searches Spotify, debounced. Results live on the store rather than being
   * returned, because they now arrive after the keystroke that asked for them —
   * the old fixture filter could answer inside a computed.
   */
  function search(query: string) {
    clearTimeout(timer)
    const needle = query.trim()

    if (!needle) {
      latestRequest++
      controller?.abort()
      searchResults.value = []
      isSearching.value = false
      return
    }

    isSearching.value = true
    timer = setTimeout(() => void run(needle), SEARCH_DEBOUNCE_MS)
  }

  onScopeDispose(() => {
    clearTimeout(timer)
    controller?.abort()
  })

  return {
    history,
    recentTracks,
    mostRecentTrack,
    searchResults,
    isSearching,
    error,
    cached,
    ensureTrack,
    loadHistory,
    markPlayed,
    search,
  }
})
