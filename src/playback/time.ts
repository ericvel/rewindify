/** Formats seconds as `m:ss`. Negative input clamps to zero. */
export function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = Math.floor(safe % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Short relative label for the recently-played list: `now`, `18m`, `3h`, `Yest.` */
export function formatAgo(playedAt: number, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - playedAt);
  if (elapsed < MINUTE) return 'now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < 2 * DAY) return 'Yest.';
  return `${Math.floor(elapsed / DAY)}d`;
}
