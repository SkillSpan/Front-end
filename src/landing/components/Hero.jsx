import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import RegisterButton from '../../components/register/RegisterButton.jsx'
import { COPY } from '../../components/register/registerCopy.js'
import { REGISTER_ROUTES } from '../../components/register/routes.js'
import useReveal from '../lib/useReveal'
import Scene3D from './Scene3D.jsx'
import s from './Hero.module.css'

export default function Hero() {
  const { t, lang } = useLang()
  const navigate = useNavigate()
  const h = t.hero
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="top" ref={root} className={s.hero} aria-labelledby="hero-title">
      {/* Ambient background: soft drifting glows + slow rings. Pure CSS, never tied to scroll. */}
      <div className={s.bg} aria-hidden="true">
        <span className={`${s.glow} ${s.g1}`} />
        <span className={`${s.glow} ${s.g2}`} />
        <span className={`${s.glow} ${s.g3}`} />
        <span className={s.grid} />
      </div>

      <div className={`container ${s.inner}`}>
        <div className={s.copy}>
          <span className={s.pill} data-reveal>
            <i aria-hidden="true">✦</i>{h.eyebrow}
          </span>
          <h1 id="hero-title" className={s.title} data-reveal style={{ '--d': '80ms' }}>
            <span className={s.line}>{h.title1}</span>
            <span className={s.line}>{h.title2a}<span className="grad-text">{h.title2b}</span></span>
          </h1>
          <p className={s.sub} data-reveal style={{ '--d': '160ms' }}>{h.sub}</p>
          <div className={s.ctas} data-reveal style={{ '--d': '240ms' }}>
            <RegisterButton className="btn btn-primary" lang={lang} navigate={navigate} {...REGISTER_ROUTES}>
              {(COPY[lang] || COPY.en).startJourney} <span className="arrow" aria-hidden="true">→</span>
            </RegisterButton>
          </div>
          <ul className={s.perks} data-reveal style={{ '--d': '320ms' }}>
            {h.perks.map((p) => <li key={p}><span aria-hidden="true">✓</span>{p}</li>)}
          </ul>
        </div>

        <div className={s.visual} data-reveal="fade" style={{ '--d': '200ms' }}>
          <Scene3D />
        </div>
      </div>
    </section>
  )
}
