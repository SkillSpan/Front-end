import { useMemo, useState, useEffect, useRef } from 'react';
import './SkillAssessment.css';
import { loadSavedAnswers, saveAnswers } from './assessmentStorage';
import { autosaveBaselineAssessment } from './api';
import {
  RATING_LEVELS,
  LEVEL_ACCENT,
  SECTIONS,
  ALL_QUESTIONS,
  TOTAL_QUESTIONS,
  firstUnansweredIndex,
} from './assessmentQuestions';

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------
// The actual 12-question bank lives in assessmentQuestions.js so the
// Resume/Completion/Results screens can share it without pulling in this
// whole component. Answers are kept in memory + mirrored to sessionStorage
// (assessmentStorage.js) purely so a learner who accidentally reloads
// mid-quiz doesn't lose their place, and (when a backend attempt id is
// available - see the `assessmentId` prop below) also autosaved to
// PATCH /api/v1/baseline-assessments/{assessment} (see api.js). Nothing
// here is sensitive, so sessionStorage is fine (unlike the wizard's
// account/password data, which deliberately avoids storage - see
// RegisterWizard.jsx).

// ---------------------------------------------------------------------------
// Small icons
// ---------------------------------------------------------------------------

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.45.9 1.1.9 1.8v.3h5.2v-.3c0-.7.3-1.35.9-1.8A6 6 0 0012 3z" />
  </svg>
);

/**
 * The 12-question Baseline Skill Assessment. Sits after the intro screen
 * (SkillAssessmentIntro.jsx) in AssessmentWizard.jsx.
 *
 * `onComplete()` fires once the last question is answered and submitted.
 * `onExit()` fires from "Save & Exit" - answers already live in
 * sessionStorage by that point, so this is safe to call immediately.
 * `assessmentId` (optional) is the backend attempt id from
 * POST /api/v1/baseline-assessments (see AssessmentWizard.jsx). When
 * present, every answer change is also mirrored to the backend via
 * PATCH /api/v1/baseline-assessments/{assessment} (autosave), debounced so
 * typing in the free-text "target role" question doesn't fire a request
 * per keystroke. When absent (offline, or the create call failed), this
 * component behaves exactly as it did before the endpoint existed -
 * sessionStorage only.
 */
const SkillAssessment = ({ assessmentId, onComplete, onExit }) => {
  const [answers, setAnswers] = useState(loadSavedAnswers);
  const [currentIndex, setCurrentIndex] = useState(() => firstUnansweredIndex(loadSavedAnswers()));
  const [submitting, setSubmitting] = useState(false);
  const autosaveTimer = useRef(null);

  useEffect(() => {
    saveAnswers(answers);

    if (!assessmentId) return undefined;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      autosaveBaselineAssessment(assessmentId, { answers }).catch(() => {
        // Best effort - sessionStorage above already has the source of
        // truth for resuming locally; a missed autosave call just means
        // the final submit (see AssessmentWizard.jsx) sends the full
        // answer set anyway.
      });
    }, 500);

    return () => clearTimeout(autosaveTimer.current);
  }, [answers, assessmentId]);

  const question = ALL_QUESTIONS[currentIndex];
  const section = SECTIONS.find((s) => s.key === question.sectionKey);
  const questionNumber = currentIndex + 1;
  const overallPct = Math.round((questionNumber / TOTAL_QUESTIONS) * 100);
  const answeredCount = Object.keys(answers).filter((id) => answers[id] !== undefined && answers[id] !== '')
    .length;

  const sectionQuestionIndex = section.questions.findIndex((q) => q.id === question.id);

  const currentAnswer = answers[question.id];
  const hasAnswer = currentAnswer !== undefined && currentAnswer !== '';
  const isLastQuestion = currentIndex === TOTAL_QUESTIONS - 1;

  const setAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const goPrevious = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const goNext = async () => {
    if (!hasAnswer) return;
    if (isLastQuestion) {
      setSubmitting(true);
      try {
        if (typeof onComplete === 'function') onComplete(answers);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  // Which sidebar sections are "unlocked" for the small progress markers -
  // every section is visible, but we only mark a skill as answered/current
  // once we've actually reached it, same as the reference design.
  const sectionsWithProgress = useMemo(
    () =>
      SECTIONS.map((s) => {
        const answeredInSection = s.questions.filter(
          (q) => answers[q.id] !== undefined && answers[q.id] !== ''
        ).length;
        return { ...s, answeredInSection };
      }),
    [answers]
  );

  return (
    <div className="skill-assessment-page">
      <header className="sa-topbar">
        <div className="sa-topbar-brand">
          <span className="assessment-brand-badge">
            <CheckIcon />
          </span>
          SkillSpan
          <span className="sa-topbar-divider" />
          <span className="sa-topbar-title">Skill Assessment</span>
        </div>

        <div className="sa-topbar-progress">
          <span>
            Question {questionNumber} of {TOTAL_QUESTIONS}
          </span>
          <div className="sa-topbar-progress-track">
            <div className="sa-topbar-progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <span className="sa-topbar-pct">{overallPct}%</span>
        </div>

        <button type="button" className="sa-save-exit" onClick={onExit}>
          <ChevronLeftIcon /> Save &amp; Exit
        </button>
      </header>

      <div className="sa-body">
        {/* --------------------------- Left sidebar --------------------------- */}
        <aside className="sa-sidebar">
          <div className="sa-sidebar-title">Assessment Progress</div>

          {sectionsWithProgress.map((s) => {
            const isActiveSection = s.key === question.sectionKey;
            return (
              <div key={s.key} className="sa-sidebar-section">
                <div className={`sa-sidebar-section-header ${isActiveSection ? 'active' : ''}`}>
                  <span>{s.label}</span>
                  <span className="sa-sidebar-section-count">
                    {s.answeredInSection}/{s.questions.length} answered
                  </span>
                </div>
                <ul className="sa-sidebar-skill-list">
                  {s.questions.map((q) => {
                    const answered = answers[q.id] !== undefined && answers[q.id] !== '';
                    const isCurrent = q.id === question.id;
                    return (
                      <li
                        key={q.id}
                        className={`sa-sidebar-skill ${answered ? 'answered' : ''} ${
                          isCurrent ? 'current' : ''
                        }`}
                      >
                        <span className="sa-sidebar-skill-marker">
                          {answered ? <CheckIcon /> : null}
                        </span>
                        {q.skill}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          <div className="sa-sidebar-footer">
            <div className="sa-sidebar-footer-row">
              <span>Overall Progress</span>
              <strong>{overallPct}%</strong>
            </div>
            <div className="sa-sidebar-progress-track">
              <div className="sa-sidebar-progress-fill" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="sa-sidebar-footer-sub">
              {answeredCount} of {TOTAL_QUESTIONS} answered
            </span>
          </div>
        </aside>

        {/* ------------------------------ Center ------------------------------ */}
        <main className="sa-main">
          <div className="sa-question-header">
            <span>
              {section.label} <span className="sa-question-header-q">Q{questionNumber}</span>
            </span>
            <span>
              {questionNumber} / {TOTAL_QUESTIONS}
            </span>
          </div>
          <div className="sa-question-header-track">
            <div
              className="sa-question-header-fill"
              style={{ width: `${((sectionQuestionIndex + 1) / section.questions.length) * 100}%` }}
            />
          </div>

          <div className="sa-question-card">
            <div className="sa-question-tags">
              <span className="sa-tag">{question.skill}</span>
              <span className="sa-tag sa-tag-required">Required</span>
            </div>

            <h2 className="sa-question-prompt">{question.prompt}</h2>

            {question.type === 'rating' && (
              <div className="sa-options">
                {RATING_LEVELS.map((level) => {
                  const selected = currentAnswer === level.value;
                  return (
                    <button
                      type="button"
                      key={level.value}
                      className={`sa-option ${selected ? 'selected' : ''}`}
                      style={selected ? { borderColor: LEVEL_ACCENT[level.value] } : undefined}
                      onClick={() => setAnswer(level.value)}
                    >
                      <span
                        className="sa-option-number"
                        style={selected ? { background: LEVEL_ACCENT[level.value], color: '#fff' } : undefined}
                      >
                        {level.value}
                      </span>
                      <span className="sa-option-text">
                        <strong>{level.label}</strong>
                        <span>{level.desc}</span>
                      </span>
                      <span
                        className={`sa-option-radio ${selected ? 'checked' : ''}`}
                        style={selected ? { borderColor: LEVEL_ACCENT[level.value] } : undefined}
                      >
                        {selected && (
                          <span
                            className="sa-option-radio-dot"
                            style={{ background: LEVEL_ACCENT[level.value] }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === 'choice' && (
              <div className="sa-options sa-options-plain">
                {question.options.map((option) => {
                  const selected = currentAnswer === option;
                  return (
                    <button
                      type="button"
                      key={option}
                      className={`sa-option sa-option-plain ${selected ? 'selected' : ''}`}
                      onClick={() => setAnswer(option)}
                    >
                      <span className={`sa-option-radio ${selected ? 'checked' : ''}`}>
                        {selected && <span className="sa-option-radio-dot" />}
                      </span>
                      <span className="sa-option-text">
                        <strong>{option}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {question.type === 'text' && (
              <div className="sa-text-field">
                <input
                  type="text"
                  value={currentAnswer || ''}
                  placeholder={question.placeholder}
                  onChange={(e) => setAnswer(e.target.value)}
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="sa-nav">
            <button
              type="button"
              className="sa-nav-prev"
              onClick={goPrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeftIcon /> Previous
            </button>

            <div className="sa-nav-dots">
              {ALL_QUESTIONS.map((q, i) => {
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = i === currentIndex;
                return (
                  <span
                    key={q.id}
                    className={`sa-nav-dot ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}
                  />
                );
              })}
            </div>

            <button type="button" className="sa-nav-next" onClick={goNext} disabled={!hasAnswer || submitting}>
              {isLastQuestion ? (submitting ? 'Submitting...' : 'Finish Assessment') : 'Next Question'}
              {!isLastQuestion && <ChevronRightIcon />}
            </button>
          </div>
        </main>

        {/* ------------------------------ Right --------------------------------*/}
        <aside className="sa-context">
          <div className="sa-context-box">
            <div className="sa-context-title">Skill Context</div>
            <strong>{question.skill}</strong>
            <p>
              {question.type === 'rating'
                ? 'Rate your current proficiency level honestly. There are no wrong answers — this helps us calibrate your roadmap accurately.'
                : question.type === 'text'
                ? 'Type in your own words - there is no fixed list, and you can always update this later from your profile.'
                : 'Pick whichever option best matches your current experience. There are no wrong answers here.'}
            </p>
          </div>

          {question.type === 'rating' && (
            <div className="sa-context-box">
              <div className="sa-context-title">Level Guide</div>
              <ul className="sa-level-guide">
                {RATING_LEVELS.map((level) => (
                  <li key={level.value}>
                    <span className="sa-level-guide-num" style={{ background: LEVEL_ACCENT[level.value] }}>
                      {level.value}
                    </span>
                    <span>
                      <strong>{level.label}</strong>
                      <span>{level.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="sa-context-box">
            <div className="sa-context-title">{section.label}</div>
            <ul className="sa-context-skill-list">
              {section.questions.map((q) => {
                const answered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = q.id === question.id;
                return (
                  <li key={q.id} className={`${answered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`}>
                    {answered && <CheckIcon />}
                    {q.skill}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="sa-tip-box">
            <BulbIcon />
            <div>
              <strong>Tip</strong>
              <p>
                Be honest with your self-assessment. Overestimating slows your growth — accurate
                answers lead to a better-fit roadmap.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SkillAssessment;
