// assessmentResult.js
// Reads the scored result the server returns from
// POST /api/v1/baseline-assessments/{id}/submit (saved by AssessmentWizard in
// sessionStorage) and turns it into one normalized shape that the Completion
// and Results screens share - so the percentage the learner sees is the same
// number on every page.
//
// Server payload (BaselineAssessmentController::transform):
//   result.overall_score        0-100, computed by the intelligence service
//   normalized_skills[]         { skill_id, slug, name, level 0-5, confidence 0-100 }

import { loadSubmissionResult } from './assessmentStorage';
import { MAX_SKILL_LEVEL } from './assessmentQuestions';

const unwrap = (raw) => (raw && raw.data && raw.data.id !== undefined ? raw.data : raw) || null;

const clampPct = (n) => Math.max(0, Math.min(100, Math.round(n)));

export const levelToPercent = (level) => clampPct((Number(level) / MAX_SKILL_LEVEL) * 100);

export const getAssessmentResult = () => {
  const data = unwrap(loadSubmissionResult());
  if (!data) return null;

  const skills = (Array.isArray(data.normalized_skills) ? data.normalized_skills : [])
    .map((s) => ({
      id: s.skill_id ?? s.slug ?? s.name,
      skill: s.name ?? s.slug,
      level: Number(s.level) || 0,
      percent: levelToPercent(s.level),
      confidence: Number.isFinite(Number(s.confidence)) ? Math.round(Number(s.confidence)) : null,
    }))
    .filter((s) => s.skill);

  const serverScore = data.result?.overall_score ?? data.result?.score ?? data.result?.readiness_score;
  let score = null;
  if (Number.isFinite(Number(serverScore))) {
    score = clampPct(Number(serverScore));
  } else if (skills.length) {
    // No overall score from the service: derive it from the same skill levels
    // that are shown on the Results screen (plain average).
    score = clampPct(skills.reduce((sum, s) => sum + s.percent, 0) / skills.length);
  }

  return {
    score,
    skills,
    careerRoleTitle: data.career_role?.title ?? data.snapshot_metadata?.career_role_title ?? '',
  };
};
