import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import Logo from './Logo.jsx'
import s from './Nav.module.css'

/**
 * Landing header. The only three things that leave this page are the three
 * auth entry points — student login, student registration and company
 * registration — so they are the only links here that are not in-page anchors.
 */
export default function Nav() {
  const { t, lang, setLang } = useLang()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setOpen(false)
  const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en')

  return (
    <header className={`${s.nav} ${solid || open ? s.solid : ''}`}>
      <nav className={`container ${s.inner}`} aria-label="Main">
        <a href="#top" className={s.brand} aria-label="SkillSpan home" onClick={close}><Logo size={34} /></a>

        <ul className={`${s.links} ${open ? s.open : ''}`} id="nav-menu">
          {t.nav.links.map((l, i) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className={i === 0 ? s.current : undefined} onClick={close}>{l.label}</a>
            </li>
          ))}
          <li className={s.mobileOnly}>
            <Link to="/login" onClick={close}>{t.nav.login}</Link>
          </li>
          <li className={s.mobileOnly}>
            <Link to="/register/account" onClick={close}>{t.nav.register}</Link>
          </li>
          <li className={s.mobileOnly}>
            <Link to="/company/register/account" onClick={close}>{t.nav.company}</Link>
          </li>
        </ul>

        <div className={s.actions}>
          <button type="button" className={s.lang} onClick={toggleLang} aria-label={`Switch to ${t.langName}`} lang={lang === 'en' ? 'ar' : 'en'}>
            {t.langLabel}
          </button>
          <Link to="/login" className={s.login}>{t.nav.login}</Link>
          <Link to="/company/register/account" className={s.company}>{t.nav.company}</Link>
          <Link to="/register/account" className={`btn btn-primary ${s.cta}`}>{t.nav.register}</Link>
          <button type="button" className={s.burger} aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen((o) => !o)}>
            <span className="sr-only">{t.nav.menu}</span>
            <i /><i />
          </button>
        </div>
      </nav>
    </header>
  )
}
