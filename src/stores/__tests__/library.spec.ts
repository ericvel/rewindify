import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useLibraryStore } from '../library';
import { fetchRecentlyPlayed, fetchTrack, searchTracks } from '@/spotify/api';
import { OTHER_TEST_TRACK, TEST_TRACK } from '@/playback/__tests__/fixtures';
import type { Track } from '@/playback/types';

vi.mock('@/spotify/api', () => ({
  fetchRecentlyPlayed: vi.fn<typeof fetchRecentlyPlayed>(),
  fetchTrack: vi.fn<typeof fetchTrack>(),
  searchTracks: vi.fn<typeof searchTracks>(),
}));

const history = vi.mocked(fetchRecentlyPlayed);
const track = vi.mocked(fetchTrack);
const search = vi.mocked(searchTracks);

const NOW = 1_700_000_000_000;

function historyOf(entries: [Track, number][]) {
  return {
    entries: entries.map(([item, playedAt]) => ({ trackId: item.id, playedAt })),
    tracks: entries.map(([item]) => item),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  setActivePinia(createPinia());
  history.mockResolvedValue({ entries: [], tracks: [] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('recently played', () => {
  it('comes from Spotify, newest first', async () => {
    history.mockResolvedValue(
      historyOf([
        [TEST_TRACK, NOW - 60_000],
        [OTHER_TEST_TRACK, NOW - 3_600_000],
      ]),
    );

    const library = useLibraryStore();
    await library.loadHistory();

    expect(library.recentTracks.map((entry) => entry.track.id)).toEqual([
      TEST_TRACK.id,
      OTHER_TEST_TRACK.id,
    ]);
    expect(library.mostRecentTrack).toEqual(TEST_TRACK);
  });

  it('is fetched once per session', async () => {
    const library = useLibraryStore();
    await library.loadHistory();
    await library.loadHistory();
    expect(history).toHaveBeenCalledTimes(1);
  });

  /**
   * Spotify records a play only after about thirty seconds and lags behind by up
   * to a minute, so a track just opened here has to be shown regardless.
   */
  it('shows a track opened in this app before Spotify knows about it', async () => {
    history.mockResolvedValue(historyOf([[OTHER_TEST_TRACK, NOW - 60_000]]));

    const library = useLibraryStore();
    await library.loadHistory();
    library.markPlayed(TEST_TRACK);

    expect(library.recentTracks.map((entry) => entry.track.id)).toEqual([
      TEST_TRACK.id,
      OTHER_TEST_TRACK.id,
    ]);
  });

  it('lists a track once when both sources know about it', async () => {
    history.mockResolvedValue(historyOf([[TEST_TRACK, NOW - 3_600_000]]));

    const library = useLibraryStore();
    await library.loadHistory();
    library.markPlayed(TEST_TRACK);

    expect(library.recentTracks).toHaveLength(1);
    expect(library.recentTracks[0]?.playedAt).toBe(NOW);
  });

  it('has nothing to offer an account with no history', async () => {
    const library = useLibraryStore();
    await library.loadHistory();
    expect(library.mostRecentTrack).toBeNull();
  });

  /** The router awaits this, so a failure has to resolve rather than throw. */
  it('records a failure instead of throwing, and will try again', async () => {
    history.mockRejectedValueOnce(new Error('Spotify could not be reached.'));

    const library = useLibraryStore();
    await library.loadHistory();
    expect(library.error).toBe('Spotify could not be reached.');

    history.mockResolvedValue(historyOf([[TEST_TRACK, NOW]]));
    await library.loadHistory();
    expect(library.mostRecentTrack).toEqual(TEST_TRACK);
  });
});

describe('ensureTrack', () => {
  it('fetches a track the app has not seen', async () => {
    track.mockResolvedValue(TEST_TRACK);
    const library = useLibraryStore();

    await expect(library.ensureTrack(TEST_TRACK.id)).resolves.toEqual(TEST_TRACK);
    expect(track).toHaveBeenCalledWith(TEST_TRACK.id);
  });

  it('answers from cache the second time, so a route change is free', async () => {
    track.mockResolvedValue(TEST_TRACK);
    const library = useLibraryStore();

    await library.ensureTrack(TEST_TRACK.id);
    await library.ensureTrack(TEST_TRACK.id);

    expect(track).toHaveBeenCalledTimes(1);
  });

  it('reuses what the history already loaded', async () => {
    history.mockResolvedValue(historyOf([[TEST_TRACK, NOW]]));
    const library = useLibraryStore();
    await library.loadHistory();

    await expect(library.ensureTrack(TEST_TRACK.id)).resolves.toEqual(TEST_TRACK);
    expect(track).not.toHaveBeenCalled();
  });

  it('answers null for an id Spotify does not know', async () => {
    track.mockResolvedValue(null);
    await expect(useLibraryStore().ensureTrack('not-a-track')).resolves.toBeNull();
  });
});

describe('search', () => {
  it('waits for a pause in typing, then asks once', async () => {
    search.mockResolvedValue([TEST_TRACK]);
    const library = useLibraryStore();

    library.search('bri');
    library.search('brigh');
    library.search('brightside');
    expect(library.isSearching).toBe(true);
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);

    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0]?.[0]).toBe('brightside');
    expect(library.searchResults).toEqual([TEST_TRACK]);
    expect(library.isSearching).toBe(false);
  });

  it('clears an emptied query without asking Spotify anything', async () => {
    search.mockResolvedValue([TEST_TRACK]);
    const library = useLibraryStore();

    library.search('brightside');
    await vi.advanceTimersByTimeAsync(250);
    expect(library.searchResults).toHaveLength(1);

    library.search('   ');
    expect(library.searchResults).toEqual([]);
    expect(library.isSearching).toBe(false);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('reports a failed search and shows no stale rows', async () => {
    search.mockRejectedValue(new Error('Spotify could not be reached.'));
    const library = useLibraryStore();

    library.search('brightside');
    await vi.advanceTimersByTimeAsync(250);

    expect(library.searchResults).toEqual([]);
    expect(library.error).toBe('Spotify could not be reached.');
    expect(library.isSearching).toBe(false);
  });

  it('caches results, so picking one needs no second request', async () => {
    search.mockResolvedValue([TEST_TRACK]);
    const library = useLibraryStore();

    library.search('brightside');
    await vi.advanceTimersByTimeAsync(250);

    expect(library.cached(TEST_TRACK.id)).toEqual(TEST_TRACK);
  });
});
