import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import useReveal from '../lib/useReveal'
import Scene3D from './Scene3D.jsx'
import s from './CTA.module.css'

/**
 * Closing band on a blue-violet gradient with a slow ambient bridge arc.
 * Left: eyebrow, headline, one line, the two registration entry points.
 * Right: a small version of the hero's 3D scene with three animated icons.
 *
 * This used to be a waitlist form that accepted an email and thanked the
 * visitor without sending anything anywhere. The product has real sign-up
 * routes, so the band now hands off to them instead of pretending.
 */
export default function CTA() {
  const { t } = useLang()
  const c = t.cta
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="contact" ref={root} className={s.cta} aria-labelledby="cta-title">
      {/* ambient: two drifting glows and a slow bridge arc with travelling light. Never tied to scroll. */}
      <div className={s.bg} aria-hidden="true">
        <span className={`${s.glow} ${s.g1}`} />
        <span className={`${s.glow} ${s.g2}`} />
        <svg className={s.arc} viewBox="0 0 1440 420" preserveAspectRatio="none">
          <defs>
            <linearGradient id="ctaArc" x1="0" x2="1">
              <stop offset="0" stopColor="#29a8ff" stopOpacity="0" />
              <stop offset="0.5" stopColor="#8f7bff" stopOpacity="0.9" />
              <stop offset="1" stopColor="#f9ab1f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M-20 400 Q720 -60 1460 400" className={s.arcMain} />
          <path d="M-20 400 Q720 -60 1460 400" className={s.arcFlow} />
        </svg>
      </div>

      <div className={`container ${s.inner}`}>
        <div className={s.copy}>
          <span className={s.eyebrow} data-reveal><i aria-hidden="true" />{c.eyebrow}</span>
          <h2 id="cta-title" data-reveal style={{ '--d': '60ms' }}>{c.title}</h2>
          <p className={s.sub} data-reveal style={{ '--d': '120ms' }}>{c.sub}</p>

          <div className={s.panel} data-reveal style={{ '--d': '180ms' }}>
            <div className={s.actions}>
              <Link to="/register/account" className="btn btn-primary">
                {c.paths[0].button} <span className="arrow" aria-hidden="true">→</span>
              </Link>
              <Link to="/company/register/account" className="btn btn-light">
                {c.paths[1].button} <span className="arrow" aria-hidden="true">→</span>
              </Link>
            </div>
            <small className={s.note}>
              {c.haveAccount} <Link to="/login" className={s.noteLink}>{c.loginLink}</Link>
            </small>
          </div>
        </div>

        <div className={s.visual} data-reveal="fade" style={{ '--d': '200ms' }} aria-hidden="true">
          <Scene3D compact />
        </div>
      </div>
    </section>
  )
}
