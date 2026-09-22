import AssessmentCompleteTopbar from './AssessmentCompleteTopbar';
import { useAuth } from './AuthContext';
import { SECTIONS, RATED_QUESTIONS, TOTAL_QUESTIONS } from './assessmentQuestions';
import './SkillAssessmentCompletion.css';

// ---------------------------------------------------------------------------
// "10. Completion" - shown right after SkillAssessmentSubmitting.jsx
// finishes. Congratulates the learner and previews what just unlocked
// platform-wide; `onViewProfile` moves on to the Results screen
// (SkillAssessmentResults.jsx).
// ---------------------------------------------------------------------------

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 2.5l2.9 6.5 7.1.7-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.7l7.1-.7z" strokeLinejoin="round" />
  </svg>
);

const FlagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 21V4M5 4h13l-2.5 3.5L18 11H5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 018 0v3" strokeLinecap="round" />
  </svg>
);

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M5 20V10M12 20V4M19 20v-7" strokeLinecap="round" />
  </svg>
);

const RoadmapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="6" cy="6" r="2.4" />
    <circle cx="18" cy="6" r="2.4" />
    <circle cx="12" cy="18" r="2.4" />
    <path d="M8 7.3L11 16M16 7.3L13 16M8.4 6h7.2" strokeLinecap="round" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="4" y="4" width="7" height="7" rx="1.4" />
    <rect x="13" y="4" width="7" height="7" rx="1.4" />
    <rect x="4" y="13" width="7" height="7" rx="1.4" />
    <rect x="13" y="13" width="7" height="7" rx="1.4" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 11h6M9 15h6" strokeLinecap="round" />
  </svg>
);

const UNLOCKS = [
  {
    icon: <ChartIcon />,
    color: 'blue',
    title: 'Skill Matrix',
    desc: 'Your initial skill levels are set across all assessed areas',
  },
  {
    icon: <RoadmapIcon />,
    color: 'purple',
    title: 'Career Roadmap',
    desc: 'A personalized 4-phase roadmap to your target role',
  },
  {
    icon: <GridIcon />,
    color: 'green',
    title: 'Project Marketplace',
    desc: 'Browse and apply to real and simulated industry projects',
  },
  {
    icon: <DocumentIcon />,
    color: 'orange',
    title: 'Professional Record',
    desc: 'Your verified skills and project history, visible to companies',
  },
];

const SECTIONS_COMPLETE = `${SECTIONS.length}/${SECTIONS.length}`;
const SKILLS_MAPPED = RATED_QUESTIONS.length;

/** `onViewProfile` moves on to the Results screen. */
const SkillAssessmentCompletion = ({ onViewProfile }) => {
  const { authUser } = useAuth();
  const firstName = authUser?.name?.trim().split(/\s+/)[0] || 'there';

  return (
    <div className="assessment-completion-page">
      <AssessmentCompleteTopbar />

      <div className="assessment-completion-body">
        <section className="assessment-completion-card">
          <div className="assessment-completion-check">
            <CheckIcon />
          </div>

          <span className="assessment-completion-badge">
            <span className="assessment-completion-badge-dot" />
            Assessment Complete
          </span>

          <h1 className="assessment-completion-title">Great work, {firstName}!</h1>
          <p className="assessment-completion-desc">
            Your baseline skill assessment is complete. We're now initializing your personalized
            Skill Matrix and building your career roadmap.
          </p>

          <div className="assessment-completion-stats">
            <div className="assessment-completion-stat">
              <span className="assessment-completion-stat-icon">
                <CheckIcon />
              </span>
              <strong>
                {TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}
              </strong>
              <span>Questions</span>
            </div>
            <div className="assessment-completion-stat">
              <span className="assessment-completion-stat-icon">
                <StarIcon />
              </span>
              <strong>{SKILLS_MAPPED}</strong>
              <span>Skills Mapped</span>
            </div>
            <div className="assessment-completion-stat">
              <span className="assessment-completion-stat-icon">
                <FlagIcon />
              </span>
              <strong>{SECTIONS_COMPLETE}</strong>
              <span>Sections</span>
            </div>
          </div>

          <button type="button" className="assessment-completion-cta" onClick={onViewProfile}>
            View My Skill Profile
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="assessment-completion-card">
          <h2 className="assessment-completion-unlock-title">
            What's now unlocked <LockIcon />
          </h2>
          <p className="assessment-completion-unlock-desc">
            Completing this assessment unlocks the full platform experience.
          </p>

          <ul className="assessment-completion-unlock-list">
            {UNLOCKS.map((item) => (
              <li key={item.title}>
                <span className={`assessment-completion-unlock-icon ${item.color}`}>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="assessment-completion-note">
            <strong>⚡ AC-10 · Module Unlocking</strong>
            <p>
              As per business rule BR-09, all subsequent platform modules are now unlocked following
              successful assessment completion.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SkillAssessmentCompletion;
