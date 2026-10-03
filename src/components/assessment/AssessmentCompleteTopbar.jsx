import './AssessmentCompleteTopbar.css';

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Shared top bar for the three screens that run after the last question is
// answered (Submitting -> Completion -> Results). Same dark brand chrome as
// the rest of the wizard, but the right side swaps the step tracker for a
// near-full progress strip + a green "Assessment Complete" check, since by
// this point the 12/12 questions are already done.
const AssessmentCompleteTopbar = () => (
  <header className="assessment-topbar assessment-complete-topbar">
    <div className="assessment-topbar-brand">
      <span className="assessment-brand-badge">
        <CheckIcon />
      </span>
      SkillSpan
      <span className="assessment-topbar-divider" />
      <span className="assessment-topbar-title">Skill Assessment</span>
    </div>

    <div className="assessment-complete-topbar-right">
      <div className="assessment-complete-topbar-track">
        <div className="assessment-complete-topbar-fill" />
      </div>
      <span className="assessment-complete-topbar-check">
        <CheckIcon /> Assessment Complete
      </span>
    </div>
  </header>
);

export default AssessmentCompleteTopbar;
