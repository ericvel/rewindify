import { FAKE_TRACKS, fakeTrack } from './catalogue';
import type { RecentlyPlayed } from '@/spotify/api';
import type { RecentEntry, Track } from '@/playback/types';

/** Long enough that loading states are visible, short enough not to annoy. */
const LATENCY_MS = 140;

/**
 * Resolves after the fixture latency, or rejects the way `fetch` does when the
 * caller gives up — the search store distinguishes an abort from a failure, and
 * a fake that never aborts would leave that path untested by hand.
 */
function settle<T>(value: T, signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(value);
    }, LATENCY_MS);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    }

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** How much of the catalogue the fixture account has a play log for. */
const PLAYED_COUNT = 26;

/** Spacing between fixture plays, so the timestamps read as an afternoon of practice. */
const PLAY_SPACING_MS = 11 * 60_000;

export function fetchRecentlyPlayed(limit = 50): Promise<RecentlyPlayed> {
  const played = FAKE_TRACKS.slice(0, PLAYED_COUNT).slice(0, limit);
  const now = Date.now();

  const entries: RecentEntry[] = played.map((track, index) => ({
    trackId: track.id,
    playedAt: now - index * PLAY_SPACING_MS,
  }));

  return settle({ entries, tracks: played });
}

export function fetchTrack(id: string): Promise<Track | null> {
  return settle(fakeTrack(id) ?? null);
}

export function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  const needle = query.trim().toLowerCase();
  const matches = FAKE_TRACKS.filter((track) =>
    `${track.title} ${track.artist} ${track.album}`.toLowerCase().includes(needle),
  );
  return settle(matches.slice(0, 20), signal);
}
