import s from './Logo.module.css'

/** SkillSpan mark + wordmark. `tone="dark"` for light backgrounds. logo.webp is a transparent cut-out (no badge); swap for the SVG when available. */
export default function Logo({ tone = 'light', size = 36 }) {
  return (
    <span className={`${s.logo} ${tone === 'dark' ? s.dark : ''}`} dir="ltr">
      <span className={s.mark} style={{ width: Math.round(size * 0.8), height: size }}>
        <img src="/landing/assets/logo.webp" alt="" width={Math.round(size * 0.8)} height={size} />
      </span>
      <span className={s.word}>Skill<span>Span</span></span>
    </span>
  )
}
