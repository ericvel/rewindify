import { onScopeDispose, ref, readonly } from 'vue';
import { breakpoints } from '@/styles/breakpoints';

/** Below this the phone layout is shown. See `styles/media-queries.scss`. */
export function useIsDesktop() {
  const query = window.matchMedia(`(min-width: ${breakpoints.screenDesktop}px)`);
  const isDesktop = ref(query.matches);

  const onChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches;
  };
  query.addEventListener('change', onChange);
  onScopeDispose(() => query.removeEventListener('change', onChange));

  return readonly(isDesktop);
}
