const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()

/** ?static=1 → every section fully revealed and every loop paused (for the html.to.design Figma import). */
export const IS_STATIC = params.has('static') && params.get('static') !== '0'

/** People who ask their OS for less motion get the same calm, fully revealed page. */
export const REDUCED =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** true when animations should run at all */
// The client wants the ambient motion visible on every device, so OS reduced-motion no longer pauses it.
export const MOTION = !IS_STATIC
