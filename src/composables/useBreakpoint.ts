import { onScopeDispose, ref, readonly } from 'vue';
import { breakpoints } from '@/styles/breakpoints';

function useMedia(queryText: string) {
  const query = window.matchMedia(queryText);
  const matches = ref(query.matches);

  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches;
  };
  query.addEventListener('change', onChange);
  onScopeDispose(() => query.removeEventListener('change', onChange));

  return readonly(matches);
}

function useMinWidth(px: number) {
  return useMedia(`(min-width: ${px}px)`);
}

/** Below this the phone layout is shown. See `styles/media-queries.scss`. */
export function useIsDesktop() {
  return useMinWidth(breakpoints.screenDesktop);
}

/**
 * The wide band of the phone layout: still the phone view, but on a plate broad
 * enough to be read as a panel. It stays true above the desktop breakpoint,
 * which costs nothing — every consumer is inside the phone view, and that view
 * is unmounted by then.
 *
 * Only quantities that CSS cannot reach belong here (a bar count, an artwork
 * edge). Everything expressible as a rule uses the `screen-wide` SCSS mixin, so
 * the band is not restated in two languages more than it has to be.
 */
export function useIsWide() {
  return useMinWidth(breakpoints.screenWide);
}

/** Wide enough for two columns, but too short for the portrait control stack. */
export function useIsShortWide() {
  return useMedia(
    `(min-width: ${breakpoints.screenWide}px) and (max-width: ${breakpoints.screenDesktop - 0.02}px) and (max-height: ${breakpoints.screenShort}px)`,
  );
}
