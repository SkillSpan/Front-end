import { useLang } from '../lib/i18n.jsx'
import s from './CTAOrbit.module.css'

/**
 * Closing-section visual, deliberately different from the hero:
 * the student stands inside a glowing portal ring while the six journey
 * icons travel slowly around him on an orbit (tilted ellipse for depth).
 * Icons stay upright while the orbit turns. Pure CSS; reduced motion = still.
 */
const ICONS = [
  { key: 'assess', icon: 'target' },
  { key: 'learn', icon: 'cap' },
  { key: 'projects', icon: 'briefcase' },
  { key: 'mentor', icon: 'chat' },
  { key: 'readiness', icon: 'chart' },
  { key: 'hired', icon: 'check' },
]

export default function CTAOrbit() {
  const { t } = useLang()
  const sc = t.scene
  return (
    <div className={s.stage} aria-hidden="true">
      <span className={s.aura} />
      <span className={s.ringOuter} />
      <span className={s.ring} />
      <span className={s.ringDash} />
      <div className={s.orbit}>
        {ICONS.map((it, i) => (
          <div key={it.key} className={s.slot} style={{ '--a': `${i * 60}deg` }}>
            <div className={s.chip}>
              <img src={`/landing/assets/scene/icon-${it.icon}.webp`} alt="" width="200" height="200" decoding="async" loading="lazy" />
              <span>{sc.tiles[it.key]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={s.person}>
        <img src="/landing/assets/scene/character.webp" alt="" width="800" height="1000" loading="lazy" decoding="async" />
      </div>
    </div>
  )
}
