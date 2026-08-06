import { useState } from 'react'
import { Link } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home', href: '#home', active: true },
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'For companies', href: '#for-companies' },
  { label: 'Pricing', href: '#pricing' },
]

export default function Navbar() {
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="relative z-20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-2xl font-extrabold tracking-tight">
          <span className="text-white">Skill</span>
          <span className="text-cyan">Span</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 text-sm font-medium text-ice/90 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={
                  link.active
                    ? 'relative text-white after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-cyan'
                    : 'transition-colors hover:text-white'
                }
              >
                {link.label}
              </a>
            </li>
          ))}
          <li className="relative">
            <button
              type="button"
              onClick={() => setResourcesOpen((v) => !v)}
              aria-expanded={resourcesOpen}
              className="flex items-center gap-1 transition-colors hover:text-white"
            >
              Resources
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                className={`transition-transform ${resourcesOpen ? 'rotate-180' : ''}`}
              >
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {resourcesOpen && (
              <ul className="absolute left-0 top-8 w-44 overflow-hidden rounded-xl border border-white/10 bg-navy shadow-xl">
                {['Blog', 'Guides', 'Help Center'].map((item) => (
                  <li key={item}>
                    <a href="#" className="block px-4 py-2.5 text-sm text-ice/90 hover:bg-white/5 hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            className="rounded-full border border-cyan/70 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan/10"
          >
            log in
          </Link>
          <Link
            to="/signup"
            className="flex items-center gap-2 rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan/20 transition-transform hover:scale-[1.03]"
          >
            Get Started
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="text-white lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path
              d={mobileOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-navy px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-4 text-sm font-medium text-ice/90">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={link.active ? 'text-white' : ''}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>Resources</li>
          </ul>
          <div className="mt-5 flex flex-col gap-3">
            <Link to="/login" className="rounded-full border border-cyan/70 px-5 py-2 text-center text-sm font-semibold text-white">
              log in
            </Link>
            <Link to="/signup" className="rounded-full bg-brand-gradient px-5 py-2 text-center text-sm font-semibold text-white">
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
