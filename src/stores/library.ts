import { computed } from 'vue'
import { defineStore } from 'pinia'
import { TRACKS, seedRecent } from '@/data/tracks'
import { useLocalStorage } from '@/composables/useLocalStorage'
import type { RecentEntry, Track } from '@/playback/types'

const RECENT_LIMIT = 8

export const useLibraryStore = defineStore('library', () => {
  const tracks = computed(() => TRACKS)
  const recent = useLocalStorage<RecentEntry[]>('rewindify:recent', seedRecent())

  function findTrack(trackId: string): Track | undefined {
    return TRACKS.find((track) => track.id === trackId)
  }

  /** Recently played, newest first, with entries for unknown tracks dropped. */
  const recentTracks = computed(() =>
    recent.value
      .map((entry) => ({ track: findTrack(entry.trackId), playedAt: entry.playedAt }))
      .filter((entry): entry is { track: Track; playedAt: number } => entry.track !== undefined),
  )

  const mostRecentTrack = computed(() => recentTracks.value[0]?.track ?? TRACKS[0])

  function markPlayed(trackId: string) {
    if (!findTrack(trackId)) return
    recent.value = [
      { trackId, playedAt: Date.now() },
      ...recent.value.filter((entry) => entry.trackId !== trackId),
    ].slice(0, RECENT_LIMIT)
  }

  /** Case-insensitive match on title, artist or album. Empty query matches all. */
  function searchTracks(query: string): Track[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return TRACKS
    return TRACKS.filter(
      (track) =>
        track.title.toLowerCase().includes(needle) ||
        track.artist.toLowerCase().includes(needle) ||
        track.album.toLowerCase().includes(needle),
    )
  }

  return { tracks, recent, recentTracks, mostRecentTrack, findTrack, markPlayed, searchTracks }
})
