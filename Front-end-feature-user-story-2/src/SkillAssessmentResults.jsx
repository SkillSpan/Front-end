import { useEffect, useMemo, useState } from 'react';
import AssessmentCompleteTopbar from './AssessmentCompleteTopbar';
import { loadSavedAnswers, loadSubmissionResult } from './assessmentStorage';
import { getSkillsMatrix } from './api';
import { RATED_QUESTIONS, RATING_LEVELS } from './assessmentQuestions';
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
const normalizeRemoteMatrix = (res) => {
  const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
  return list
    .map((entry, index) => {
      const name = entry?.skill_name ?? entry?.name ?? entry?.skill ?? null;
      const rawLevel = entry?.level ?? entry?.proficiency_level ?? entry?.proficiency ?? entry?.score;
      const level = Number.isFinite(Number(rawLevel)) ? Math.max(0, Math.min(4, Math.round(Number(rawLevel)))) : 0;
      if (!name) return null;
      return {
        id: entry?.id ?? name,
        skill: name,
        level,
        label: RATING_LEVELS[level]?.label || RATING_LEVELS[0].label,
        accent: ACCENT_PALETTE[index % ACCENT_PALETTE.length],
      };
    })
    .filter(Boolean);
};

const SkillAssessmentResults = ({ onFinish }) => {
  const answers = useMemo(() => loadSavedAnswers(), []);
  const submissionResult = useMemo(() => loadSubmissionResult(), []);
  const [remoteSkills, setRemoteSkills] = useState(null);

  // Best-effort: once the assessment is submitted, the backend should have
  // initialized the real Skill Matrix (BR-11, per this screen's own
  // copy) - fetch it so the numbers shown here match what's stored
  // server-side. A missing/unreachable matrix (new backend, offline, not
  // deployed yet) just keeps the locally-computed profile below.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSkillsMatrix();
        const normalized = normalizeRemoteMatrix(res);
        if (!cancelled && normalized.length) setRemoteSkills(normalized);
      } catch {
        // Fall back to the local calculation.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const localSkills = useMemo(
    () =>
      RATED_QUESTIONS.map((q, index) => {
        const level = typeof answers[q.id] === 'number' ? answers[q.id] : 0;
        return {
          id: q.id,
          skill: q.skill,
          level,
          label: RATING_LEVELS[level]?.label || RATING_LEVELS[0].label,
          accent: ACCENT_PALETTE[index % ACCENT_PALETTE.length],
        };
      }),
    [answers]
  );

  const skills = remoteSkills || localSkills;

  // submitBaselineAssessment()'s response may already include a computed
  // readiness/overall score - prefer that when present, otherwise fall
  // back to averaging the (remote-or-local) skill levels ourselves.
  const remoteScore = submissionResult?.data?.score ?? submissionResult?.score ?? submissionResult?.data?.readiness_score ?? submissionResult?.readiness_score;

  const readinessScore = useMemo(() => {
    if (Number.isFinite(Number(remoteScore))) return Math.round(Number(remoteScore));
    if (!skills.length) return 0;
    const maxTotal = skills.length * (RATING_LEVELS.length - 1);
    const total = skills.reduce((sum, s) => sum + s.level, 0);
    return Math.round((total / maxTotal) * 100);
  }, [skills, remoteScore]);

  const track = answers.targetRole?.trim() ? `${answers.targetRole.trim()} track` : 'Software Engineer track';

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

            <div className="assessment-results-skill-list">
              {skills.map((s) => (
                <div key={s.id} className="assessment-results-skill">
                  <div className="assessment-results-skill-row">
                    <span className="assessment-results-skill-name">{s.skill}</span>
                    <div className="assessment-results-skill-dots">
                      {Array.from({ length: s.level + 1 }).map((_, i) => (
                        <span key={i} style={{ background: s.accent }} />
                      ))}
                    </div>
                    <span className="assessment-results-skill-badge" style={{ color: s.accent, background: `${s.accent}1f` }}>
                      Level {s.level}
                    </span>
                  </div>
                  <div className="assessment-results-skill-track">
                    <div
                      className="assessment-results-skill-fill"
                      style={{
                        width: `${(s.level / (RATING_LEVELS.length - 1)) * 100}%`,
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
                <span className="assessment-results-ring-value">{readinessScore}</span>
              </div>

              <div>
                <div className="assessment-results-score-value">{readinessScore}/100</div>
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
          Skill Matrix
        </button>
      </div>
    </div>
  );
};

export default SkillAssessmentResults;
