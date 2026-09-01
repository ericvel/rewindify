import { spotifyRequest, SpotifyApiError } from './client';
import { toTrack, toTracks, type SpotifyTrackObject } from './track';
import type { Session } from '@/auth/types';
import type { RecentEntry, Track } from '@/playback/types';

/**
 * `from_token` resolves the market from the access token, which is what makes
 * `is_playable` meaningful: without a market Spotify returns catalogue entries
 * this account cannot stream, and picking one would fail at the player.
 */
const MARKET = 'from_token';

interface ProfileResponse {
  display_name: string | null;
  product: string;
}

export async function fetchProfile(): Promise<Session> {
  const profile = await spotifyRequest<ProfileResponse>('/me');
  return {
    displayName: profile.display_name?.trim() || 'Spotify user',
    // `free` and `open` both mean the same thing here: no Web Playback SDK.
    product: profile.product === 'premium' ? 'premium' : 'free',
  };
}

/** Enough results to fill the popover twice over; more is scroll nobody reads. */
const SEARCH_LIMIT = 20;

export async function searchTracks(query: string, signal?: AbortSignal): Promise<Track[]> {
  const body = await spotifyRequest<{ tracks?: { items?: SpotifyTrackObject[] } }>('/search', {
    query: { q: query, type: 'track', limit: SEARCH_LIMIT, market: MARKET },
    signal,
  });
  return toTracks(body.tracks?.items ?? []);
}

/**
 * One track by id, for a link opened cold. A 404 or an id this market cannot
 * play resolves to null so the router can fall back rather than throw.
 */
export async function fetchTrack(id: string): Promise<Track | null> {
  try {
    const body = await spotifyRequest<SpotifyTrackObject>(`/tracks/${encodeURIComponent(id)}`, {
      query: { market: MARKET },
    });
    return body.is_playable === false ? null : toTrack(body);
  } catch (error) {
    if (error instanceof SpotifyApiError && (error.status === 404 || error.status === 400)) {
      return null;
    }
    throw error;
  }
}

interface RecentlyPlayedResponse {
  items?: { track: SpotifyTrackObject; played_at: string }[];
}

export interface RecentlyPlayed {
  /** Newest first, one entry per track. */
  entries: RecentEntry[];
  /** The tracks those entries refer to, for the caller to cache. */
  tracks: Track[];
}

/**
 * Recently played, collapsed to one entry per track.
 *
 * Spotify's history is a play log, so an hour of practice on one passage comes
 * back as the same track fifty times. The app's list is a list of tracks, so
 * only the newest play of each survives.
 */
export async function fetchRecentlyPlayed(limit = 50): Promise<RecentlyPlayed> {
  const body = await spotifyRequest<RecentlyPlayedResponse>('/me/player/recently-played', {
    query: { limit },
  });

  const entries: RecentEntry[] = [];
  const tracks: Track[] = [];
  const seen = new Set<string>();

  for (const item of body.items ?? []) {
    const track = toTrack(item.track);
    if (!track || seen.has(track.id)) continue;
    const playedAt = Date.parse(item.played_at);
    seen.add(track.id);
    tracks.push(track);
    entries.push({ trackId: track.id, playedAt: Number.isNaN(playedAt) ? Date.now() : playedAt });
  }

  return { entries, tracks };
}

/** A device that has only just announced itself is not always routable yet. */
const DEVICE_RETRIES = 3;
const DEVICE_RETRY_MS = 400;

/**
 * Starts a single track on our own SDK device, which also makes it the active
 * one. The SDK has no way to cue audio without starting it, so this is how a
 * track gets loaded at all — see `spotifyPlaybackSource`.
 *
 * A 404 right after the device appears means Spotify has not propagated it yet,
 * which a short retry clears; every other status is a real failure.
 */
export async function startPlayback(deviceId: string, uri: string, positionMs = 0): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await spotifyRequest<void>('/me/player/play', {
        method: 'PUT',
        query: { device_id: deviceId },
        body: { uris: [uri], position_ms: Math.max(0, Math.round(positionMs)) },
      });
      return;
    } catch (error) {
      const isMissingDevice = error instanceof SpotifyApiError && error.status === 404;
      if (!isMissingDevice || attempt >= DEVICE_RETRIES - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, DEVICE_RETRY_MS));
    }
  }
}
