import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TEST_TRACK } from '@/playback/__tests__/fixtures';

const isConnected = vi.hoisted(() => ({ value: false }));
const mostRecentTrack = vi.hoisted(() => ({ value: null as typeof TEST_TRACK | null }));
const loadHistory = vi.hoisted(() => vi.fn<() => void>(async () => {}));
const ensureTrack = vi.hoisted(() => vi.fn<() => void>(async () => TEST_TRACK));

vi.mock('@/stores/session', () => ({
  useSessionStore: () => ({
    get isConnected() {
      return isConnected.value;
    },
  }),
}));

vi.mock('@/stores/library', () => ({
  useLibraryStore: () => ({
    loadHistory,
    ensureTrack,
    get mostRecentTrack() {
      return mostRecentTrack.value;
    },
  }),
}));

const { default: router } = await import('../index');

/** Parks the router on the gate, so each test navigates from the same place. */
beforeEach(async () => {
  isConnected.value = false;
  mostRecentTrack.value = null;
  await router.replace('/connect');
  vi.clearAllMocks();
  isConnected.value = true;
});

describe('the play log', () => {
  /**
   * The regression: only `/` asked for it, so a track link opened cold — or a
   * refresh on one — left the recently played list holding nothing but the
   * track already open.
   */
  it('is loaded for a track route opened cold', async () => {
    await router.push(`/track/${TEST_TRACK.id}`);
    expect(loadHistory).toHaveBeenCalled();
  });

  /** Still awaited where the destination depends on it. */
  it('decides where `/` lands', async () => {
    mostRecentTrack.value = TEST_TRACK;
    await router.push('/');
    expect(loadHistory).toHaveBeenCalled();
    expect(router.currentRoute.value.name).toBe('track');
    expect(router.currentRoute.value.params.trackId).toBe(TEST_TRACK.id);
  });

  it('is left alone for a visitor without a session', async () => {
    isConnected.value = false;
    await router.push(`/track/${TEST_TRACK.id}`);
    expect(loadHistory).not.toHaveBeenCalled();
  });
});
