// utils/projectMapping.js
// Pure helpers that turn the projects / recommendations / applications
// responses into the fields the learner project screens read. Kept out of
// the components so they can be unit tested on their own (see
// src/utils/__tests__/projectMapping.test.js).
//
// Shapes (backend ProjectResource, RecommendationResource, Application model):
//   project        { id, title, required_skills: [{ skill_id, skill_name,
//                    minimum_level, is_critical_entry }], ... }
//   recommendation { id, project_id, access_revoked, score (0-100),
//                    eligibility_state (eligible | ineligible),
//                    reasons (text, one reason per line), ... }
//   application    { status: submitted | shortlisted | waitlisted |
//                    accepted | rejected | withdrawn, ... }

const APPLICATION_STATUS_LABELS = {
  submitted: 'Submitted',
  shortlisted: 'Under Review',
  waitlisted: 'Under Review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const ELIGIBILITY_LABELS = {
  eligible: 'Eligible',
  ineligible: 'Not Eligible',
};

// Label the project screens show for an application status from the API.
export function applicationStatusLabel(status) {
  const key = String(status || '').toLowerCase();
  return APPLICATION_STATUS_LABELS[key] || 'Submitted';
}

function recommendationReason(reasons) {
  if (Array.isArray(reasons)) return reasons.filter(Boolean).join(' ');
  return String(reasons || '').split('\n').map((line) => line.trim()).filter(Boolean).join(' ');
}

function skillMatches(requiredSkills, levelsBySkillId) {
  if (!Array.isArray(requiredSkills) || !levelsBySkillId) return [];
  return requiredSkills.map((skill) => {
    const required = Number(skill.minimum_level ?? skill.minimum_required_level ?? 0);
    const yourLevel = Number(levelsBySkillId[skill.skill_id] ?? 0);
    const matched = yourLevel >= required;
    return {
      skillId: skill.skill_id,
      skillName: skill.skill_name || 'Skill',
      category: skill.category || '',
      requiredLevel: required,
      yourLevel,
      matched,
      isGrowthTarget: !matched && Boolean(skill.is_critical_entry),
    };
  });
}

// Adds the stored recommendation (GET /recommendations) and the learner's
// skill levels (GET /skills/matrix) to each project from GET /projects,
// under the field names ProjectsView reads. Projects without a
// recommendation keep "Not evaluated"; skill matches are only built when
// the learner's levels are known.
export function withRecommendations(projects, recommendations = [], levelsBySkillId = null) {
  const byProject = new Map();
  (Array.isArray(recommendations) ? recommendations : []).forEach((rec) => {
    if (rec && !rec.access_revoked && rec.project_id != null) byProject.set(String(rec.project_id), rec);
  });

  return (Array.isArray(projects) ? projects : []).map((project) => {
    const rec = byProject.get(String(project.id));
    const matches = skillMatches(project.required_skills, levelsBySkillId);
    return {
      ...project,
      ...(matches.length ? { skill_matches: matches } : {}),
      ...(rec
        ? {
          recommendation_id: rec.id,
          is_recommended: true,
          match_score: rec.score == null ? 0 : Math.round(Number(rec.score)),
          recommendation_reason: recommendationReason(rec.reasons),
          eligibility: ELIGIBILITY_LABELS[rec.eligibility_state] || 'Not evaluated',
        }
        : {}),
    };
  });
}
