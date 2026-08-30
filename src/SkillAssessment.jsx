import { useMemo, useState, useEffect } from 'react';
import './SkillAssessment.css';

// ---------------------------------------------------------------------------
// Question bank
// ---------------------------------------------------------------------------
// 12 questions across 4 skill areas, matching the count promised on the
// intro screen (SkillAssessmentIntro.jsx). Two question shapes are used:
//  - "rating": the 0-4 proficiency scale (No Experience -> Advanced)
//  - "choice": a short list of plain-language options, for things that
//    don't map cleanly onto a proficiency number (REST API exposure,
//    teamwork, communication, timeline)
//  - "text": a single free-text answer (target role)
// There's no assessment endpoint on the backend yet (see api.js - only
// /api/v1/profile exists so far), so answers are kept in memory + mirrored
// to sessionStorage purely so a learner who accidentally reloads mid-quiz
// doesn't lose their place. Nothing here is sensitive, so sessionStorage is
// fine (unlike the wizard's account/password data, which deliberately
// avoids storage - see RegisterWizard.jsx).

const RATING_LEVELS = [
  { value: 0, label: 'No Experience', desc: "Haven't worked with this yet" },
  { value: 1, label: 'Beginner', desc: 'Tutorials, basic awareness' },
  { value: 2, label: 'Developing', desc: 'Small projects with guidance' },
  { value: 3, label: 'Intermediate', desc: 'Build independently, comfortable' },
  { value: 4, label: 'Advanced', desc: 'Complex solutions, can mentor' },
];

const LEVEL_ACCENT = ['#64748b', '#f59e0b', '#fb923c', '#3b82f6', '#8b5cf6'];

const SECTIONS = [
  {
    key: 'programming',
    label: 'Programming',
    questions: [
      {
        id: 'python',
        skill: 'Python',
        type: 'rating',
        prompt: 'How would you rate your Python programming proficiency?',
      },
      {
        id: 'javascript',
        skill: 'JavaScript',
        type: 'rating',
        prompt: 'How would you rate your JavaScript proficiency?',
      },
      {
        id: 'sql',
        skill: 'SQL',
        type: 'rating',
        prompt: 'How would you rate your SQL and database querying skills?',
      },
      {
        id: 'typescript',
        skill: 'TypeScript',
        type: 'rating',
        prompt: 'How would you rate your TypeScript proficiency?',
      },
    ],
  },
  {
    key: 'web',
    label: 'Web Development',
    questions: [
      {
        id: 'react',
        skill: 'React',
        type: 'rating',
        prompt: 'How would you rate your experience with React or similar frontend frameworks?',
      },
      {
        id: 'restApis',
        skill: 'REST APIs',
        type: 'choice',
        prompt: 'Which best describes your REST API experience?',
        options: [
          "Haven't worked with REST APIs yet",
          'Followed tutorials to consume APIs',
          'Built REST APIs in personal projects',
          'Built REST APIs in team or real-world projects',
        ],
      },
    ],
  },
  {
    key: 'data',
    label: 'Data & Analytics',
    questions: [
      {
        id: 'pythonData',
        skill: 'Python Data',
        type: 'rating',
        prompt: 'How would you rate your experience with data tools like Pandas and NumPy?',
      },
      {
        id: 'visualization',
        skill: 'Visualization',
        type: 'rating',
        prompt: 'How would you rate your ability to build charts and data visualizations?',
      },
    ],
  },
  {
    key: 'background',
    label: 'Background',
    questions: [
      {
        id: 'collaboration',
        skill: 'Collaboration',
        type: 'choice',
        prompt: 'How would you describe your experience working in a team?',
        options: [
          'Mostly worked solo so far',
          'Some group work in coursework',
          'Regular collaboration on team projects',
          'Led or coordinated a team before',
        ],
      },
      {
        id: 'communication',
        skill: 'Communication',
        type: 'choice',
        prompt: 'How comfortable are you presenting or explaining technical work?',
        options: [
          'Prefer not to present',
          'Can present with preparation',
          'Comfortable presenting to peers',
          'Confident presenting to any audience',
        ],
      },
    ],
  },
  {
    key: 'career',
    label: 'Career Goals',
    questions: [
      {
        id: 'targetRole',
        skill: 'Target Role',
        type: 'text',
        prompt: "What's your target role after graduation?",
        placeholder: 'e.g. Frontend Developer, Data Analyst, QA Engineer...',
      },
      {
        id: 'timeline',
        skill: 'Timeline',
        type: 'choice',
        prompt: 'How soon are you aiming to land this role?',
        options: ['Within 3 months', '3–6 months', '6–12 months', 'More than a year'],
      },
    ],
  },
];

const ALL_QUESTIONS = SECTIONS.flatMap((section) =>
  section.questions.map((q) => ({ ...q, sectionKey: section.key, sectionLabel: section.label }))
);
const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

const STORAGE_KEY = 'skillspan_assessment_answers';

const loadSavedAnswers = () => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

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
 */
const SkillAssessment = ({ onComplete, onExit }) => {
  const [answers, setAnswers] = useState(loadSavedAnswers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Best effort only - losing autosave shouldn't block the quiz.
    }
  }, [answers]);

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
