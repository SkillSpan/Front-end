import { useRef } from 'react'
import { useLang } from '../lib/i18n.jsx'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import JourneyBridge from './JourneyBridge.jsx'
import s from './Journey.module.css'

/**
 * Six steps on a bridge. The step dots are laid out by CSS grid (one equal column each),
 * and the ambient bridge canvas reads the dots' real positions, so every hanger lands
 * exactly on its dot in any width or direction. The motion loops on its own — never tied to scroll.
 */
export default function Journey() {
  const { t, lang } = useLang()
  const j = t.journey
  const root = useRef(null)
  const track = useRef(null)
  useReveal(root, [t])

  return (
    <section id="journey" ref={root} className={`section section--white ${s.journey}`} aria-labelledby="journey-title">
      <div className="container">
        <SectionHead eyebrow={j.eyebrow} title={j.title} sub={j.sub} id="journey-title" />
        <div ref={track} className={s.track} data-reveal="fade">
          <JourneyBridge trackRef={track} dotSelector={`.${s.dot}`} litClass={s.lit} lang={lang} />
          <ol className={s.steps}>
            {j.steps.map((st, i) => (
              <li key={st.t} className={s.step}>
                <span className={s.dot} aria-hidden="true"><i /></span>
                <span className={s.num} dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                <h3>{st.t}</h3>
                <p>{st.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
