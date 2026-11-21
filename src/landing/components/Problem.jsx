import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/i18n.jsx'
import { MOTION } from '../lib/motion'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import s from './Problem.module.css'

/**
 * Problem → solution as four bridges.
 * Each row reveals once when it enters the view: the problem card settles (muted), a beam of
 * light crosses the bridge, and the solution card "lights up" with its mini visual.
 * After that only an ambient spark loops on the bridge. Nothing is tied to scroll position.
 * Hover / focus / tap a row to replay its crossing.
 */
function ProblemGlyph({ i }) {
  // small grey "broken" glyphs for the problem side
  const paths = [
    <path key="0" d="M5 19V9l7-4 7 4v10M9 19v-5h6v5" />, // empty building: no experience
    <path key="1" d="M7 4h7l4 4v12H7zM14 4v4h4M10 13h5M10 16h3" />, // a lone pdf
    <path key="2" d="M4 18c3 0 2-6 5-6s1 5 4 5 2-9 7-9M17 5l3 3-3 3" />, // tangled path
    <path key="3" d="M7 4h10v16H7zM10 9h4M10 12h4M12 16v.01" />, // a CV with a question
  ]
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[i]}</svg>
}

function SolutionViz({ kind, value }) {
  if (kind === 'projects') {
    return (
      <div className={`${s.viz} ${s.vizProjects}`} aria-hidden="true">
        {[0, 1, 2].map((k) => <span key={k} style={{ '--k': k }}><i /></span>)}
      </div>
    )
  }
  if (kind === 'record') {
    return (
      <div className={`${s.viz} ${s.vizRecord}`} aria-hidden="true">
        {Array.from({ length: 12 }, (_, k) => <span key={k} style={{ '--k': k }} />)}
      </div>
    )
  }
  if (kind === 'roadmap') {
    return (
      <div className={`${s.viz} ${s.vizRoadmap}`} aria-hidden="true">
        <span className={s.track}><i /></span>
        {[0, 1, 2, 3].map((k) => <b key={k} style={{ '--k': k }} />)}
      </div>
    )
  }
  const c = 2 * Math.PI * 20
  return (
    <div className={`${s.viz} ${s.vizScore}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" width="56" height="56">
        <circle cx="24" cy="24" r="20" className={s.scoreBg} />
        <circle cx="24" cy="24" r="20" className={s.scoreFg} style={{ '--c': c, '--off': c * (1 - Number(value) / 100) }} />
      </svg>
    </div>
  )
}

function Row({ it, i, tags }) {
  const ref = useRef(null)
  const [lit, setLit] = useState(!MOTION)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (!MOTION) return
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { setLit(true); return }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setLit(true); io.disconnect() }
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const replay = () => { if (MOTION && lit) setRun((r) => r + 1) }

  return (
    <li
      ref={ref}
      className={`${s.row} ${lit ? s.lit : ''}`}
      style={{ '--i': i }}
      onMouseEnter={replay}
      onFocus={replay}
      onClick={replay}
      tabIndex={0}
    >
      <article className={s.problemCard} aria-label={`${tags.problemTag}: ${it.problem}`}>
        <span className={s.num} aria-hidden="true">0{i + 1}</span>
        <span className={s.glyph} aria-hidden="true"><ProblemGlyph i={i} /></span>
        <h3>{it.problem}</h3>
        <p>{it.pd}</p>
        <div className={s.pStat}><b>{it.pv}</b><span>{it.pl}</span></div>
      </article>

      <div className={s.bridge} aria-hidden="true">
        <svg viewBox="0 0 120 40" preserveAspectRatio="none">
          <path className={s.deck} d="M0 30 Q60 -6 120 30" />
          <path key={run} className={s.beam} d="M0 30 Q60 -6 120 30" pathLength="1" />
        </svg>
        <span key={`s${run}`} className={s.spark} />
        <span className={s.node} />
      </div>

      <article className={s.solutionCard} aria-label={`${tags.solutionTag}: ${it.solution}`}>
        <span className={s.check} aria-hidden="true">✓</span>
        <h3>{it.solution}</h3>
        <p>{it.sd}</p>
        <div className={s.sFoot}>
          <div className={s.sStat}><b>{it.sv}</b><span>{it.sl}</span></div>
          <SolutionViz key={run} kind={it.viz} value={it.sv} />
        </div>
      </article>
    </li>
  )
}

export default function Problem() {
  const { t } = useLang()
  const p = t.problem
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="about" ref={root} className={`section section--lavender ${s.problem}`} aria-labelledby="problem-title">
      <div className={s.bg} aria-hidden="true"><span /><span /></div>
      <div className="container">
        <SectionHead eyebrow={p.eyebrow} title={p.title} sub={p.sub} id="problem-title" />

        <div className={s.legend} data-reveal aria-hidden="true">
          <span className={s.legendOff}><i />{p.problemTag}</span>
          <span className={s.legendLine} />
          <span className={s.legendOn}><i />{p.solutionTag}</span>
        </div>

        <ol className={s.rows}>
          {p.items.map((it, i) => <Row key={it.problem} it={it} i={i} tags={p} />)}
        </ol>
      </div>
    </section>
  )
}
