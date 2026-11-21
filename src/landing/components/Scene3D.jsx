import { useEffect, useRef } from 'react'
import { useLang } from '../lib/i18n.jsx'
import { MOTION } from '../lib/motion'
import s from './Scene3D.module.css'

/**
 * Hero scene: a glossy 3D character at the centre, a glowing blue→violet path rising behind
 * to a gold star, and six glass tiles for the SkillSpan journey around it.
 * On load: the path draws itself, then the tiles appear one by one in journey order.
 * Then everything loops gently (ambient CSS, never tied to scroll): the character idles,
 * tiles float, two breathe (scale pulse), two fade out and back, the star twinkles.
 * On fine pointers the layers drift with the cursor for depth.
 * `compact` (closing section): character, path, star and two tiles. Mobile: four tiles.
 * ?static=1 / reduced motion: everything rests in its final place.
 */
const TILES = [
  { key: 'assess', icon: 'target', at: [12, 27], fx: 'pulse', depth: 24 },
  { key: 'learn', icon: 'cap', at: [37, 7], fx: 'blink', depth: 30, mobileHide: true },
  { key: 'projects', icon: 'briefcase', at: [67, 16], fx: 'float', depth: 20 },
  { key: 'mentor', icon: 'chat', at: [89, 41], fx: 'pulse', depth: 28 },
  { key: 'readiness', icon: 'chart', at: [87, 70], fx: 'blink', depth: 18, mobileHide: true },
  { key: 'hired', icon: 'check', at: [13, 70], fx: 'float', depth: 26 },
]
const COMPACT = ['readiness', 'hired']
const COMPACT_AT = { readiness: [85, 46], hired: [15, 64] }

export default function Scene3D({ compact = false }) {
  const { t } = useLang()
  const sc = t.scene
  const root = useRef(null)
  const tiles = compact
    ? TILES.filter((x) => COMPACT.includes(x.key)).map((x) => ({ ...x, at: COMPACT_AT[x.key], mobileHide: false }))
    : TILES

  useEffect(() => {
    const el = root.current
    if (!MOTION || !el || !window.matchMedia('(pointer: fine)').matches) return
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)
        const y = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)
        el.style.setProperty('--mx', Math.max(-1, Math.min(1, x)).toFixed(3))
        el.style.setProperty('--my', Math.max(-1, Math.min(1, y)).toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { cancelAnimationFrame(raf); window.removeEventListener('pointermove', onMove) }
  }, [])

  return (
    <div ref={root} className={`${s.scene} ${compact ? s.compact : ''}`}>
      <span className={s.halo} aria-hidden="true" />

      {/* the rising path to the star */}
      <svg className={s.path} viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <linearGradient id={compact ? 'pathGradC' : 'pathGrad'} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#29a8ff" stopOpacity="0.15" />
            <stop offset="0.35" stopColor="#29a8ff" />
            <stop offset="0.75" stopColor="#8a6dff" />
            <stop offset="1" stopColor="#c59bff" />
          </linearGradient>
        </defs>
        <path className={s.pathGlow} d="M30 560 C 170 610, 330 560, 400 400 S 470 140, 540 70" stroke={`url(#${compact ? 'pathGradC' : 'pathGrad'})`} pathLength="1" />
        <path className={s.pathLine} d="M30 560 C 170 610, 330 560, 400 400 S 470 140, 540 70" stroke={`url(#${compact ? 'pathGradC' : 'pathGrad'})`} pathLength="1" />
        <path className={s.pathFlow} d="M30 560 C 170 610, 330 560, 400 400 S 470 140, 540 70" pathLength="1" />
      </svg>

      <div className={s.star} aria-hidden="true">
        <img src="/landing/assets/scene/icon-star.webp" alt="" width="200" height="200" decoding="async" />
      </div>

      <div className={s.character}>
        <div className={s.idle}>
          <img
            src="/landing/assets/scene/character.webp"
            alt={sc.alt}
            width="800" height="1000"
            loading={compact ? 'lazy' : 'eager'}
            fetchPriority={compact ? 'auto' : 'high'}
            decoding="async"
          />
        </div>
      </div>

      {tiles.map((tile, i) => (
        <div
          key={tile.key}
          className={`${s.spot} ${tile.mobileHide ? s.mHide : ''}`}
          style={{ '--x': `${tile.at[0]}%`, '--y': `${tile.at[1]}%`, '--i': i, '--depth': tile.depth }}
        >
          <div className={`${s.tile} ${s[tile.fx]}`}>
            <img src={`/landing/assets/scene/icon-${tile.icon}.webp`} alt="" width="200" height="200" decoding="async" />
            <span>{sc.tiles[tile.key]}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
