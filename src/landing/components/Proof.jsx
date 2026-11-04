import { useRef } from 'react'
import { useLang } from '../lib/i18n.jsx'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import s from './Proof.module.css'

/* Numbers and quotes here are PLACEHOLDERS (marked on the page). Replace them in content/en.js + ar.js. */
export default function Proof() {
  const { t } = useLang()
  const p = t.proof
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="impact" ref={root} className={`section section--white ${s.proof}`} aria-labelledby="proof-title">
      <div className="container">
        <SectionHead eyebrow={p.eyebrow} title={p.title} id="proof-title" />
        <p className={s.note} data-reveal><span className="tag-placeholder">{p.placeholder}</span>{p.placeholderNote}</p>
        <div className={s.stats} data-reveal>
          {p.stats.map((st) => (
            <div key={st.l} className={s.stat}>
              <strong dir="ltr" className="grad-text">{st.v}</strong>
              <span>{st.l}</span>
            </div>
          ))}
        </div>
        <div className={s.quotes}>
          {p.quotes.map((q, i) => (
            <figure key={i} className={s.quote} data-reveal style={{ '--d': `${i * 90}ms` }}>
              <span className={s.mark} aria-hidden="true">“</span>
              <blockquote>{q.q}</blockquote>
              <figcaption>
                <span className={s.av} aria-hidden="true">{q.n.charAt(0)}</span>
                <div><b>{q.n}</b><small>{q.r}</small></div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
