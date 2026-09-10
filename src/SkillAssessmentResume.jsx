import { useMemo } from 'react';
import { loadSavedAnswers, countAnswered } from './assessmentStorage';
import { SECTIONS, ALL_QUESTIONS, TOTAL_QUESTIONS, firstUnansweredIndex, countAnsweredInSection } from './assessmentQuestions';
import './SkillAssessmentResume.css';

// ---------------------------------------------------------------------------
// "8. Resume state" - "Continue Assessment". Shown at the assessment's
// index route instead of the intro screen whenever the learner has
// in-progress answers saved from a previous "Save & Exit" (see
// AssessmentWizard.jsx, which decides Intro vs. Resume by checking
// assessmentStorage.js). `onContinue` jumps straight into the questions
// screen, which itself resumes at the first unanswered question.
// `onStartOver` clears the saved answers and restarts from question 1.
// ---------------------------------------------------------------------------

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.2 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SkillAssessmentResume = ({ onContinue, onStartOver }) => {
  const answers = useMemo(() => loadSavedAnswers(), []);

  const answeredCount = countAnswered(answers);
  const remaining = TOTAL_QUESTIONS - answeredCount;
  const percent = Math.round((answeredCount / TOTAL_QUESTIONS) * 100);

  const nextIndex = firstUnansweredIndex(answers);
  const nextQuestion = ALL_QUESTIONS[nextIndex];

  const sectionsWithProgress = useMemo(
    () =>
      SECTIONS.map((s) => {
        const answeredInSection = countAnsweredInSection(s, answers);
        return { ...s, answeredInSection, complete: answeredInSection === s.questions.length };
      }),
    [answers]
  );

  return (
    <div className="assessment-resume-page">
      <header className="assessment-topbar">
        <div className="assessment-topbar-brand">
          <span className="assessment-brand-badge">
            <ClockIcon />
          </span>
          SkillSpan
          <span className="assessment-topbar-divider" />
          <span className="assessment-topbar-title">Skill Assessment</span>
        </div>
        <span className="assessment-topbar-meta assessment-resume-topbar-meta">
          Step 3 of 4: Assessment
        </span>
      </header>

      <div className="assessment-resume-body">
        <section className="assessment-resume-card assessment-resume-main">
          <div className="assessment-resume-icon-box">
            <ClockIcon />
          </div>

          <span className="assessment-resume-badge">
            <span className="assessment-resume-badge-dot" />
            Assessment In Progress
          </span>

          <h1 className="assessment-resume-title">Pick up where you left off</h1>
          <p className="assessment-resume-desc">
            You completed {answeredCount} of {TOTAL_QUESTIONS} questions. Your progress has been saved
            and is ready to continue.
          </p>

          <div className="assessment-resume-progress-row">
            <span>Progress saved</span>
            <strong>{percent}% complete</strong>
          </div>
          <div className="assessment-resume-progress-track">
            <div className="assessment-resume-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="assessment-resume-progress-meta">
            <span>{answeredCount} answered</span>
            <span>{remaining} remaining</span>
          </div>

          <button type="button" className="assessment-resume-continue" onClick={onContinue}>
            Continue Assessment <ChevronRightIcon />
          </button>
          <button type="button" className="assessment-resume-restart" onClick={onStartOver}>
            Start Over from the Beginning
          </button>
        </section>

        <section className="assessment-resume-card assessment-resume-sections">
          <div className="assessment-resume-card-title">Section Progress</div>

          <div className="assessment-resume-section-list">
            {sectionsWithProgress.map((s) => (
              <div key={s.key} className="assessment-resume-section">
                <span className={`assessment-resume-section-icon ${s.complete ? 'complete' : ''}`} />
                <div className="assessment-resume-section-info">
                  <div className="assessment-resume-section-row">
                    <span>{s.label}</span>
                    <span className={s.complete ? 'complete' : ''}>
                      {s.answeredInSection}/{s.questions.length}
                    </span>
                  </div>
                  <div className="assessment-resume-section-track">
                    <div
                      className={`assessment-resume-section-fill ${s.complete ? 'complete' : ''}`}
                      style={{ width: `${(s.answeredInSection / s.questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {nextQuestion && (
            <div className="assessment-resume-next">
              <div className="assessment-resume-next-eyebrow">Next Question</div>
              <p>{nextQuestion.prompt}</p>
              <span className="assessment-resume-next-tag">{nextQuestion.skill}</span>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default SkillAssessmentResume;
