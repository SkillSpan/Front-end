import { useRef } from 'react'
import { useLang } from '../lib/i18n.jsx'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import s from './Platform.module.css'

const ICONS = ['◎', '➜', '▦']

/** The one product shot on the page: her real dashboard, in a browser frame. Fades in once; never moves with scroll. */
export default function Platform() {
  const { t } = useLang()
  const p = t.platform
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="platform" ref={root} className={`section section--dark ${s.platform}`} aria-labelledby="platform-title">
      <div className={`container ${s.inner}`}>
        <div className={s.copy}>
          <SectionHead eyebrow={p.eyebrow} title={p.title} sub={p.sub} id="platform-title" align="start" />
          <ul className={s.points}>
            {p.points.map((pt, i) => (
              <li key={pt.t} data-reveal style={{ '--d': `${i * 90}ms` }}>
                <span className={s.icon} aria-hidden="true">{ICONS[i]}</span>
                <div><h3>{pt.t}</h3><p>{pt.d}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <figure className={s.shot} data-reveal="fade" style={{ '--d': '150ms' }}>
          <span className={s.glow} aria-hidden="true" />
          <div className={s.frame}>
            <div className={s.chrome} aria-hidden="true"><i /><i /><i /><span>SkillSpan · Dashboard</span></div>
            <img src="/landing/assets/screen-dashboard.webp" alt={p.alt} width="1438" height="1022" loading="lazy" decoding="async" />
          </div>
        </figure>
      </div>
    </section>
  )
}
