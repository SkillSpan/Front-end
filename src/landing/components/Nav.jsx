import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'
import RegisterButton from '../../components/register/RegisterButton.jsx'
import { REGISTER_ROUTES } from '../../components/register/routes.js'
import { COPY } from '../../components/register/registerCopy.js'
import Logo from './Logo.jsx'
import s from './Nav.module.css'

/**
 * Landing header. One "Register" button opens the chooser (student / company,
 * plus the student and company login links), replacing the three separate
 * auth buttons that used to sit here.
 */
export default function Nav() {
  const { t, lang, setLang } = useLang()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

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
        </ul>

        <div className={s.actions}>
          <button type="button" className={s.lang} onClick={toggleLang} aria-label={`Switch to ${t.langName}`} lang={lang === 'en' ? 'ar' : 'en'}>
            {t.langLabel}
          </button>
          <button type="button" className={`btn btn-outline ${s.cta} ${s.loginBtn}`} onClick={() => navigate(REGISTER_ROUTES.loginUrl)}>
            {(COPY[lang] || COPY.en).logIn}
          </button>
          <RegisterButton className={`btn btn-primary ${s.cta}`} lang={lang} navigate={navigate} {...REGISTER_ROUTES} />
          <button type="button" className={s.burger} aria-expanded={open} aria-controls="nav-menu" onClick={() => setOpen((o) => !o)}>
            <span className="sr-only">{t.nav.menu}</span>
            <i /><i />
          </button>
        </div>
      </nav>
    </header>
  )
}
