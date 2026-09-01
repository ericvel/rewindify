import breakpointsCss from './breakpoints.module.scss'

/**
 * Layout breakpoints, read from the stylesheet that also defines the media
 * query mixins. SCSS is the single source: nothing here restates a pixel value.
 */
function read(key: string): number {
  const parsed = Number(breakpointsCss[key])
  // Without `css: true`, Vitest stubs CSS modules and a lookup yields a scoped
  // class name rather than the value. Fail loudly instead of handing `NaN` to
  // `matchMedia`, where it would silently never match.
  if (!Number.isFinite(parsed)) {
    throw new Error(`Breakpoint "${key}" did not resolve to a number.`)
  }
  return parsed
}

export const breakpoints = {
  screenDesktop: read('screen-desktop'),
}
