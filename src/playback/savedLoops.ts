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

/**
 * What the name field accepts, and what a new save stores.
 *
 * Counted in *graphemes*, not UTF-16 units: `maxlength` would have let a family
 * emoji spend four of these and then split the fifth down the middle of its
 * joiners, so the field clamps through `clampName` instead.
 *
 * A row prints its name in 166px, which is around two dozen characters of
 * ordinary mixed case. Note what that measurement is not: twenty-four *wide*
 * glyphs run past 230px and truncate, and twenty-four CJK glyphs run further
 * still. So this is the row's width expressed as a count for Latin text, and
 * the ellipsis is what covers every script for which the count is generous.
 */
export const LOOP_NAME_MAX = 24;

/**
 * The ceiling normalisation applies on the way in, which is a different job.
 *
 * `LOOP_NAME_MAX` governs what the user can type from here on; this one only
 * has to stop a hand-edited blob carrying a paragraph. Names already saved
 * under a longer limit are the user's, not ours to shorten — a boot that
 * silently renamed them would be the same trade as discarding a loop, and the
 * row truncates what it cannot fit anyway.
 */
export const STORED_NAME_MAX = 120;

/**
 * Match precision: the second the interface actually prints.
 *
 * This was a tenth for one round, which is finer than anything the product
 * shows. `formatTime` floors to the whole second, so A at 28.4 and A at 28.9
 * both print `0:28` — and matching at a tenth meant a nudge the user could not
 * see on any readout silently took them off their saved loop, and let them
 * store a second row printing `0:28 – 1:00` beside an existing one. Precision
 * is the product, so the figure the user reads is the figure that decides: the
 * identity of a loop is the range it prints.
 *
 * Flooring rather than rounding, because `formatTime` floors — the comparison
 * has to be the same function the readout is, not merely a similar one.
 *
 * The bounds themselves are still stored exactly. Only the *comparison* is
 * coarse, so applying a saved loop restores the span that was pinned by ear
 * rather than a truncated one, and `useLoopUrlSync`'s tenth-of-a-second round
 * trip stays comfortably inside one printed second.
 */
function printedSecond(seconds: number): number {
  return Math.floor(seconds);
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

/**
 * One row per printed range, newest kept.
 *
 * `saveLoop` already refuses a duplicate, so this is not reachable through the
 * interface — it is reachable through a hand-edited blob, and through a blob
 * written before the match precision became the printed second. Two rows
 * printing `0:28 – 1:00` are two rows the user has no way to tell apart, and
 * only the first of them would ever light. Dropping the older one is the same
 * trade `isSavedLoop` makes with a malformed entry: normalise to something the
 * list can honestly render.
 *
 * Expects the list already sorted newest-first, which is the caller's own
 * order.
 */
function dedupeByRange(loops: SavedLoop[]): SavedLoop[] {
  const seen = new Set<string>();
  return loops.filter((entry) => {
    const range = `${printedSecond(entry.a)}-${printedSecond(entry.b)}`;
    if (seen.has(range)) return false;
    seen.add(range);
    return true;
  });
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
    const loops = dedupeByRange(
      value
        .filter(isSavedLoop)
        .map((entry) => ({ ...entry, name: normaliseName(entry.name) }))
        .sort((left, right) => right.savedAt - left.savedAt),
    ).slice(0, MAX_LOOPS_PER_TRACK);
    if (loops.length > 0) byTrack[trackId] = loops;
  }

  const tracks = Object.entries(byTrack);
  if (tracks.length <= MAX_TRACKS) return byTrack;

  // Over the ceiling: keep the tracks worked most recently.
  return Object.fromEntries(
    tracks.sort(([, left], [, right]) => newestSave(right) - newestSave(left)).slice(0, MAX_TRACKS),
  );
}

/**
 * The one shape of `Intl.Segmenter` this module uses.
 *
 * Declared locally rather than by widening the project's `lib` to `ES2022`,
 * which would quietly change what type-checks across every other file for the
 * sake of one call. The runtime has had `Segmenter` since 2022; the `typeof`
 * guard below is for a runtime that has not.
 */
interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}

function graphemeSegmenter(): GraphemeSegmenter | null {
  const intl = Intl as unknown as {
    Segmenter?: new (locales?: string, options?: { granularity: 'grapheme' }) => GraphemeSegmenter;
  };
  if (typeof intl.Segmenter !== 'function') return null;
  return new intl.Segmenter(undefined, { granularity: 'grapheme' });
}

/**
 * Truncate to a count of *graphemes*, so a limit never splits a character.
 *
 * `String.prototype.slice` counts UTF-16 code units, which is not a unit the
 * user typed in: fourteen guitar emoji are twenty-eight of them, and a family
 * emoji is eleven, so a slice at the limit can land inside a ZWJ sequence and
 * leave the fragment behind. `Intl.Segmenter` counts what a caret moves over.
 *
 * The `slice` fallback is for a runtime without `Segmenter`. It cannot split a
 * cluster it does not know about, so it takes the coarse cut rather than
 * refusing the name — a truncated emoji is a worse name, not a lost loop.
 */
export function clampName(value: string, limit: number): string {
  if (value.length <= limit) return value;
  const segmenter = graphemeSegmenter();
  if (segmenter === null) return value.slice(0, limit);

  let out = '';
  let taken = 0;
  for (const { segment } of segmenter.segment(value)) {
    if (taken === limit) break;
    out += segment;
    taken += 1;
  }
  return out;
}

/**
 * A typed name, or null for the rows that print their times instead.
 *
 * The limit is passed in rather than assumed, because the two callers want
 * different ones: a save from the field caps at `LOOP_NAME_MAX`, and reading
 * storage caps at `STORED_NAME_MAX` so an older, longer name survives the boot
 * that introduced the shorter limit.
 *
 * Trimmed after the clamp as well as before it, so a name cut at the limit
 * cannot end on the space the cut exposed.
 */
export function normaliseName(
  name: string | null | undefined,
  limit: number = STORED_NAME_MAX,
): string | null {
  const trimmed = clampName((name ?? '').trim(), limit).trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * The saved loop holding these bounds, or null.
 *
 * The whole information content of the selector rests on this: when it returns
 * a row, the armed loop *is* that loop; when it returns null after returning
 * one, a nudge has moved you off it — and because the comparison is now the
 * printed second, that flip is always visible on the A and B readouts that
 * caused it. A disagreement the user cannot see is not information.
 */
export function findSavedLoop(loops: SavedLoop[], a: number, b: number): SavedLoop | undefined {
  return loops.find(
    (entry) =>
      printedSecond(entry.a) === printedSecond(a) && printedSecond(entry.b) === printedSecond(b),
  );
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
