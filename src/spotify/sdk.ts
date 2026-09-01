import { PLAYER_SDK_URL } from './config';

/**
 * The slice of the Web Playback SDK this app touches, typed by hand.
 *
 * The published types describe the whole surface — volume, previous/next,
 * contexts, playlists — none of which a single-track looper uses. Six methods
 * and six events are cheaper to read here than a dependency is to carry.
 */

export interface SpotifyPlaybackTrack {
  uri: string;
  id: string | null;
  duration_ms: number;
}

export interface SpotifyPlaybackState {
  paused: boolean;
  /** Milliseconds, as of when the event was emitted. */
  position: number;
  duration: number;
  track_window: { current_track: SpotifyPlaybackTrack | null };
}

export interface SpotifyPlayerError {
  message: string;
}

export interface SpotifyPlayerEvents {
  ready: { device_id: string };
  not_ready: { device_id: string };
  /** Null when this device stops being the one playing. */
  player_state_changed: SpotifyPlaybackState | null;
  initialization_error: SpotifyPlayerError;
  authentication_error: SpotifyPlayerError;
  account_error: SpotifyPlayerError;
  playback_error: SpotifyPlayerError;
}

export interface SpotifyPlayer {
  connect(): Promise<boolean>;
  disconnect(): void;
  addListener<Event extends keyof SpotifyPlayerEvents>(
    event: Event,
    listener: (payload: SpotifyPlayerEvents[Event]) => void,
  ): boolean;
  removeListener<Event extends keyof SpotifyPlayerEvents>(event: Event): boolean;
  getCurrentState(): Promise<SpotifyPlaybackState | null>;
  resume(): Promise<void>;
  pause(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  /**
   * Marks the SDK's hidden audio element as user-activated. Browsers refuse to
   * start audio outside a gesture, so this has to be called from inside one.
   */
  activateElement(): Promise<void>;
}

export interface SpotifyPlayerOptions {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume?: number;
}

export interface SpotifyPlayerConstructor {
  new (options: SpotifyPlayerOptions): SpotifyPlayer;
}

declare global {
  interface Window {
    Spotify?: { Player: SpotifyPlayerConstructor };
    /** The SDK calls this once its script has finished evaluating. */
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let loading: Promise<SpotifyPlayerConstructor> | null = null;

/**
 * Loads the SDK script on demand and resolves its `Player` constructor.
 *
 * The script is fetched the first time a track is actually played rather than at
 * boot: it is Spotify's code on Spotify's terms, and a visitor who never presses
 * play never needs it. Memoised, because the SDK announces itself through a
 * single global callback and a second script tag would have nothing to call.
 */
export function loadSpotifyPlayer(): Promise<SpotifyPlayerConstructor> {
  if (window.Spotify) return Promise.resolve(window.Spotify.Player);

  loading ??= new Promise<SpotifyPlayerConstructor>((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      const namespace = window.Spotify;
      if (namespace) resolve(namespace.Player);
      else reject(new Error('The Spotify player SDK loaded without exposing a player.'));
    };

    const script = document.createElement('script');
    script.src = PLAYER_SDK_URL;
    script.async = true;
    script.addEventListener('error', () => {
      loading = null;
      reject(new Error('The Spotify player SDK could not be loaded.'));
    });
    document.head.append(script);
  });

  return loading;
}
