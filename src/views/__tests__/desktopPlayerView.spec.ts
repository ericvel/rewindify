import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/** Presses a key with something on the page focused, the way a real one arrives. */
function pressFrom(el: HTMLElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function mountEl<K extends keyof HTMLElementTagNameMap>(tag: K, type?: string) {
  const el = document.createElement(tag);
  if (type && el instanceof HTMLInputElement) el.type = type;
  document.body.append(el);
  return el;
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

  it('seeks once when a held arrow is released, not once per repeat', async () => {
    const start = player.position;
    press('ArrowRight');
    press('ArrowRight');
    press('ArrowRight');
    // The playhead has moved on screen, but nothing has been committed yet.
    expect(player.isScrubbing).toBe(true);
    expect(player.position).toBe(start + 3 * player.skipSeconds);
    release('ArrowRight');
    await Promise.resolve();
    expect(player.isScrubbing).toBe(false);
    expect(player.position).toBeGreaterThanOrEqual(start + 3 * player.skipSeconds);
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

describe('shortcuts and whatever holds focus', () => {
  let player: ReturnType<typeof usePlayerStore>;

  beforeEach(async () => {
    setActivePinia(createPinia());
    player = usePlayerStore();
    await player.loadTrack(TEST_TRACK, { a: 30, b: 60, on: true });
    mount(DesktopPlayerView, { props: { track: TEST_TRACK }, shallow: true });
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  // Clicking a transport control leaves it focused, so this is the state the
  // keyboard is usually in — not an edge case.
  it('still toggles play from a focused button', async () => {
    pressFrom(mountEl('button'), ' ');
    await Promise.resolve();
    expect(player.isPlaying).toBe(true);
  });

  it('still steps from a focused link', () => {
    const start = player.position;
    pressFrom(mountEl('a'), 'ArrowRight');
    expect(player.position).toBe(start + player.skipSeconds);
  });

  it('still nudges from a focused checkbox', () => {
    pressFrom(mountEl('input', 'checkbox'), 'a');
    press('ArrowRight');
    expect(player.loopA).toBe(31);
  });

  it('leaves a text field alone', async () => {
    const input = mountEl('input', 'text');
    pressFrom(input, ' ');
    pressFrom(input, 'l');
    await Promise.resolve();
    expect(player.isPlaying).toBe(false);
    expect(player.loopOn).toBe(true);
  });

  it('leaves a contenteditable alone', async () => {
    const div = mountEl('div');
    // jsdom never computes `isContentEditable`, so set what a browser would.
    Object.defineProperty(div, 'isContentEditable', { value: true });
    pressFrom(div, ' ');
    await Promise.resolve();
    expect(player.isPlaying).toBe(false);
  });

  /*
   * The two exceptions the choosers earned. A button is normally the player's,
   * which is what keeps the space bar working after a click on the transport —
   * but space on a control that opens a list is that control's key, and the
   * saved-loops window lost it to playback for a round.
   */
  it('leaves a control that advertises a popup alone', async () => {
    const trigger = mountEl('button');
    trigger.setAttribute('aria-expanded', 'false');
    pressFrom(trigger, ' ');
    await Promise.resolve();
    expect(player.isPlaying).toBe(false);
  });

  it('leaves everything inside an open popover alone', async () => {
    const popover = mountEl('div');
    popover.setAttribute('popover', 'auto');
    const row = document.createElement('button');
    popover.append(row);
    // jsdom has no popover, so answer the one selector the layer asks for.
    row.matches = ((selector: string) =>
      selector === ':popover-open') as unknown as typeof row.matches;
    Object.defineProperty(row, 'closest', { value: () => popover });
    popover.matches = ((selector: string) =>
      selector === ':popover-open') as unknown as typeof popover.matches;

    pressFrom(row, ' ');
    await Promise.resolve();
    expect(player.isPlaying).toBe(false);
  });
});
