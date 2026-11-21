/*
 * US-PRJ-01 — Company Project Publication & Requirements: API module.
 * Requirements: PRJ-01, PRJ-02, PRJ-03, PRJ-05, PRJ-08, PRJ-09, PRJ-10, AUTH-04, NOT-01, UC-07.
 *
 * ENDPOINTS — route names are the sprint document's "API" section for this
 * story ("Endpoint names are proposed and shall be confirmed during API design").
 * The combined company guide (COMPANY_FRONTEND_A_TO_Z.pdf §11) says the
 * /api/v1/projects/* contract lives in the backend's separate projects docs,
 * which we do not have yet. Every route below is therefore TODO(api) until
 * that doc arrives; switching is a change to this object only.
 */
import { SAMPLE_CAREER_ROLES, SAMPLE_RUBRICS, SAMPLE_TAXONOMY } from '../projectsMock';
import { mockCreateProject, mockSubmitProject, mockUpdateProject } from '../mockBackend';
import { formToPayload } from '../projectForm';
import { idempotencyHeaders, liveCall, previewCall, toQuery, unwrapApiData } from './shared';

export const PUBLICATION_ENDPOINTS = {
  // TODO(api): sprint doc US-PRJ-01 API — confirm with the projects guide.
  create: () => '/api/v1/projects', // POST  → 201 { data: project (status "draft") }
  update: (id) => `/api/v1/projects/${encodeURIComponent(id)}`, // PATCH → { data: project }
  submit: (id) => `/api/v1/projects/${encodeURIComponent(id)}/submit`, // POST → { data: project (submitted | approved) }
  // Sprint 3, already used by the learner screens (US-SKL-01 / US-CAR-01).
  taxonomy: () => '/api/v1/skills/taxonomy',
  careerRoles: () => '/api/v1/career-roles',
  // TODO(api, ASSUMED — not in the sprint doc): approved rubric versions the
  // company may attach (PRJ-09, AC-07; OQ-04 is still open).
  rubrics: () => `/api/v1/rubrics${toQuery({ status: 'approved' })}`,
  // The role's own skill map. Needed because the server rejects any
  // `required_skills.*.skill_id` that is not in it (SkillMappedToCareerRole),
  // while the picker offers the whole taxonomy.
  careerRoleSkills: (id) => `/api/v1/career-roles/${encodeURIComponent(id)}/skills`,
};

/** GET skills taxonomy (flat list, tree in parent_skill_id) → [{ key, label, skills: [{ id, name }] }]. */
export function groupTaxonomy(raw) {
  const rows = unwrapApiData(raw) ?? raw;
  const list = Array.isArray(rows) ? rows : (Array.isArray(rows?.data) ? rows.data : []);
  if (!list.length) return [];
  if ('parent_skill_id' in list[0]) {
    const top = list.filter((s) => s.parent_skill_id == null);
    const groups = top.map((c) => ({
      key: String(c.slug || c.id),
      label: c.name || c.title || '',
      skills: list.filter((s) => s.parent_skill_id === c.id).map((s) => ({ id: s.id, name: s.name || s.title || '' })),
    })).filter((g) => g.skills.length);
    if (groups.length) return groups;
  }
  if (Array.isArray(list[0]?.skills)) {
    return list.map((c) => ({ key: String(c.id ?? c.name), label: c.name || c.label || '', skills: c.skills.map((s) => ({ id: s.id, name: s.name || '' })) }));
  }
  return [{ key: 'all', label: '', skills: list.map((s) => ({ id: s.id, name: s.name || s.title || '' })) }];
}

const rowsOf = (raw) => {
  const body = unwrapApiData(raw) ?? raw;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

/** Everything the form's pickers need, loaded together. A failed list does not block the form. */
export async function loadFormReferences({ preview } = {}) {
  if (preview) {
    return previewCall(() => ({
      taxonomy: groupTaxonomy(SAMPLE_TAXONOMY),
      careerRoles: SAMPLE_CAREER_ROLES,
      rubrics: SAMPLE_RUBRICS,
      failed: [],
    }));
  }
  const [tax, roles, rubrics] = await Promise.allSettled([
    liveCall(PUBLICATION_ENDPOINTS.taxonomy()),
    liveCall(PUBLICATION_ENDPOINTS.careerRoles()),
    liveCall(PUBLICATION_ENDPOINTS.rubrics()),
  ]);
  const failed = [];
  const pick = (res, name, fn) => {
    if (res.status === 'fulfilled') return fn(res.value);
    if (res.reason?.status === 401) throw res.reason;
    failed.push(name);
    return [];
  };
  return {
    taxonomy: pick(tax, 'taxonomy', groupTaxonomy),
    careerRoles: pick(roles, 'careerRoles', (v) => rowsOf(v).map((r) => ({ id: r.id, title: r.title || r.name || '' }))),
    rubrics: pick(rubrics, 'rubrics', (v) => rowsOf(v).filter((r) => !r.status || r.status === 'approved').map((r) => ({ id: r.id, name: r.name || r.title || '', version: r.version ?? r.version_number ?? '', status: r.status || 'approved', criteria: r.criteria_count ?? r.criteria?.length ?? null }))),
    failed,
  };
}

const skillNames = (refs) => Object.fromEntries((refs?.taxonomy || []).flatMap((g) => g.skills.map((s) => [s.id, s.name])));

/**
 * Skill ids the chosen career role maps to, or `null` when we cannot know.
 *
 * `null` means "do not filter": no role chosen yet, preview mode, an empty
 * map, or a failed call. Reference data must never block the form — worst
 * case the picker shows the whole taxonomy, exactly as it did before.
 */
export async function loadCareerRoleSkills(roleId, { preview } = {}) {
  if (!roleId || preview) return null;
  try {
    const raw = await liveCall(PUBLICATION_ENDPOINTS.careerRoleSkills(roleId));
    const rows = unwrapApiData(raw)?.skills ?? [];
    const ids = rows.map((s) => s.skill_id ?? s.skill?.id ?? s.id).filter((v) => v != null);
    return ids.length ? ids : null;
  } catch {
    return null;
  }
}

/** Save as Draft — first save (Scenario 1, AC-09). */
export async function createProjectDraft(form, { preview, idempotencyKey, refs } = {}) {
  const body = formToPayload(form, refs);
  const path = PUBLICATION_ENDPOINTS.create();
  if (preview) {
    return unwrapApiData(await previewCall(() => mockCreateProject(body, { idempotencyKey, names: skillNames(refs) }), { method: 'POST', path }));
  }
  return unwrapApiData(await liveCall(path, { method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }));
}

/**
 * Save as Draft on an existing project (Draft / Changes Requested only, BR-04).
 * Returns { project, materialChange } — the server's meta.material_change
 * (US-PRJ-02 BR-09) when applications exist. TODO(api): meta field name.
 */
export async function updateProjectDraft(id, form, { preview, refs } = {}) {
  const body = formToPayload(form, refs);
  const path = PUBLICATION_ENDPOINTS.update(id);
  const res = preview
    ? await previewCall(() => mockUpdateProject(id, body, { names: skillNames(refs) }), { method: 'PATCH', path })
    : await liveCall(path, { method: 'PATCH', body });
  return { project: unwrapApiData(res), materialChange: Boolean(res?.meta?.material_change), version: res?.meta?.version ?? null };
}

/**
 * Submit for Approval — or Publish where the configured policy allows owner
 * approval (PRJ-03, Scenario 3, AC-12). One endpoint: the backend applies the
 * policy and answers with the resulting status (submitted | approved).
 */
export async function submitProject(id, { preview, idempotencyKey } = {}) {
  const path = PUBLICATION_ENDPOINTS.submit(id);
  if (preview) return unwrapApiData(await previewCall(() => mockSubmitProject(id, { idempotencyKey }), { method: 'POST', path }));
  return unwrapApiData(await liveCall(path, { method: 'POST', headers: idempotencyHeaders(idempotencyKey) }));
}
