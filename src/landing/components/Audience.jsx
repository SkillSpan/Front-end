import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import useReveal from '../lib/useReveal'
import SectionHead from './SectionHead.jsx'
import s from './Audience.module.css'

function Panel({ data, variant, delay }) {
  const to = variant === 'learners' ? '/register/account' : '/company/register/account'
  return (
    <article className={`${s.panel} ${s[variant]}`} data-reveal style={{ '--d': delay }}>
      <span className={s.badge} aria-hidden="true">{variant === 'learners' ? <CapIcon /> : <BuildingIcon />}</span>
      <span className={s.tag}>{data.tag}</span>
      <h3>{data.title}</h3>
      <ul>
        {data.points.map((p) => <li key={p}><span aria-hidden="true">✓</span>{p}</li>)}
      </ul>
      <Link to={to} className={`btn ${variant === 'learners' ? 'btn-primary' : 'btn-light'}`}>
        {data.cta} <span className="arrow" aria-hidden="true">→</span>
      </Link>
    </article>
  )
}

const CapIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="url(#ss-g1)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <defs><linearGradient id="ss-g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#29A8FF" /><stop offset="1" stopColor="#9E51FA" /></linearGradient></defs>
    <path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5Z" /><path d="M6 11.5V16c0 1.3 2.7 3 6 3s6-1.7 6-3v-4.5" /><path d="M22 9.5V15" />
  </svg>
)
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#8fc8ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16" /><path d="M15 9h4a1 1 0 0 1 1 1v11" /><path d="M3 21h18" /><path d="M8 8h3M8 12h3M8 16h3" />
  </svg>
)

export default function Audience() {
  const { t } = useLang()
  const a = t.audience
  const root = useRef(null)
  useReveal(root, [t])

  return (
    <section id="solutions" ref={root} className={`section section--lavender ${s.audience}`} aria-labelledby="audience-title">
      <div className="container">
        <SectionHead eyebrow={a.eyebrow} title={a.title} sub={a.sub} id="audience-title" />
        <div className={s.panels}>
          <Panel data={a.learners} variant="learners" delay="0ms" />
          <Panel data={a.companies} variant="companies" delay="120ms" />
        </div>
      </div>
    </section>
  )
}
