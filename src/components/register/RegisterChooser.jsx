import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './RegisterChooser.module.css'
import { COPY, goToRole } from './registerCopy.js'

/*
 * RegisterChooser: one "Register" entry point for SkillSpan (light split design).
 * Left half = student (light blue / blue), right half = company (warm light / amber).
 * Each half's button goes straight to its signup page.
 *
 * Props
 *   open        boolean          show / hide the chooser
 *   onClose     () => void       called on X, Esc, backdrop click
 *   studentUrl  string           default '/register'
 *   companyUrl  string           default '/register/company'  (set to your real company route)
 *   loginUrl    string | null    optional "Already have an account? Log in" line (hidden when not set)
 *   companyLoginUrl string | null when set too, the line reads "Log in as student · as company"
 *   lang        'en' | 'ar'      Arabic mirrors the dialog (RTL) and uses the Alexandria font
 *   onSelect    (role) => void   optional. If given, it is called with 'student' | 'company'
 *                                instead of navigating (use it with react-router's navigate()).
 *   navigate    (url) => void    optional. react-router's navigate(); used for every link in the
 *                                dialog (both roles and the login links) so nothing reloads the page.
 */

const CapIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 9 12 4 2 9l10 5 10-5Z" />
    <path d="M6 11.2v4.3c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.3" />
    <path d="M22 9v5.5" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M8.5 7V5.5A1.5 1.5 0 0 1 10 4h4a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M3 12.5h18" />
  </svg>
)

// The platform's own mark (same file the landing header uses).
const Logo = () => (
  <img className={styles.brandMark} src="/landing/assets/logo.webp" alt="" width="26" height="32" />
)

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
const EXIT_MS = 160

export default function RegisterChooser({
  open,
  onClose,
  studentUrl = '/register',
  companyUrl = '/register/company',
  loginUrl = null,
  showLogin = false,
  companyLoginUrl = null,
  lang = 'en',
  onSelect,
  navigate,
}) {
  const t = COPY[lang] || COPY.en
  const rtl = lang === 'ar'
  const [mounted, setMounted] = useState(open)
  // Mount as soon as it opens (state adjusted during render, React's documented pattern);
  // when it closes, keep it mounted for the short exit animation, then unmount.
  if (open && !mounted) setMounted(true)
  const leaving = mounted && !open
  const dialogRef = useRef(null)
  const firstRef = useRef(null)
  const returnFocusRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (open || !mounted) return undefined
    const id = setTimeout(() => setMounted(false), EXIT_MS)
    return () => clearTimeout(id)
  }, [open, mounted])

  // scroll lock, restore focus on close
  useEffect(() => {
    if (!open) return undefined
    returnFocusRef.current = document.activeElement
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      const el = returnFocusRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }
  }, [open])

  // move focus into the dialog once it is on screen
  useEffect(() => {
    if (open && mounted) firstRef.current?.focus({ preventScroll: true })
  }, [open, mounted])

  const go = useCallback((r) => {
    goToRole(r, { studentUrl, companyUrl, onSelect, navigate })
  }, [studentUrl, companyUrl, onSelect, navigate])

  // login links: plain <a href> (works without a router); with navigate() they stay in the SPA
  const linkProps = (url) => ({
    href: url,
    onClick: (e) => {
      if (typeof navigate !== 'function' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
      e.preventDefault()
      navigate(url)
    },
  })

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return }
    if (e.key === 'Tab') {
      const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null)
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  }

  if (!mounted || typeof document === 'undefined') return null

  const halves = [
    { key: 'student', Icon: CapIcon, ...t.student },
    { key: 'company', Icon: BriefcaseIcon, ...t.company },
  ]

  return createPortal(
    <div
      className={`${styles.backdrop} ${leaving ? styles.leaving : ''}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        dir={rtl ? 'rtl' : 'ltr'}
        lang={lang}
        data-lang={lang}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId} className={styles.srOnly}>{t.title}</h2>
        <button type="button" className={styles.close} onClick={() => onClose?.()} aria-label={t.close}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        <div className={styles.split}>
          {halves.map(({ key, Icon, title, desc, bullets, cta }, i) => {
            const headId = `${titleId}-${key}`
            return (
              <section key={key} className={`${styles.half} ${styles[key]}`} aria-labelledby={headId} data-half={key}>
                {i === 0 && (
                  <div className={styles.brand} dir="ltr">
                    <Logo />
                    <span>SkillSpan</span>
                  </div>
                )}
                <span className={styles.tile}><Icon /></span>
                <h3 id={headId} className={styles.halfTitle}>{title}</h3>
                <p className={styles.desc}>{desc}</p>
                <ul className={styles.bullets}>
                  {bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
                <button
                  ref={i === 0 ? firstRef : undefined}
                  type="button"
                  data-role={key}
                  className={styles.cta}
                  onClick={() => go(key)}
                >
                  {cta}
                </button>
              </section>
            )
          })}
        </div>

        {showLogin && loginUrl && (
          <p className={styles.login}>
            {t.login}{' '}
            {companyLoginUrl ? (
              <>
                <a {...linkProps(loginUrl)} data-login="student">{t.loginStudent}</a>
                <span className={styles.loginSep} aria-hidden="true">·</span>
                <a {...linkProps(companyLoginUrl)} data-login="company">{t.loginCompany}</a>
              </>
            ) : (
              <a {...linkProps(loginUrl)}>{t.loginLink}</a>
            )}
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
