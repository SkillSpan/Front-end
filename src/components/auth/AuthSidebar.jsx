import targetIcon from '../../assets/icons/icon-target.png'
import logoMark from '../../assets/icons/logo-mark.png'
import briefcaseIcon from '../../assets/icons/icon-briefcase.png'
import { MedalIcon } from './icons'

const FEATURES = [
  { icon: targetIcon, label: 'Assess your real readiness' },
  { icon: logoMark, label: 'A roadmap built for you' },
  { icon: briefcaseIcon, label: 'Real projects from companies' },
  { icon: null, label: 'A verified professional record' }, // uses MedalIcon below
]

export default function AuthSidebar() {
  return (
    <aside className="relative hidden w-full max-w-[420px] shrink-0 overflow-hidden rounded-r-[48px] bg-navy-950 px-10 py-14 text-white sm:block">
      <a href="/" className="text-2xl font-extrabold">
        SkillSpan
      </a>

      <h2 className="mt-16 text-4xl font-extrabold leading-tight">
        Start Your
        <br />
        Career Journey
      </h2>

      <p className="mt-6 max-w-xs text-ice/70">
        From education to your first opportunity — in clear, verified steps
      </p>

      <ul className="mt-24 flex flex-col gap-6">
        {FEATURES.map((f) => (
          <li key={f.label} className="flex items-center gap-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center text-amber">
              {f.icon ? (
                <img src={f.icon} alt="" className="h-9 w-9 object-contain" />
              ) : (
                <MedalIcon className="h-8 w-8" />
              )}
            </span>
            <span className="text-sm font-semibold text-ice/90">{f.label}</span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
