import { useEffect } from 'react'
import { MOTION } from './motion'

/**
 * Reveal-once fades. Any element with [data-reveal] inside `rootRef` gets `.is-in` the first
 * time it enters the viewport, then it is never touched again — no scroll-linked transforms.
 *   data-reveal         → fade + 14px rise (text, cards)
 *   data-reveal="fade"  → opacity only (images: no transform, so nothing can wobble)
 *   style={{ '--d': '120ms' }} → optional delay
 */
export default function useReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = [...root.querySelectorAll('[data-reveal]')]
    if (!MOTION || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('is-in')
          io.unobserve(e.target)
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
