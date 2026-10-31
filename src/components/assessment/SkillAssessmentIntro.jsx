import './SkillAssessmentIntro.css';

// Mirrors the question set in SkillAssessment.jsx - kept as a small summary
// here so the intro screen and the actual quiz never drift apart on counts.
const CATEGORY_PREVIEW = [
  { label: 'Role-specific skills', detail: 'Questions match the career role you pick' },
  { label: 'Core concepts', detail: 'Short questions on each required skill' },
  { label: 'Instant scoring', detail: 'Your readiness % reflects your answers' },
];

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5l2.9 6.5 7.1.7-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.7l7.1-.7z" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v1H9V4z" />
    <path d="M9 11h6M9 15h6" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EXPECTATIONS = [
  'Choose the career role you are aiming for',
  'Answer questions on the skills that role requires',
  'See your readiness percentage based on how you answered',
  'Your results immediately initialize your Skill Matrix and unlock your roadmap',
  'Progress is auto-saved — exit any time and continue from where you left off',
];

/**
 * Landing screen for the Baseline Skill Assessment - sits between Profile
 * Setup and the 12-question quiz in the registration wizard
 * (see AssessmentWizard.jsx). Purely informational; `onStart` moves on to
 * the actual questions.
 */
const SkillAssessmentIntro = ({
  onStart,
  specializations = [],
  specializationsProblem = '',
  specializationId = '',
  onSpecializationChange,
  rolesLoading = false,
  careerRoles = [],
  careerRoleId = '',
  onCareerRoleChange,
  startError = '',
  starting = false,
}) => {
  // When the specializations list is unavailable the picker is hidden and
  // the career role list is the unfiltered one (see AssessmentWizard.jsx).
  const hasSpecializations = specializations.length > 0;
  const needsSpecialization = hasSpecializations && !specializationId;
  return (
    <div className="assessment-intro-page">
      <header className="assessment-topbar">
        <div className="assessment-topbar-brand">
          <span className="assessment-brand-badge">
            <img src="/image/logo.png" alt="" />
          </span>
          SkillSpan
          <span className="assessment-topbar-divider" />
          <span className="assessment-topbar-title">Skill Assessment</span>
        </div>

        <span className="assessment-topbar-meta" style={{ marginLeft: 'auto' }}>Step 3 of 4: Assessment</span>
      </header>

      <div className="assessment-intro-body">
        <aside className="assessment-intro-sidebar">
          <div className="assessment-intro-icon-wrap">
            <span className="assessment-intro-icon-tag">Role-based</span>
            <div className="assessment-intro-icon-box">
              <StarIcon />
            </div>
            <span className="assessment-intro-icon-time">~10 minutes</span>
          </div>

          <h2 className="assessment-intro-heading">Baseline Skill Assessment</h2>
          <p className="assessment-intro-subtext">
            Your responses build the foundation of a personalized career roadmap and Skill Matrix.
          </p>

          <ul className="assessment-intro-categories">
            {CATEGORY_PREVIEW.map((cat) => (
              <li key={cat.label} className="assessment-intro-category">
                <div>
                  <strong>{cat.label}</strong>
                  <span>{cat.detail}</span>
                </div>
                <ChevronRightIcon />
              </li>
            ))}
          </ul>
        </aside>

        <main className="assessment-intro-main">
          <span className="assessment-intro-eyebrow">
            <span className="assessment-intro-eyebrow-dot" />
            US-ASM-01 · Baseline Assessment
          </span>

          <h1 className="assessment-intro-title">Ready to measure your starting point?</h1>
          <p className="assessment-intro-desc">
            This short assessment helps SkillSpan understand your current skill levels and career
            goals — so we can build a roadmap that's truly tailored to you.
          </p>

          <div className="assessment-intro-stats">
            <div className="assessment-intro-stat">
              <ClockIcon />
              <strong>~10 min</strong>
              <span>Estimated time</span>
            </div>
            <div className="assessment-intro-stat">
              <ClipboardIcon />
              <strong>Tailored</strong>
              <span>Questions for your chosen role</span>
            </div>
            <div className="assessment-intro-stat">
              <LockIcon />
              <strong>Private</strong>
              <span>Only you see results</span>
            </div>
          </div>

          <div className="assessment-intro-expect-card">
            <h3>What to expect</h3>
            <ul>
              {EXPECTATIONS.map((item) => (
                <li key={item}>
                  <span className="assessment-intro-expect-dot" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {!hasSpecializations && specializationsProblem && (
            <p role="status" className="assessment-career-role-status">
              {specializationsProblem} Showing all career roles instead.
            </p>
          )}

          {hasSpecializations && (
            <div className="assessment-career-role-picker">
              <label htmlFor="assessment-specialization" className="assessment-career-role-label">
                Specialization <span className="assessment-career-role-required">*</span>
              </label>
              <div className="assessment-career-role-select-wrap">
                <select
                  id="assessment-specialization"
                  className={`assessment-career-role-select ${specializationId ? 'has-value' : ''}`}
                  value={specializationId}
                  onChange={(event) => onSpecializationChange?.(event.target.value)}
                >
                  <option value="">Select your specialization</option>
                  {specializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name ?? spec.title ?? `Specialization ${spec.id}`}
                    </option>
                  ))}
                </select>
                <span className="assessment-career-role-chevron" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          <div className="assessment-career-role-picker">
            <label htmlFor="assessment-career-role" className="assessment-career-role-label">
              Career role <span className="assessment-career-role-required">*</span>
            </label>
            <div className="assessment-career-role-select-wrap">
              <select
                id="assessment-career-role"
                className={`assessment-career-role-select ${careerRoleId ? 'has-value' : ''}`}
                value={careerRoleId}
                onChange={(event) => onCareerRoleChange?.(event.target.value)}
                aria-invalid={!!startError}
                disabled={needsSpecialization || rolesLoading}
              >
                <option value="">
                  {needsSpecialization ? 'Select a specialization first' : rolesLoading ? 'Loading career roles…' : 'Select your career role'}
                </option>
                {careerRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title ?? role.name ?? role.role_title ?? `Role ${role.id}`}
                  </option>
                ))}
              </select>
              <span className="assessment-career-role-chevron" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <p className="assessment-career-role-hint">
              Your questions are tailored to the role you choose.
            </p>
            {!needsSpecialization && !rolesLoading && careerRoles.length === 0 && (
              <p role="status" className="assessment-career-role-status">
                {hasSpecializations
                  ? 'No career roles are available for this specialization yet.'
                  : 'No career roles loaded. Check your login and API connection.'}
              </p>
            )}
            {startError && (
              <p role="alert" className="assessment-career-role-error">{startError}</p>
            )}
          </div>
          <button
            type="button"
            className="assessment-intro-start"
            onClick={onStart}
            disabled={starting || needsSpecialization || !careerRoleId}
          >
            {starting ? 'Preparing your questions...' : 'Start Assessment'}
            {!starting && <ChevronRightIcon />}
          </button>
          <p className="assessment-intro-autosave">
            Your progress is saved automatically — you can exit and resume at any time
          </p>
        </main>
      </div>
    </div>
  );
};

export default SkillAssessmentIntro;