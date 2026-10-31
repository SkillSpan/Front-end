import { useMemo } from 'react';
import AssessmentCompleteTopbar from './AssessmentCompleteTopbar';
import { getAssessmentResult } from './assessmentResult';
import { getQuestionBank } from './assessmentQuestions';
import './SkillAssessmentResults.css';

// ---------------------------------------------------------------------------
// "11. Skill Results" - "Your initial skill profile". Shown after
// SkillAssessmentCompletion.jsx's "View My Skill Profile" button. Reads the
// same answers the quiz saved (assessmentStorage.js) and turns each
// "rating" question into a skill bar + an overall readiness score, so this
// screen always reflects what the learner actually answered rather than
// showing placeholder numbers.
// `onFinish` fires from the "Skill Matrix" button - there's no dashboard
// page in this codebase yet (see AssessmentWizard.jsx), so the caller just
// sends the learner home, same as every other terminal step in this wizard.
// ---------------------------------------------------------------------------

// Cycled per skill row purely for visual variety - matches the mix of
// purple/blue/teal/orange accents used in the reference design.
const ACCENT_PALETTE = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#3b82f6', '#14b8a6', '#22c55e'];

// GET /api/v1/skills/matrix's exact response shape isn't confirmed with the
// backend yet (see api.js) - this tries a handful of plausible field names
// for the skill name and its 0-4 level so the real matrix can be shown as
// soon as it's reachable, without ever throwing on an unexpected shape.
const levelLabel = (level) => {
  if (level < 1) return 'No Experience';
  if (level < 2) return 'Beginner';
  if (level < 3) return 'Developing';
  if (level < 4) return 'Intermediate';
  return 'Advanced';
};

const SkillAssessmentResults = ({ onFinish }) => {
  // The scored result saved by AssessmentWizard after the real submit call.
  // It's the same source the Completion screen reads, so the percentage is
  // identical on every page.
  const result = useMemo(() => getAssessmentResult(), []);
  const bank = useMemo(() => getQuestionBank(), []);

  const skills = useMemo(
    () => (result?.skills || []).map((s, index) => ({ ...s, label: levelLabel(s.level), accent: ACCENT_PALETTE[index % ACCENT_PALETTE.length] })),
    [result]
  );
  const readinessScore = result?.score ?? 0;
  const hasResult = result?.score != null;

  const roleTitle = result?.careerRoleTitle || bank.careerRoleTitle;
  const track = roleTitle ? `${roleTitle} track` : 'Your career track';

  const ringCircumference = 2 * Math.PI * 54;

  return (
    <div className="assessment-results-page">
      <AssessmentCompleteTopbar />

      <div className="assessment-results-body">
        <span className="assessment-results-eyebrow">
          <span className="assessment-results-eyebrow-dot" />
          Initializing Skill Matrix — BR-11
        </span>

        <h1 className="assessment-results-title">Your initial skill profile</h1>
        <p className="assessment-results-subtitle">
          Based on your baseline assessment responses — these are your starting proficiency levels.
        </p>

        <div className="assessment-results-grid">
          <section className="assessment-results-card">
            <div className="assessment-results-card-title">Assessed Skills</div>

            {!hasResult && (
              <p role="status" className="assessment-results-note">
                We couldn't load your scored results. Please go back and submit the assessment again.
              </p>
            )}
            <div className="assessment-results-skill-list">
              {skills.map((s) => (
                <div key={s.id} className="assessment-results-skill">
                  <div className="assessment-results-skill-row">
                    <span className="assessment-results-skill-name">{s.skill}</span>
                    <div className="assessment-results-skill-dots">
                      {Array.from({ length: Math.max(1, Math.round(s.level)) }).map((_, i) => (
                        <span key={i} style={{ background: s.accent }} />
                      ))}
                    </div>
                    <span className="assessment-results-skill-badge" style={{ color: s.accent, background: `${s.accent}1f` }}>
                      {s.percent}% · {s.label}
                    </span>
                  </div>
                  <div className="assessment-results-skill-track">
                    <div
                      className="assessment-results-skill-fill"
                      style={{
                        width: `${s.percent}%`,
                        background: s.accent,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="assessment-results-card assessment-results-readiness">
            <div className="assessment-results-card-title">Readiness Score</div>

            <div className="assessment-results-score-row">
              <div className="assessment-results-ring-wrap">
                <svg className="assessment-results-ring" viewBox="0 0 120 120">
                  <circle className="assessment-results-ring-track" cx="60" cy="60" r="54" />
                  <circle
                    className="assessment-results-ring-fill"
                    cx="60"
                    cy="60"
                    r="54"
                    style={{
                      strokeDasharray: ringCircumference,
                      strokeDashoffset: ringCircumference * (1 - readinessScore / 100),
                    }}
                  />
                </svg>
                <span className="assessment-results-ring-value">{readinessScore}%</span>
              </div>

              <div>
                <div className="assessment-results-score-value">{readinessScore}%</div>
                <div className="assessment-results-score-label">Initial readiness</div>
                <span className="assessment-results-track-pill">{track}</span>
              </div>
            </div>

            <p className="assessment-results-note">
              These levels will be refined as you complete projects and assessments. Your dashboard and
              roadmap are now unlocked.
            </p>
          </section>
        </div>

        <button type="button" className="assessment-results-cta" onClick={onFinish}>
          Dashboard
        </button>
      </div>
    </div>
  );
};

export default SkillAssessmentResults;
