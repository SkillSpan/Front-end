import { getCareerRoles, getProfile, getSpecializations, unwrapApiData } from '../../api';

const listOf = (payload) => {
  const data = unwrapApiData(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const sameName = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

// The career roles linked to the specialization the learner picked in their
// profile (GET /profile -> specialization name, matched against
// GET /reference/specializations, then GET /career-roles?specialization_id=).
// Resolves to { specialization, roleIds } or null when the learner has no
// specialization, it is not a known one, or it has no linked roles.
export async function loadSpecializationRoles() {
  const profile = unwrapApiData(await getProfile());
  const chosen = profile?.specialization;
  if (!chosen) return null;

  const specializations = listOf(await getSpecializations());
  const match = specializations.find((item) => sameName(item.name, chosen) || String(item.id) === String(chosen));
  if (!match) return null;

  const roles = listOf(await getCareerRoles({ perPage: 100, specializationId: match.id }));
  const roleIds = new Set(roles.map((role) => String(role.id)).filter(Boolean));
  return roleIds.size ? { specialization: match.name, roleIds } : null;
}

// Keeps the skills required by at least one of the given roles, plus every
// skill the learner already has, and drops categories left empty. Without a
// filter, or when the filter would leave nothing to pick, the full taxonomy
// is returned unchanged.
export function filterTaxonomyByRoles(taxonomy, filter, ownedSkills = {}) {
  if (!filter) return taxonomy;
  const filtered = taxonomy
    .map((category) => ({
      ...category,
      skills: category.skills.filter(
        (skill) => ownedSkills[skill.id] || (skill.roleIds || []).some((id) => filter.roleIds.has(String(id))),
      ),
    }))
    .filter((category) => category.skills.length > 0);
  return filtered.length ? filtered : taxonomy;
}
