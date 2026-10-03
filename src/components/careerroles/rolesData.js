// rolesData.js
// Pure formatting/computation helpers shared by the Career Roles screens.
// These are data-source agnostic - they work the same whether a role came
// from the live API (see careerRolesApi.js) or (previously) from a local
// mock. No role/skill data is hardcoded here anymore.

// Per-category badge colors (background / text) used on role cards. Falls
// back to a neutral style for any category slug the backend returns that
// isn't in this list yet, so an unrecognized category never breaks the UI.
const CATEGORY_STYLES = {
  engineering: { bg: '#e2ebff', fg: '#3b5fe0' },
  analytics: { bg: '#f1e6fd', fg: '#8b5cf6' },
  'machine-learning': { bg: '#dcfce7', fg: '#16a34a' },
  product: { bg: '#ffedd5', fg: '#d97706' },
  infrastructure: { bg: '#fee2e2', fg: '#dc2626' },
  'data-science': { bg: '#cffafe', fg: '#0891b2' },
};

const FALLBACK_CATEGORY_STYLE = { bg: '#eef1f8', fg: '#4b5273' };

export function categoryStyle(categoryKey) {
  return CATEGORY_STYLES[categoryKey] || FALLBACK_CATEGORY_STYLE;
}

// Distinct accent colors used only in the multi-role comparison view, so
// each compared role is visually distinguishable regardless of its
// readiness band.
export const COMPARE_ACCENTS = ['#f59e0b', '#16a34a', '#3b82f6'];

export function readinessColor(pct) {
  if (pct == null) return '#97a0bd';
  if (pct < 50) return '#ef4444';
  if (pct < 75) return '#f59e0b';
  return '#16a34a';
}

export function readinessBand(pct) {
  if (pct == null) return 'Not enough data';
  if (pct < 40) return 'Foundation Needed';
  if (pct < 60) return 'Developing';
  if (pct < 75) return 'Moderate Readiness';
  if (pct < 90) return 'Near Ready';
  return 'Highly Ready';
}

export function demandColor(level) {
  if (level === 'High') return '#059669';
  if (level === 'Medium') return '#d97706';
  return '#6a7093';
}

// Match ratio (0-100, capped) between current and required skill level.
export function skillMatch(skill) {
  if (!skill.required) return 100;
  return Math.min(skill.current / skill.required, 1) * 100;
}

// Bar / text color for a single skill row: red < 60% match, amber < 100%,
// green at 100% (fully met). Matches the approved Skill Requirements design.
export function skillStatusColor(skill) {
  const m = skillMatch(skill);
  if (m >= 100) return '#16a34a';
  if (m >= 60) return '#f59e0b';
  return '#ef4444';
}

export function skillMet(skill) {
  return skill.current >= skill.required;
}

export function skillsMetCount(role) {
  return role.skills.filter(skillMet).length;
}

export function criticalSkills(role) {
  return role.skills.filter((s) => s.critical);
}

export function criticalMetCount(role) {
  return criticalSkills(role).filter(skillMet).length;
}

export function gapToCloseLabel(skill) {
  const gap = skill.required - skill.current;
  if (gap <= 0) return 'Requirement met';
  return `${gap} level${gap === 1 ? '' : 's'} to go`;
}
