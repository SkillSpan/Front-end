/** Eyebrow + h2 + lead, used by every section. */
export default function SectionHead({ eyebrow, title, sub, id, align = 'center' }) {
  return (
    <header className={`head ${align === 'start' ? 'head--start' : ''}`}>
      <span className="eyebrow" data-reveal>{eyebrow}</span>
      <h2 className="h2" id={id} data-reveal style={{ '--d': '60ms' }}>{title}</h2>
      {sub && <p className="lead" data-reveal style={{ '--d': '120ms' }}>{sub}</p>}
    </header>
  )
}
