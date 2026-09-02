import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  MAX_LOOPS_PER_TRACK,
  MAX_TRACKS,
  addSavedLoop,
  findSavedLoop,
  normaliseName,
  normaliseSavedLoops,
  type SavedLoop,
} from '../savedLoops';
import { OTHER_TEST_TRACK, TEST_TRACK } from './fixtures';
import { usePlayerStore } from '@/stores/player';

vi.mock('../spotifyPlaybackSource', async () => {
  const fake = await import('./fakePlaybackSource');
  return { createSpotifyPlaybackSource: fake.createFakePlaybackSource };
});

function loop(overrides: Partial<SavedLoop> = {}): SavedLoop {
  return { id: 'p1', name: null, a: 30, b: 60, savedAt: 1_700_000_000_000, ...overrides };
}

describe('normaliseSavedLoops', () => {
  it('keeps well-formed entries', () => {
    const stored = { [TEST_TRACK.id]: [loop()] };
    expect(normaliseSavedLoops(stored)).toEqual(stored);
  });

  it('answers anything that is not a store with an empty one', () => {
    expect(normaliseSavedLoops(null)).toEqual({});
    expect(normaliseSavedLoops('nonsense')).toEqual({});
    expect(normaliseSavedLoops([loop()])).toEqual({});
  });

  it('drops malformed entries and keeps their neighbours', () => {
    const good = loop({ id: 'good' });
    const raw = {
      [TEST_TRACK.id]: [
        good,
        { id: '', name: null, a: 1, b: 2, savedAt: 1 },
        { id: 'no-bounds', name: null, savedAt: 1 },
        { id: 'inverted', name: null, a: 60, b: 30, savedAt: 1 },
        { id: 'not-finite', name: null, a: 0, b: Number.NaN, savedAt: 1 },
        { id: 'bad-name', name: 7, a: 1, b: 2, savedAt: 1 },
        'not an object',
        null,
      ],
    };
    expect(normaliseSavedLoops(raw)).toEqual({ [TEST_TRACK.id]: [good] });
  });

  it('drops tracks whose every entry was malformed', () => {
    expect(normaliseSavedLoops({ [TEST_TRACK.id]: [{ id: 'x' }], '': [loop()] })).toEqual({});
  });

  it('sorts newest first and caps a track', () => {
    const many = Array.from({ length: MAX_LOOPS_PER_TRACK + 4 }, (_, index) =>
      loop({ id: `p${index}`, savedAt: 1_000 + index }),
    );
    const normalised = normaliseSavedLoops({ [TEST_TRACK.id]: many })[TEST_TRACK.id] ?? [];
    expect(normalised).toHaveLength(MAX_LOOPS_PER_TRACK);
    expect(normalised[0]?.id).toBe(`p${many.length - 1}`);
  });

  it('keeps the tracks worked most recently when over the ceiling', () => {
    const raw: Record<string, SavedLoop[]> = {};
    for (let index = 0; index < MAX_TRACKS + 5; index++) {
      raw[`track-${index}`] = [loop({ id: `p${index}`, savedAt: 1_000 + index })];
    }
    const normalised = normaliseSavedLoops(raw);
    expect(Object.keys(normalised)).toHaveLength(MAX_TRACKS);
    expect(normalised['track-0']).toBeUndefined();
    expect(normalised[`track-${MAX_TRACKS + 4}`]).toBeDefined();
  });

  it('trims and caps a name, and reads an empty one as none', () => {
    expect(normaliseName('  Chorus lift  ')).toBe('Chorus lift');
    expect(normaliseName('   ')).toBeNull();
    expect(normaliseName(null)).toBeNull();
    expect(normaliseName('x'.repeat(80))).toHaveLength(40);
  });
});

describe('findSavedLoop', () => {
  const loops = [loop({ id: 'a', a: 30, b: 60 }), loop({ id: 'b', a: 72.4, b: 80 })];

  it('matches exact bounds', () => {
    expect(findSavedLoop(loops, 30, 60)?.id).toBe('a');
  });

  /*
   * `useLoopUrlSync` rounds to a tenth on the way into the URL, so a shared
   * loop comes back up to 0.05s off what was stored. Comparing at the URL's
   * own precision is what lets a reopened link still light its row.
   */
  it('matches a value that has been through the URL', () => {
    expect(findSavedLoop(loops, 72.44, 80.01)?.id).toBe('b');
    expect(findSavedLoop(loops, 72.35, 80)?.id).toBe('b');
  });

  it('does not match a nudge away', () => {
    expect(findSavedLoop(loops, 31, 60)).toBeUndefined();
    expect(findSavedLoop(loops, 30, 60.2)).toBeUndefined();
  });
});

describe('addSavedLoop', () => {
  it('puts the new entry first and holds the cap', () => {
    const existing = Array.from({ length: MAX_LOOPS_PER_TRACK }, (_, index) =>
      loop({ id: `p${index}` }),
    );
    const next = addSavedLoop(existing, loop({ id: 'newest' }));
    expect(next).toHaveLength(MAX_LOOPS_PER_TRACK);
    expect(next[0]?.id).toBe('newest');
    expect(next[next.length - 1]?.id).toBe(`p${MAX_LOOPS_PER_TRACK - 2}`);
  });
});

describe('player store loops', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });
  afterEach(() => localStorage.clear());

  it('saves the armed bounds against the loaded track', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop('Chorus lift');

    expect(player.trackSavedLoops).toHaveLength(1);
    expect(player.trackSavedLoops[0]).toMatchObject({ name: 'Chorus lift', a: 30, b: 60 });
    expect(player.armedSavedLoopId).toBe(player.trackSavedLoops[0]?.id);
  });

  it('refuses to save with the loop off, and says why', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: false });

    expect(player.saveLoopBlocked).toBe('Turn the loop on to save it');
    player.saveLoop(null);
    expect(player.trackSavedLoops).toHaveLength(0);
  });

  it('refuses a duplicate of what is already stored', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop(null);

    expect(player.saveLoopBlocked).toBe('This loop is already saved');
    player.saveLoop('again');
    expect(player.trackSavedLoops).toHaveLength(1);
  });

  it('refuses once a track is full', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 0, b: 10, on: true });
    for (let index = 0; index < MAX_LOOPS_PER_TRACK; index++) {
      player.nudge('b', 1);
      player.saveLoop(null);
    }

    expect(player.trackSavedLoops).toHaveLength(MAX_LOOPS_PER_TRACK);
    player.nudge('b', 1);
    expect(player.saveLoopBlocked).toBe(
      `This track already holds ${MAX_LOOPS_PER_TRACK} saved loops`,
    );
  });

  it('never shows one track its neighbour’s loops', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop('on the first track');

    await player.loadTrack(OTHER_TEST_TRACK, { a: 30, b: 60, on: true });
    expect(player.trackSavedLoops).toHaveLength(0);

    await player.loadTrack(TEST_TRACK, { a: 0, b: 5, on: true });
    expect(player.trackSavedLoops).toHaveLength(1);
  });

  it('applies a loop: both ends, the loop armed, and the head at A', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop(null);
    const saved = player.trackSavedLoops[0]?.id ?? '';

    player.nudge('a', 5);
    player.toggleLoop();
    expect(player.armedSavedLoopId).toBeNull();

    await player.applySavedLoop(saved);
    expect(player.loopA).toBe(30);
    expect(player.loopB).toBe(60);
    expect(player.loopOn).toBe(true);
    expect(player.position).toBe(30);
    expect(player.armedSavedLoopId).toBe(saved);
  });

  it('clamps an applied loop to the track it lands on', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop(null);
    const saved = player.trackSavedLoops[0]?.id ?? '';

    // A shorter recording under the same id: the stored end no longer exists.
    await player.loadTrack({ ...TEST_TRACK, duration: 45 }, { a: 0, b: 5, on: true });
    await player.applySavedLoop(saved);

    expect(player.loopB).toBeLessThanOrEqual(45);
    expect(player.loopA).toBeLessThan(player.loopB);
  });

  it('un-arms the row when the loop goes off, without forgetting it', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop(null);

    player.toggleLoop();
    expect(player.armedSavedLoopId).toBeNull();
    expect(player.trackSavedLoops).toHaveLength(1);

    player.toggleLoop();
    expect(player.armedSavedLoopId).toBe(player.trackSavedLoops[0]?.id);
  });

  it('deletes a loop and leaves no empty track behind', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    player.saveLoop(null);
    player.deleteSavedLoop(player.trackSavedLoops[0]?.id ?? '');

    expect(player.trackSavedLoops).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('rewindify:saved-loops') ?? '{}')).toEqual({});
  });

  it('survives a corrupt stored blob', async () => {
    localStorage.setItem('rewindify:saved-loops', '{"' + TEST_TRACK.id + '":[{"id":"broken"}]}');
    setActivePinia(createPinia());

    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    expect(player.trackSavedLoops).toEqual([]);
    expect(player.saveLoopBlocked).toBeNull();
  });

  it('opens the band on a save request, with the loop off as well', async () => {
    const player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: false });

    expect(player.savedLoopsOpen).toBe(false);
    player.requestLoopSave();
    expect(player.savedLoopsOpen).toBe(true);
    expect(player.loopSaveRequest).toBe(1);

    player.closeSavedLoops();
    expect(player.savedLoopsOpen).toBe(false);
  });
});
