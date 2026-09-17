import { useEffect, useState } from 'react';
import './SkillAssessmentStarting.css';

// ---------------------------------------------------------------------------
// "2. Starting..." interstitial - sits between the intro screen and the
// actual 12-question quiz (see AssessmentWizard.jsx). Purely a transition:
// it shows a short "preparing your assessment" checklist that ticks off
// over ~3 seconds, then calls `onDone` automatically so the wizard can move
// on to the questions screen. There's nothing to click here by design -
// matches the reference Figma state (page 20721, state "2. Starting...").
// ---------------------------------------------------------------------------

const STEPS = [
  { label: 'Loading your personalized questions', at: 0 },
  { label: 'Analyzing your profile', at: 1100 },
  { label: 'Setting up the assessment', at: 2200 },
];

const TOTAL_DURATION = 3000;

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.5l2.9 6.5 7.1.7-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7L2 9.7l7.1-.7z" />
  </svg>
);

/**
 * `onDone` fires once automatically, ~3s after mount, so the wizard can
 * move on to the questions screen.
 */
const SkillAssessmentStarting = ({ onDone, onExit }) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((step, index) =>
      setTimeout(() => setCompletedCount((c) => Math.max(c, index + 1)), step.at)
    );

    const start = Date.now();
    const raf = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / TOTAL_DURATION) * 100);
      setProgress(pct);
    }, 30);

    const finishTimer = setTimeout(() => {
      if (typeof onDone === 'function') onDone();
    }, TOTAL_DURATION);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(raf);
      clearTimeout(finishTimer);
    };
  }, [onDone]);

  return (
    <div className="assessment-starting-page">
      <div className="assessment-starting-topbar-loader" style={{ width: `${progress}%` }} />
      <header className="assessment-starting-topbar">
        <div className="assessment-topbar-brand">
          <span className="assessment-brand-badge">
            <CheckIcon />
          </span>
          SkillSpan
          <span className="assessment-topbar-divider" />
          <span className="assessment-topbar-title">Skill Assessment</span>
        </div>

        {typeof onExit === 'function' && (
          <button type="button" className="assessment-starting-exit" onClick={onExit}>
            Save &amp; Exit
          </button>
        )}
      </header>

      <div className="assessment-starting-body">
        <div className="assessment-starting-icon-wrap">
          <svg className="assessment-starting-ring" viewBox="0 0 120 120">
            <circle className="assessment-starting-ring-track" cx="60" cy="60" r="54" />
            <circle
              className="assessment-starting-ring-fill"
              cx="60"
              cy="60"
              r="54"
              style={{
                strokeDasharray: 2 * Math.PI * 54,
                strokeDashoffset: 2 * Math.PI * 54 * (1 - progress / 100),
              }}
            />
          </svg>
          <div className="assessment-starting-icon-box">
            <StarIcon />
          </div>
        </div>

        <h1 className="assessment-starting-title">Preparing your assessment.</h1>

        <div className="assessment-starting-checklist">
          {STEPS.map((step, index) => {
            const done = completedCount > index;
            const active = completedCount === index;
            return (
              <div
                key={step.label}
                className={`assessment-starting-item ${done ? 'done' : ''} ${active ? 'active' : ''}`}
              >
                <span className="assessment-starting-item-marker">
                  {done ? <CheckIcon /> : <span className="assessment-starting-spinner" />}
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

export default SkillAssessmentStarting;
