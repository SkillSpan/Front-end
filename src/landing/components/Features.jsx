import { useEffect, useRef } from 'react'
import { useLang } from '../lib/i18n.jsx'
import { MOTION } from '../lib/motion'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import FeatureVisual from './FeatureVisual.jsx'
import s from './Features.module.css'

const ICONS = { assess: '◔', readiness: '◎', roadmap: '⟿', projects: '▦', simulation: '⌘', mentor: '☍', ai: '✦', talent: '★' }

export default function Features() {
  const { t } = useLang()
  const f = t.features
  const root = useRef(null)
  useReveal(root, [t])

  // Each card's small product animation starts once, the first time the card is on screen.
  useEffect(() => {
    const cards = [...root.current.querySelectorAll('[data-feature]')]
    if (!MOTION || !('IntersectionObserver' in window)) { cards.forEach((c) => c.classList.add(s.live)); return }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add(s.live); io.unobserve(e.target) }
    }), { threshold: 0.35 })
    cards.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [t])

  return (
    <section id="features" ref={root} className={`section section--dark ${s.features}`} aria-labelledby="features-title">
      <div className="container">
        <SectionHead eyebrow={f.eyebrow} title={f.title} sub={f.sub} id="features-title" />
        <div className={s.grid}>
          {f.items.map((it, i) => (
            <article key={it.key} className={`${s.card} ${s['c_' + it.key]}`} data-feature data-reveal style={{ '--d': `${(i % 4) * 70}ms` }}>
              <div className={s.visual} aria-hidden="true"><FeatureVisual k={it.key} demo={f.demo} /></div>
              <div className={s.body}>
                <div className={s.titleRow}>
                  <span className={s.icon} aria-hidden="true">{ICONS[it.key]}</span>
                  <h3>{it.title}</h3>
                </div>
                <p>{it.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
