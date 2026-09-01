/**
 * Resolves the `?redirect=` the gate stashed when it turned a visitor away.
 *
 * Takes the value as vue-router hands it over, already percent-decoded — this
 * does not decode again, since a second pass would mangle any path holding a
 * literal `%`.
 *
 * Only same-document paths are honoured. A protocol-relative `//host` is a URL
 * to somewhere else wearing a path's clothes, so it is rejected alongside
 * absolute URLs rather than trusted for its leading slash.
 */
export function resolveRedirectTarget(value: unknown): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || raw.trim() === '') return '/'

  // `/\host` is treated as protocol-relative by browsers, so it goes too.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/'
  return raw
}
