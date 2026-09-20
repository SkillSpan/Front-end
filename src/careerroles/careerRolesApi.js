// careerRolesApi.js
// Talks to the real Career Roles endpoints (see the "Career roles" section
// in api.js) and normalizes their responses into the shape the Career
// Roles screens expect, combining role skill requirements with the
// learner's own current levels (from getSkillsMatrix) to compute a
// client-side readiness approximation.
//
// ⚠️ Response field names below are ASSUMED, not confirmed against a live
// sample - no example payload was provided for the three career-roles
// endpoints (only their paths: GET /career-roles, GET /career-roles/{id},
// GET /career-roles/{id}/skills). Every `raw.someField` below has
// reasonable fallback keys, but verify against the real API and adjust
// `normalizeRoleSummary` / `normalizeSkillRow` if a field comes back under
// a different name.
//
// Also ⚠️ per the note on getSkillsMatrix() in api.js: that endpoint
// currently returns the *entire* skills-matrix table, not just the
// signed-in learner's rows, so we filter by learner_id client-side - same
// workaround SkillMatrix.jsx already uses.

import {
  getCareerRoles,
  getCareerRoleById,
  getCareerRoleSkills,
  getSkillsMatrix,
  getStoredUser,
  resolveLearnerId,
} from '../api';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data; // double-wrapped paginator
  return [];
}

function slugify(text) {
  const slug = String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || 'general';
}

function normalizeRoleSummary(raw) {
  const categoryLabel = raw.category?.name || raw.category?.label || raw.category || raw.domain || 'General';
  return {
    id: raw.id ?? raw.role_id ?? raw.slug,
    title: raw.title || raw.name || 'Untitled role',
    version: raw.version ? (String(raw.version).startsWith('v') ? String(raw.version) : `v${raw.version}`) : null,
    status: raw.status || raw.approval_status || null,
    effectiveDate: raw.effective_date || raw.effective_at || raw.effectiveDate || null,
    categoryKey: slugify(raw.category?.slug || categoryLabel),
    categoryLabel,
  };
}

function normalizeSkillRow(raw) {
  return {
    skillId: raw.skill_id ?? raw.skill?.id ?? raw.id,
    name: raw.skill_name || raw.skill?.name || raw.name || 'Unnamed skill',
    category: raw.category || raw.skill?.category || raw.skill_category || 'General',
    required: Number(raw.required_level ?? raw.required ?? raw.level ?? 0),
    weight: Math.round(Number(raw.weight ?? raw.importance ?? raw.importance_weight ?? 0)),
    critical: Boolean(raw.is_critical ?? raw.critical ?? false),
    prerequisites: Array.isArray(raw.prerequisites)
      ? raw.prerequisites.map((p) => (
        typeof p === 'string' ? p : (p.name || p.skill_name || String(p.skill_id ?? p.id ?? ''))
      ))
      : [],
  };
}

// Builds { [skill_id]: currentLevel } for the signed-in learner.
export async function fetchMySkillLevels() {
  const currentUser = getStoredUser();
  const learnerId = resolveLearnerId(currentUser);
  // getSkillsMatrix requires learner_id as a query param now - see the
  // note on it in api.js. No id, no point calling (it'll just 422).
  if (!learnerId) return {};
  const data = await getSkillsMatrix(learnerId);
  const rows = unwrapList(data);
  const levels = {};
  rows
    .filter((row) => row.learner_id === learnerId)
    .forEach((row) => {
      levels[row.skill_id] = Number(row.level) || 0;
    });
  return levels;
}

// GET /api/v1/career-roles (paginated) -> list of approved career roles.
export async function fetchCareerRoleList() {
  const data = await getCareerRoles({ perPage: 50 });
  return unwrapList(data).map(normalizeRoleSummary).filter((r) => r.id != null);
}

// GET /api/v1/career-roles/{id} -> single role's title/version/effective
// date/status.
export async function fetchCareerRoleDetail(roleId) {
  const data = await getCareerRoleById(roleId);
  return normalizeRoleSummary(data?.data || data);
}

// GET /api/v1/career-roles/{id}/skills -> required skills + weights +
// critical flags + prerequisites, as one decision snapshot.
export async function fetchCareerRoleSkills(roleId) {
  const data = await getCareerRoleSkills(roleId);
  return unwrapList(data).map(normalizeSkillRow);
}

// Merges skill requirements with the learner's current levels so the UI
// helpers in rolesData.js (skillMatch/skillStatusColor/etc.) can work with
// a single `current` number per skill.
export function attachCurrentLevels(skills, levelsBySkillId) {
  return skills.map((s) => ({ ...s, current: levelsBySkillId[s.skillId] ?? 0 }));
}

// Client-side readiness approximation: weighted skill-match average (see
// SRS §10.4 "Skill Gap and Match"). This is NOT the full SRS §10.5
// Readiness formula (which also factors in practical experience,
// assessment reliability, and profile completeness via
// `POST /intelligence/readiness`) - it's a stand-in until that endpoint
// exists. Returns null when there's nothing to score, so the UI can show
// "Not enough data" instead of a misleading 0%.
export function estimateReadiness(skills) {
  const scored = skills.filter((s) => s.required > 0 && s.weight > 0);
  if (!scored.length) return null;
  const totalWeight = scored.reduce((sum, s) => sum + s.weight, 0);
  if (!totalWeight) return null;
  const weighted = scored.reduce((sum, s) => sum + Math.min(s.current / s.required, 1) * s.weight, 0);
  return Math.round((weighted / totalWeight) * 100);
}

// Loads the full Browse-Roles catalog: role summaries + each role's skills
// (merged with the learner's current levels) + a computed readiness. Skills
// are fetched in parallel, one request per role - fine at MVP catalog
// sizes, but worth revisiting (e.g. a bulk endpoint) if the catalog grows
// large.
export async function loadCareerRolesCatalog() {
  const [roles, levelsBySkillId] = await Promise.all([
    fetchCareerRoleList(),
    fetchMySkillLevels().catch(() => ({})), // don't fail the whole page if this one 401s/errors
  ]);

  const withSkills = await Promise.all(
    roles.map(async (role) => {
      try {
        const rawSkills = await fetchCareerRoleSkills(role.id);
        const skills = attachCurrentLevels(rawSkills, levelsBySkillId);
        return { ...role, skills, readiness: estimateReadiness(skills) };
      } catch {
        // Keep the role visible even if its skill requirements failed to
        // load - the card/table below just shows "Not enough data".
        return { ...role, skills: [], readiness: null };
      }
    })
  );

  return { roles: withSkills, levelsBySkillId };
}

// Loads one role's authoritative detail + skills (used when opening the
// Role Details page), reusing already-fetched skill levels if given.
export async function loadCareerRoleDetail(roleId, levelsBySkillId = {}) {
  const [detail, rawSkills] = await Promise.all([
    fetchCareerRoleDetail(roleId),
    fetchCareerRoleSkills(roleId),
  ]);
  const skills = attachCurrentLevels(rawSkills, levelsBySkillId);
  return { ...detail, skills, readiness: estimateReadiness(skills) };
}
