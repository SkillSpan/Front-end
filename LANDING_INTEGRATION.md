# Landing page — integration notes

The public landing page at `/` is the marketing site from
`skillspan-landing-final`, mounted inside this app. The old
`src/components/common/Landing.jsx` was archived to `_archive/old-landing/`.

## Where things live

| What | Where |
| --- | --- |
| Route entry (`/`) | `src/landing/LandingPage.jsx` |
| Sections (one component each) | `src/landing/components/` |
| All copy, EN + AR (identical keys) | `src/landing/content/en.js`, `ar.js` |
| Design tokens / global styles | `src/landing/styles/tokens.css`, `global.css` |
| Images | `public/landing/assets/` (referenced as `/landing/assets/…`) |

## The three entry points (the only links that leave the page)

| Action | Route |
| --- | --- |
| Student login | `/login` |
| Student registration | `/register/account` |
| Company registration | `/company/register/account` |

They are wired in `Nav.jsx` (header, plus a mobile menu copy), `Hero.jsx`,
`Audience.jsx`, `CTA.jsx` and `Footer.jsx`. Everything else on the page is an
in-page anchor (`#features`, `#journey`, …).

The old waitlist form in the closing band accepted an email and thanked the
visitor without sending anything anywhere. It was replaced by the two real
registration buttons — do not reintroduce a form that has no endpoint.

## Two rules that must not be broken

1. **Landing CSS is scoped to `.landing-root` and uses `:where()` for the
   prefix.** The app and the landing share one document; the landing's
   `html`/`body` styles would otherwise restyle the login, dashboard and
   company screens. The `:where()` part matters just as much: a plain
   `.landing-root a { color: inherit }` (0,1,1) beats the single-class rules in
   the CSS modules and painted the header links in the dark ink colour —
   invisible on the navy bar. Element resets must stay at zero specificity.
2. **The CSS import order in `LandingPage.jsx` is load-bearing.** `tokens.css`
   and `global.css` are imported before the section components so the modules
   can refine `.btn` / `.container` (e.g. the nav CTA is 42px, not 52px).

## Language

The landing reads and writes the app's saved language preference
(`PreferencesContext`), so the nav toggle, `?lang=ar|en` and Settings ▸ Language
all agree, and `<html dir>` is owned in one place. English is the default for a
first-time visitor; `?lang=ar` deep-links to the RTL version.

## `?static=1`

Reveals every section and pauses every loop (the design hand-off uses it for
Figma import). The flag now sets `is-static` on the wrapper instead of on
`<html>`, so it cannot pause animations on the signed-in screens.

## Still open

- The **Impact** section ships sample numbers and quotes, marked "Placeholder"
  on the page (`proof` in `en.js` / `ar.js`). Replace with real data or delete
  the section before launch.
- The logo is a raster cut-out (`public/landing/assets/logo.webp`); swap in the
  SVG when it exists.
- Footer link columns ("Platform", "Company", "Legal") are in-page anchors to
  `#top` — they need real pages or should be trimmed.
