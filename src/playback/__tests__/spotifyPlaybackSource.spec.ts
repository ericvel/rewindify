import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpotifyPlaybackSource } from '../spotifyPlaybackSource';
import { TEST_TRACK, OTHER_TEST_TRACK } from './fixtures';
import {
  FakePlayer,
  configureFakePlayer,
  lastFakePlayer,
  playbackState,
  resetFakePlayer,
} from './fakeSpotifyPlayer';
import { startPlayback } from '@/spotify/api';
import { loadSpotifyPlayer } from '@/spotify/sdk';
import { getAccessToken } from '@/spotify/tokens';

vi.mock('@/spotify/sdk', () => ({ loadSpotifyPlayer: vi.fn<typeof loadSpotifyPlayer>() }));
vi.mock('@/spotify/api', () => ({ startPlayback: vi.fn<typeof startPlayback>() }));
vi.mock('@/spotify/tokens', () => ({ getAccessToken: vi.fn<typeof getAccessToken>() }));

const cue = vi.mocked(startPlayback);
const sdk = vi.mocked(loadSpotifyPlayer);
const tokenFor = vi.mocked(getAccessToken);

beforeEach(() => {
  // Reset rather than clear: a rejection set up by one test must not survive
  // into the next, where it would quietly leave nothing cued.
  vi.resetAllMocks();
  resetFakePlayer();
  sdk.mockResolvedValue(FakePlayer);
  tokenFor.mockResolvedValue('access-1');

  // Position is interpolated from a wall clock between the SDK's state events.
  // Freezing both keeps the playhead moving only where a test moves it.
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loading a track', () => {
  /**
   * The SDK cannot cue audio without starting it, and browsers will not start
   * audio away from a gesture — so a loaded track is described from its own
   * metadata and nothing is asked of Spotify until play is pressed.
   */
  it('describes the track without touching Spotify', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);

    expect(source.duration.value).toBe(TEST_TRACK.duration);
    expect(source.position.value).toBe(0);
    expect(source.isPlaying.value).toBe(false);
    expect(cue).not.toHaveBeenCalled();
  });

  it('keeps a seek local until there is something cued to seek', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.seek(45);

    expect(source.position.value).toBe(45);
    expect(lastFakePlayer().seekedTo).toEqual([]);
  });

  it('registers the device ahead of the first press', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    // The attach is deliberately not awaited by `load`, so let it settle.
    await vi.waitFor(() => expect(source.isReady.value).toBe(true));
    expect(lastFakePlayer().calls).toContain('connect');
  });

  it('keeps the playhead at zero when the previous track reports late', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();
    const player = lastFakePlayer();
    player.emit('player_state_changed', playbackState({ position: 45_000 }));

    await source.load(OTHER_TEST_TRACK);
    player.emit('player_state_changed', playbackState({ paused: true, position: 45_000 }));

    expect(source.position.value).toBe(0);
    expect(source.duration.value).toBe(OTHER_TEST_TRACK.duration);
  });
});

describe('playing', () => {
  it('cues the track on our own device, from wherever the playhead was left', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.seek(45);
    await source.play();

    expect(cue).toHaveBeenCalledWith('device-1', TEST_TRACK.uri, 45_000);
    expect(source.isPlaying.value).toBe(true);
    // Audio has to be unlocked from inside the gesture that led here.
    expect(lastFakePlayer().calls).toContain('activateElement');
  });

  it('resumes rather than cueing again for a track Spotify already holds', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();
    await source.pause();
    await source.play();

    expect(cue).toHaveBeenCalledTimes(1);
    expect(lastFakePlayer().calls.filter((call) => call === 'resume')).toHaveLength(1);
  });

  it('stops the track being left and cues the next one afresh', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();

    await source.load(OTHER_TEST_TRACK);
    expect(lastFakePlayer().calls).toContain('pause');
    expect(source.isPlaying.value).toBe(false);

    await source.play();
    expect(cue).toHaveBeenLastCalledWith('device-1', OTHER_TEST_TRACK.uri, 0);
  });

  it('reports a device that will not connect instead of failing silently', async () => {
    configureFakePlayer({ connects: false });
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();

    expect(source.isPlaying.value).toBe(false);
    expect(source.error.value).toContain('refused');
  });

  it('reports a refusal from Spotify rather than pretending to play', async () => {
    cue.mockRejectedValue(new Error('Player command failed: Premium required'));
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();

    expect(source.isPlaying.value).toBe(false);
    expect(source.error.value).toBe('Player command failed: Premium required');
  });

  it('lets the SDK ask the token store for a token', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();

    const handed: string[] = [];
    lastFakePlayer().options.getOAuthToken((token) => handed.push(token));
    await vi.waitFor(() => expect(handed).toEqual(['access-1']));
  });
});

describe('states reported by the SDK', () => {
  async function playing() {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();
    return { source, player: lastFakePlayer() };
  }

  it('follows the position Spotify reports', async () => {
    const { source, player } = await playing();
    player.emit('player_state_changed', playbackState({ position: 40_000 }));
    expect(source.position.value).toBeCloseTo(40, 5);
  });

  /**
   * A seek is a round trip, so the SDK keeps reporting the old position for a
   * moment. Believing it would send the playhead back past B and ask the loop to
   * wrap all over again.
   */
  it('ignores a stale position until the seek it asked for lands', async () => {
    const { source, player } = await playing();
    player.emit('player_state_changed', playbackState({ position: 40_000 }));

    await source.seek(30);
    expect(source.position.value).toBe(30);

    player.emit('player_state_changed', playbackState({ position: 41_000 }));
    expect(source.position.value).toBe(30);

    player.emit('player_state_changed', playbackState({ position: 30_100 }));
    expect(source.position.value).toBeCloseTo(30.1, 5);
    expect(player.seekedTo).toEqual([30_000]);
  });

  it('ignores a state about some other track', async () => {
    const { source, player } = await playing();
    player.emit('player_state_changed', playbackState({ position: 40_000 }));

    player.emit(
      'player_state_changed',
      playbackState({ position: 5_000, uri: OTHER_TEST_TRACK.uri }),
    );

    expect(source.position.value).toBeCloseTo(40, 5);
  });

  it('stops when another Spotify client takes the playback over', async () => {
    const { source, player } = await playing();
    player.emit('player_state_changed', null);

    expect(source.isPlaying.value).toBe(false);
    expect(source.isReady.value).toBe(false);
  });

  /** Spotify reports a paused player at zero when a single-track context ends. */
  it('holds the end of a finished track instead of snapping back to the start', async () => {
    const { source, player } = await playing();
    await source.seek(TEST_TRACK.duration);
    player.emit('player_state_changed', playbackState({ position: TEST_TRACK.duration * 1000 }));

    player.emit('player_state_changed', playbackState({ paused: true, position: 0 }));

    expect(source.position.value).toBeCloseTo(TEST_TRACK.duration, 1);
    expect(source.isPlaying.value).toBe(false);
  });

  it('follows a pause made from another Spotify client', async () => {
    const { source, player } = await playing();
    player.emit('player_state_changed', playbackState({ paused: true, position: 12_000 }));

    expect(source.isPlaying.value).toBe(false);
    expect(source.position.value).toBeCloseTo(12, 5);
  });
});

describe('dispose', () => {
  it('lets go of the device', async () => {
    const source = createSpotifyPlaybackSource();
    await source.load(TEST_TRACK);
    await source.play();

    source.dispose();

    expect(lastFakePlayer().calls).toContain('disconnect');
    expect(source.isPlaying.value).toBe(false);
    expect(source.isReady.value).toBe(false);
  });
});
