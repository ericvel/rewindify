/**
 * Saved loops: the loop, made persistent.
 *
 * The feature shipped as *passages* first, borrowing the word PRODUCT.md uses
 * for the span between A and B. That word was doing two jobs at once. Nothing
 * else on the plate printed it — the switch beside the handle says LOOP, the
 * status bar says LOOP and MOVE LOOP — so the handle named a category with no
 * stated relation to the control it belongs to, while the drawer underneath
 * called the same rows "saved". The music is still a passage; what this module
 * stores is a *loop*, in the switch's own vocabulary, and every place the
 * interface prints the word now says that.
 *
 * A saved loop belongs to the track it was taken from and to nothing else:
 * 0:30–1:00 is meaningless on a different recording, so the store is keyed by
 * track id and no row can ever cross tracks.
 *
 * Kept pure, the way `loop.ts` is, so the rules are testable without a clock,
 * a store or a browser. Everything stateful lives in `stores/player.ts`.
 */

export interface SavedLoop {
  id: string;
  /** Null when the user saved without typing one; the row then prints its times. */
  name: string | null;
  a: number;
  b: number;
  savedAt: number;
}

/** Saved loops by track id. The shape written to `rewindify:saved-loops`. */
export type SavedLoopStore = Record<string, SavedLoop[]>;

/**
 * Twelve is the point at which a printed index stops being scannable, and the
 * band is capped to a few visible rows anyway. Reaching it disables saving
 * rather than silently discarding the oldest: a loop the user pinned by ear
 * is not ours to throw away.
 */
export const MAX_LOOPS_PER_TRACK = 12;

/**
 * A ceiling on the whole blob, so a year of practice cannot grow unbounded in
 * a quota shared with `rewindify:skipSeconds`. Tracks fall off by their newest
 * save, oldest first.
 */
export const MAX_TRACKS = 50;

/** Longer than this stops fitting a row before the ellipsis earns its keep. */
export const LOOP_NAME_MAX = 40;

/**
 * Match precision, in tenths of a second.
 *
 * `useLoopUrlSync` rounds A and B to a tenth on the way into the URL, so a
 * loop that is applied, shared, and opened cold comes back up to 0.05s off
 * what was stored. Comparing at the URL's own precision is what lets that
 * reopened link still light its row.
 */
function tenths(seconds: number): number {
  return Math.round(seconds * 10);
}

function isSavedLoop(value: unknown): value is SavedLoop {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    entry.id !== '' &&
    (entry.name === null || typeof entry.name === 'string') &&
    typeof entry.a === 'number' &&
    Number.isFinite(entry.a) &&
    typeof entry.b === 'number' &&
    Number.isFinite(entry.b) &&
    entry.b > entry.a &&
    typeof entry.savedAt === 'number' &&
    Number.isFinite(entry.savedAt)
  );
}

/** The newest save in a list, or 0 for an empty one. */
function newestSave(loops: SavedLoop[]): number {
  return loops.reduce((newest, entry) => Math.max(newest, entry.savedAt), 0);
}

/**
 * Whatever was in local storage, reduced to something the band can render.
 *
 * This is the first *structured* thing the app persists — the other two keys
 * are a number and a string union — and `useLocalStorage` parses and casts
 * without looking. So a hand-edited or half-written blob is normalised rather
 * than trusted: bad entries are dropped, good ones survive, and a boot never
 * throws on a value the app itself did not write.
 */
export function normaliseSavedLoops(raw: unknown): SavedLoopStore {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};

  const byTrack: SavedLoopStore = {};
  for (const [trackId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (trackId === '' || !Array.isArray(value)) continue;
    const loops = value
      .filter(isSavedLoop)
      .map((entry) => ({ ...entry, name: normaliseName(entry.name) }))
      .sort((left, right) => right.savedAt - left.savedAt)
      .slice(0, MAX_LOOPS_PER_TRACK);
    if (loops.length > 0) byTrack[trackId] = loops;
  }

  const tracks = Object.entries(byTrack);
  if (tracks.length <= MAX_TRACKS) return byTrack;

  // Over the ceiling: keep the tracks worked most recently.
  return Object.fromEntries(
    tracks.sort(([, left], [, right]) => newestSave(right) - newestSave(left)).slice(0, MAX_TRACKS),
  );
}

/** A typed name, or null for the rows that print their times instead. */
export function normaliseName(name: string | null | undefined): string | null {
  const trimmed = (name ?? '').trim().slice(0, LOOP_NAME_MAX);
  return trimmed === '' ? null : trimmed;
}

/**
 * The saved loop holding these bounds, or null.
 *
 * The whole information content of the band rests on this: when it returns a
 * row, the armed loop *is* that loop; when it returns null after returning
 * one, a nudge has moved you off it, and the row's printed times and the
 * nudger's live ones now disagree on purpose.
 */
export function findSavedLoop(loops: SavedLoop[], a: number, b: number): SavedLoop | undefined {
  return loops.find((entry) => tenths(entry.a) === tenths(a) && tenths(entry.b) === tenths(b));
}

/** Newest first, capped. The order the band prints. */
export function addSavedLoop(loops: SavedLoop[], entry: SavedLoop): SavedLoop[] {
  return [entry, ...loops].slice(0, MAX_LOOPS_PER_TRACK);
}

/**
 * `crypto.randomUUID` needs a secure context, which the app always has —
 * Spotify's SDK requires HTTPS and localhost counts — but a loop failing to
 * save because an id could not be minted would be a poor trade for that
 * certainty.
 */
export function newLoopId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
