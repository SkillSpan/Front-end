import { useEffect, useMemo } from 'react'
// Landing styles are global by nature (`.container`, `.btn`, `.section`…), so
// they are written against `.landing-root` instead of `html`/`body` — see
// styles/global.css. They are imported first so the per-component CSS modules
// that follow can refine them, the same order the standalone site used.
import './styles/tokens.css'
import './styles/global.css'
import { LangContext, dictionaries } from './lib/i18n.jsx'
import { MOTION } from './lib/motion'
import { usePreferences } from '../preferences/PreferencesContext'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Problem from './components/Problem.jsx'
import Features from './components/Features.jsx'
import Journey from './components/Journey.jsx'
import Platform from './components/Platform.jsx'
import Audience from './components/Audience.jsx'
import Proof from './components/Proof.jsx'
import CTA from './components/CTA.jsx'
import Footer from './components/Footer.jsx'
import BackToTop from './components/BackToTop.jsx'

/**
 * The public marketing page, mounted at `/`.
 *
 * Differences from the standalone site it came from:
 *  - language is the app's saved preference (PreferencesContext) instead of a
 *    private state, so `?lang=ar`, the nav toggle and the learner settings all
 *    agree, and `<html dir>` is owned in one place;
 *  - the three auth entry points are real routes (`/login`, `/register/account`,
 *    `/company/register/account`) instead of `#contact` anchors;
 *  - `is-static` sits on the wrapper, not on `<html>`, so `?static=1` cannot
 *    pause animations on the signed-in screens.
 */
export default function LandingPage() {
  const { lang, setLang } = usePreferences()

  // `?lang=ar` / `?lang=en` still works for shared links and screenshots.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('lang')
    if ((q === 'ar' || q === 'en') && q !== lang) setLang(q)
  }, [lang, setLang])

  // A route change does not reset the document scroll position; the landing is
  // always entered from the top.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const t = dictionaries[lang] || dictionaries.en
  const value = useMemo(() => ({ lang, t, setLang }), [lang, t, setLang])

  return (
    <LangContext.Provider value={value}>
      <div className={`landing-root${MOTION ? '' : ' is-static'}`} dir={t.dir} lang={lang}>
        <a href="#main" className="skip">Skip to content</a>
        <Nav />
        <main id="main" key={lang}>
          <Hero />
          <Problem />
          <Features />
          <Journey />
          <Platform />
          <Audience />
          <Proof />
          <CTA />
        </main>
        <Footer />
        <BackToTop />
      </div>
    </LangContext.Provider>
  )
}
