import { useEffect, useState } from 'react';
import AssessmentCompleteTopbar from './AssessmentCompleteTopbar';
import './SkillAssessmentSubmitting.css';

// ---------------------------------------------------------------------------
// "9. Submitting" - runs right after the last question is answered (see
// SkillAssessment.jsx's onComplete -> AssessmentWizard.jsx). Purely a
// transition, same shape as SkillAssessmentStarting.jsx: a checklist ticks
// off on a timer, then `onDone` fires automatically and the wizard moves on
// to the Completion screen.
// ---------------------------------------------------------------------------

const STEPS = [
  { label: 'Validating your responses', at: 0 },
  { label: 'Analyzing skill signals', at: 600 },
  { label: 'Mapping to Skill Matrix', at: 1200 },
  { label: 'Generating your roadmap', at: 1800 },
  { label: 'Storing your results', at: 2400 },
];

const TOTAL_DURATION = 3000;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4a1 1 0 011-1h4a1 1 0 011 1v1H9V4z" />
    <path d="M9 11h6M9 15h6" strokeLinecap="round" />
  </svg>
);

/** `onDone` fires once automatically, ~3s after mount. */
const SkillAssessmentSubmitting = ({ onDone }) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((step, index) =>
      setTimeout(() => setCompletedCount((c) => Math.max(c, index + 1)), step.at)
    );

    const start = Date.now();
    const tick = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / TOTAL_DURATION) * 100));
    }, 30);

    const finishTimer = setTimeout(() => {
      if (typeof onDone === 'function') onDone();
    }, TOTAL_DURATION);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(tick);
      clearTimeout(finishTimer);
    };
  }, [onDone]);

  return (
    <div className="assessment-submitting-page">
      <AssessmentCompleteTopbar />

      <div className="assessment-submitting-body">
        <div className="assessment-submitting-icon-wrap">
          <svg className="assessment-submitting-ring" viewBox="0 0 120 120">
            <circle className="assessment-submitting-ring-track" cx="60" cy="60" r="54" />
            <circle
              className="assessment-submitting-ring-fill"
              cx="60"
              cy="60"
              r="54"
              style={{
                strokeDasharray: 2 * Math.PI * 54,
                strokeDashoffset: 2 * Math.PI * 54 * (1 - progress / 100),
              }}
            />
          </svg>
          <div className="assessment-submitting-icon-box">
            <DocumentIcon />
          </div>
        </div>

        <h1 className="assessment-submitting-title">Submitting Assessment</h1>
        <p className="assessment-submitting-subtitle">Processing your responses...</p>

        <div className="assessment-submitting-checklist">
          {STEPS.map((step, index) => {
            const done = completedCount > index;
            const active = completedCount === index;
            return (
              <div
                key={step.label}
                className={`assessment-submitting-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              >
                <span className="assessment-submitting-item-marker">
                  {done ? <CheckIcon /> : <span className="assessment-submitting-dot" />}
                </span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillAssessmentSubmitting;
