import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import Logo from './Logo.jsx'
import s from './Footer.module.css'

export default function Footer() {
  const { t } = useLang()
  const f = t.footer
  return (
    <footer className={s.footer}>
      <div className={`container ${s.top}`}>
        <div className={s.brand}>
          <Logo size={38} />
          <p>{f.tagline}</p>
        </div>
        {/* The only real destinations in the footer: the three auth entry points. */}
        <nav className={s.col} aria-label={f.account.h}>
          <h3>{f.account.h}</h3>
          <ul>
            <li><Link to="/login">{f.account.login}</Link></li>
            <li><Link to="/register/account">{f.account.register}</Link></li>
            <li><Link to="/company/register/account">{f.account.company}</Link></li>
          </ul>
        </nav>
        {f.cols.map((c) => (
          <nav key={c.h} className={s.col} aria-label={c.h}>
            <h3>{c.h}</h3>
            <ul>
              {c.l.map((l) => (
                <li key={l.label}>
                  {l.href ? <a href={l.href}>{l.label}</a> : <span className={s.soon}>{l.label}</span>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={`container ${s.bottom}`}>
        <small>{f.rights}</small>
        <small lang="ar" dir="rtl">جسرك نحو المستقبل الرقمي</small>
      </div>
    </footer>
  )
}
