import { onScopeDispose, ref, readonly } from 'vue'

/**
 * Below this the phone layout is shown. The desktop layout needs room for its
 * 300px sidebar plus a workable waveform.
 */
const DESKTOP_MIN_WIDTH = 900

export function useIsDesktop() {
  const query = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`)
  const isDesktop = ref(query.matches)

  const onChange = (event: MediaQueryListEvent) => {
    isDesktop.value = event.matches
  }
  query.addEventListener('change', onChange)
  onScopeDispose(() => query.removeEventListener('change', onChange))

  return readonly(isDesktop)
}
