import React from 'react'
import s from './Features.module.css'

/** Small animated product moments, one per feature. Base styles are the finished state
    (so ?static=1 and reduced-motion show a complete picture); CSS loops add the life. */
export default function FeatureVisual({ k, demo }) {
  switch (k) {
    case 'assess':
      return (
        <div className={s.vAssess}>
          {demo.assessSkills.map((sk, i) => (
            <div key={sk} className={s.skill}>
              <span>{sk}</span>
              <div className={s.track}><i style={{ '--w': [78, 54, 66][i] + '%', animationDelay: i * 0.25 + 's' }} /></div>
              <b>{[78, 54, 66][i]}</b>
            </div>
          ))}
        </div>
      )
    case 'readiness':
      return (
        <div className={s.vReady}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="50" className={s.ringBg} />
            <circle cx="60" cy="60" r="50" className={s.ring} />
          </svg>
          <div className={s.readyNum}><strong>67</strong><small>/100</small></div>
          <span className={s.readyLabel}>{demo.readinessLabel}</span>
        </div>
      )
    case 'roadmap':
      return (
        <div className={s.vRoad}>
          <div className={s.roadLine}><i /></div>
          {demo.phases.map((ph, i) => (
            <div key={ph} className={`${s.phase} ${i < 2 ? s.done : ''}`} style={{ '--i': i }}>
              <span className={s.pdot} />
              <small>{ph}</small>
            </div>
          ))}
        </div>
      )
    case 'projects':
      return (
        <div className={s.vProj}>
          {demo.projects.map((p, i) => (
            <div key={p.t} className={s.projCard} style={{ '--i': i }}>
              <span className={s.projIcon}>{['▦', '◎', '▤'][i]}</span>
              <div><b>{p.t}</b><small>{p.c}</small></div>
            </div>
          ))}
        </div>
      )
    case 'simulation':
      return (
        <div className={s.vSim} dir="ltr">
          <div className={s.simBar}><i /><i /><i /><span>scenario.sim</span></div>
          {demo.simLines.map((l, i) => (
            <p key={i} className={i === 2 ? s.simOk : ''} style={{ '--i': i }}>{l}</p>
          ))}
          <span className={s.caret} />
        </div>
      )
    case 'mentor':
      return (
        <div className={s.vMentor}>
          <div className={s.avatars}><span>M</span><span>L</span></div>
          <div className={s.bubble}>{demo.mentorMsg}</div>
        </div>
      )
    case 'ai':
      return (
        <div className={s.vAi}>
          <div className={`${s.msg} ${s.me}`}>{demo.aiQ}</div>
          <div className={`${s.msg} ${s.bot}`}>
            <span className={s.spark}>✦</span>
            <span className={s.typing}><i /><i /><i /></span>
            <span className={s.answer}>{demo.aiA}</span>
          </div>
        </div>
      )
    case 'talent':
      return (
        <div className={s.vTalent}>
          <div className={s.profile}>
            <span className={s.pAvatar} />
            <div><b className={s.pLine} /><b className={s.pLine2} /></div>
            <span className={s.match}><strong>94%</strong> {demo.talentMatch}</span>
          </div>
          <div className={s.arrows} aria-hidden="true"><i /><i /><i /></div>
          <div className={s.companies}>
            {['A', 'B', 'C'].map((c, i) => <span key={c} style={{ '--i': i }}>{c}</span>)}
          </div>
          <small className={s.talentLine}>{demo.talentLine}</small>
        </div>
      )
    default:
      return null
  }
}
