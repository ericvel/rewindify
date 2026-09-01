import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import DesktopPlayerView from '../DesktopPlayerView.vue';
import { TEST_TRACK } from '@/playback/__tests__/fixtures';
import { usePlayerStore } from '@/stores/player';

// The keyboard rules are the subject here, not Spotify's SDK.
vi.mock('@/playback/spotifyPlaybackSource', async () => {
  const fake = await import('@/playback/__tests__/fakePlaybackSource');
  return { createSpotifyPlaybackSource: fake.createFakePlaybackSource };
});

function press(key: string) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function release(key: string) {
  window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
}

describe('DesktopPlayerView loop shortcuts', () => {
  let player: ReturnType<typeof usePlayerStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    mount(DesktopPlayerView, { props: { track: TEST_TRACK }, shallow: true });
  });

  it('moves A by a second while A is held', () => {
    press('a');
    press('ArrowRight');
    expect(player.loopA).toBe(31);
    press('ArrowLeft');
    press('ArrowLeft');
    expect(player.loopA).toBe(29);
    expect(player.loopB).toBe(60);
  });

  it('moves B by a second while B is held', () => {
    press('b');
    press('ArrowLeft');
    expect(player.loopB).toBe(59);
    press('ArrowRight');
    expect(player.loopB).toBe(60);
    expect(player.loopA).toBe(30);
  });

  it('skips again once the loop key is released', async () => {
    await player.togglePlay();
    press('a');
    release('a');
    press('ArrowRight');
    expect(player.loopA).toBe(30);
    expect(player.position).toBeGreaterThan(30);
  });

  it('drops the hold when the window loses focus', () => {
    press('a');
    window.dispatchEvent(new Event('blur'));
    press('ArrowRight');
    expect(player.loopA).toBe(30);
  });

  it('keeps the ends at least the minimum loop apart', () => {
    press('b');
    for (let i = 0; i < 40; i += 1) press('ArrowLeft');
    expect(player.loopB).toBe(32);
    expect(player.loopA).toBe(30);
  });
});
