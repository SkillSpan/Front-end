import { useNavigate } from 'react-router-dom';
import './RoleChoice.css';

// Entry point for BOTH sign-up flows.
//
// /get-started is the only place that asks "student or company?". Every
// "Create an account" link (login page, company login) points here instead of
// straight at /register or /company/register, so a company never lands in the
// student wizard by accident. Each button hands off to the wizard that already
// exists - this screen owns no state and creates nothing on the backend.

const StudentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 10L12 5 2 10l10 5 10-5z" />
    <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
  </svg>
);

const CompanyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="8" width="18" height="13" rx="1.5" />
    <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
    <path d="M3 13h18" />
  </svg>
);

const ROLES = [
  {
    id: 'student',
    title: "I'm a student",
    desc: 'Build a verified record, follow your roadmap, and apply to real projects.',
    points: ['Free during the MVP', 'Verified by real companies'],
    cta: 'Continue as student',
    to: '/register/account',
    Icon: StudentIcon,
  },
  {
    id: 'company',
    title: "I'm a company",
    desc: 'Post projects, review verified talent, and track every application.',
    points: ['Post projects in minutes', 'Shortlist from real evidence'],
    cta: 'Continue as company',
    to: '/company/register/account',
    Icon: CompanyIcon,
  },
];

export default function RoleChoice() {
  const navigate = useNavigate();

  return (
    <div className="rc-page">
      <div className="rc-brand">
        <span className="rc-logo">
          <img src="/image/logo.png" alt="" />
        </span>
        <span className="rc-wordmark">SkillSpan</span>
      </div>

      <button type="button" className="rc-signin" onClick={() => navigate('/login')}>
        <span className="rc-signin__label">Already have an account? </span>
        <span>Log in</span>
      </button>

      <div className="rc-halves">
        {ROLES.map(({ id, title, desc, points, cta, to, Icon }) => (
          <section key={id} className={`rc-half rc-half--${id}`}>
            <div className="rc-body">
              <span className="rc-icon">
                <Icon />
              </span>

              <h1 className="rc-title">{title}</h1>
              <p className="rc-desc">{desc}</p>

              <ul className="rc-points">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>

              <button type="button" className="rc-cta" onClick={() => navigate(to)}>
                {cta}
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
