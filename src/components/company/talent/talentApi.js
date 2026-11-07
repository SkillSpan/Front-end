/*
 * Talent — US-COMP-05 (search + ranking), US-COMP-06 (evidence summary +
 * comparison), US-COMP-07 (saved lists, internal notes, contact).
 * Requirements: COMP-01..07, PROF-04, PORT-02/03/05, BR-PORT-06, ADL-08/16/17,
 * NFR-XFA-01/03, NFR-SEC-06/07, NFR-PERF-03, NOT-01, UC-12, TC-13, TC-24.
 *
 * REAL routes (COMPANY_FRONTEND_A_TO_Z.pdf §7, exact field names):
 *   GET /api/v1/talent            ?search&career_role(slug)&min_readiness(0–100)&sort(recent|readiness)&page&per_page(1–100)
 *                                 → data[]: { id, name, career_role, readiness { score, band }, top_skills[] } + meta
 *                                 an unsupported sort → 422 (never ignored silently)
 *   GET /api/v1/talent/filters    → { career_roles[{ id, title, slug }], readiness_bands[] }
 *   GET /api/v1/talent/{student}  → profile; a candidate you may not see → 404 (not 403)
 *
 * Sprint-document routes (TODO(api): not in the guide yet — names as proposed):
 *   POST /api/v1/talent/compare                     (US-COMP-06)
 *   POST /api/v1/talent/lists                       (US-COMP-07)
 *   POST /api/v1/talent/lists/{id}/candidates       (US-COMP-07)
 *   POST /api/v1/talent/candidates/{id}/notes       (US-COMP-07)
 *   POST /api/v1/talent/candidates/{id}/contact     (US-COMP-07)
 * ASSUMED (the screens need them; neither document names them): see TALENT_ENDPOINTS.
 *
 * Everything a candidate did not consent to share is filtered by the backend
 * before ranking (BR-05); this module only renders what comes back.
 */
import { apiKey } from '../../../cache/queryCache';
import { idempotencyHeaders, liveCall, normalizePage, previewCall, toQuery, unwrapApiData } from '../projects/api/shared';
import { SAMPLE_LISTS, SAMPLE_NOTES, SAMPLE_RANKING, SAMPLE_TALENT, SAMPLE_TALENT_FILTERS } from './talentMock';

export const TALENT_ENDPOINTS = {
  // Guide §7 — confirmed.
  list: (params) => `/api/v1/talent${toQuery(params)}`,
  filters: () => '/api/v1/talent/filters',
  candidate: (id) => `/api/v1/talent/${encodeURIComponent(id)}`,
  // Sprint document (US-COMP-06/07) — TODO(api): confirm.
  compare: () => '/api/v1/talent/compare', // POST { candidate_ids: [] }
  createList: () => '/api/v1/talent/lists', // POST { name, candidate_ids? }
  addToList: (listId) => `/api/v1/talent/lists/${encodeURIComponent(listId)}/candidates`, // POST { candidate_ids: [] }
  addNote: (id) => `/api/v1/talent/candidates/${encodeURIComponent(id)}/notes`, // POST { body }
  contact: (id) => `/api/v1/talent/candidates/${encodeURIComponent(id)}/contact`, // POST { type: invite|message, message, project_id? }
  // ASSUMED — TODO(api): needed by AC-01 (rename/delete), lists screen, notes list, dashboard funnel.
  lists: () => '/api/v1/talent/lists', // GET
  listDetail: (listId) => `/api/v1/talent/lists/${encodeURIComponent(listId)}`, // GET · PATCH { name } · DELETE
  removeFromList: (listId, id) => `/api/v1/talent/lists/${encodeURIComponent(listId)}/candidates/${encodeURIComponent(id)}`, // DELETE
  notes: (id) => `/api/v1/talent/candidates/${encodeURIComponent(id)}/notes`, // GET
  funnel: () => '/api/v1/talent/funnel', // GET { saved, contacted, responded }
};

export const TALENT_PAGE_SIZE = 8;
export const TALENT_SORTS = ['recent', 'readiness']; // guide: anything else → 422
export const READINESS_BANDS = ['foundation_needed', 'developing', 'moderate_readiness', 'near_ready', 'highly_ready'];
export const BAND_TONE = { foundation_needed: 'gray', developing: 'amber', moderate_readiness: 'blue', near_ready: 'violet', highly_ready: 'green' };
export const COMPARE_MAX = 4;
// ASSUMED COMP-01 filters — sent only when /talent/filters lists their values (so the backend supports them).
export const EXTRA_FILTERS = ['skills', 'locations', 'languages', 'availability'];
const EXTRA_PARAM = { skills: 'skills', locations: 'location', languages: 'language', availability: 'availability' };

export function talentParams({ search = '', role = '', minReadiness = '', sort = 'recent', page = 1, perPage = TALENT_PAGE_SIZE, extra = {} } = {}) {
  const params = { search: search || undefined, career_role: role || undefined, min_readiness: minReadiness === '' || minReadiness == null ? undefined : Number(minReadiness), sort, page, per_page: perPage };
  Object.entries(extra || {}).forEach(([k, val]) => { if (val !== '' && val != null && EXTRA_PARAM[k]) params[EXTRA_PARAM[k]] = val; });
  return params;
}

const v = (preview) => (preview ? { variant: 'preview' } : undefined);
export const talentKeys = {
  list: (q, preview) => apiKey('/api/v1/talent', talentParams(q), v(preview)),
  filters: (preview) => apiKey('/api/v1/talent/filters', null, v(preview)),
  candidate: (id, preview) => apiKey(`/api/v1/talent/${id}`, null, v(preview)),
  notes: (id, preview) => apiKey(`/api/v1/talent/candidates/${id}/notes`, null, v(preview)),
  lists: (preview) => apiKey('/api/v1/talent/lists', null, v(preview)),
  savedList: (listId, preview) => apiKey(`/api/v1/talent/lists/${listId}`, null, v(preview)),
  funnel: (preview) => apiKey('/api/v1/talent/funnel', null, v(preview)),
};

/* ------------------------------------------------------------------ */
/* Normalizers                                                         */
/* ------------------------------------------------------------------ */

const skillOf = (s) => (typeof s === 'string'
  ? { id: s, name: s, level: null, verified: null }
  : { id: s.skill_id ?? s.id ?? s.name, name: s.name ?? s.skill_name ?? '', level: s.level ?? null, verified: s.verification_state ? s.verification_state === 'verified' : (s.verified ?? null) });

/** A search row: guide fields first; the rest are ASSUMED and simply absent until sent. */
export function normalizeCandidateRow(c = {}) {
  return {
    id: c.id,
    name: c.name || '',
    careerRole: c.career_role || '',
    readiness: c.readiness ? { score: c.readiness.score ?? null, band: c.readiness.band ?? null } : null,
    topSkills: (c.top_skills || []).map(skillOf),
    location: c.location || null,
    languages: c.languages || [],
    availability: c.availability || null,
    projectsCount: c.projects_count ?? (Array.isArray(c.projects) ? c.projects.length : null),
    evaluationsCount: c.evaluations_count ?? (Array.isArray(c.evaluations) ? c.evaluations.length : null),
    updatedAt: c.data_freshness ?? c.updated_at ?? null,
    rationale: c.rationale ? normalizeRationale(c.rationale) : null,
  };
}

export function normalizeRationale(r = {}) {
  return {
    version: r.config_version ?? r.version ?? null,
    factors: (r.factors || []).map((f) => ({ key: f.key, weight: f.weight ?? null, contribution: f.contribution ?? null, evidence: f.evidence || '' })),
    limitations: r.limitations || [],
  };
}

export function normalizeCandidate(c = {}) {
  return {
    ...normalizeCandidateRow(c),
    skills: (c.skills || c.verified_skills || c.top_skills || []).map(skillOf),
    projects: (c.projects || []).map((p) => ({ title: p.title, teamRole: p.team_role ?? p.role ?? null, contribution: p.contribution ?? null, verified: p.verification_state ? p.verification_state === 'verified' : null, completedAt: p.completed_at ?? null })),
    evaluations: (c.evaluations || []).map((e) => ({ project: e.project, summary: e.summary, band: e.score_band ?? null })),
    limitations: c.limitations || c.rationale?.limitations || [],
    contactAllowed: c.contact_allowed !== false,
  };
}

/* ------------------------------------------------------------------ */
/* Preview backend                                                      */
/* ------------------------------------------------------------------ */

let db;
const NOW = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));
function fail(status, code, message, extra = {}) { throw { status, code, message, ...extra }; }

export function resetTalentMock() {
  db = {
    talent: clone(SAMPLE_TALENT),
    hidden: new Set([90]), // consent withdrawn after being saved (BR-09 / TC-24)
    lists: clone(SAMPLE_LISTS),
    notes: clone(SAMPLE_NOTES),
    contacts: [{ candidate_id: 31, type: 'invite', at: '2026-10-29T09:00:00Z', responded: true }],
    seq: 100,
  };
  db.lists[0].candidate_ids.push(90);
}
resetTalentMock();
/** Preview / tests: hide a candidate as if they withdrew consent. */
export function mockHideCandidate(id) { db.hidden.add(Number(id)); }

function visible(id) { return db.talent.find((c) => c.id === Number(id) && !db.hidden.has(c.id)); }
const days = (iso) => Math.max(0, Math.round((Date.parse('2026-11-04T00:00:00Z') - Date.parse(iso)) / 86400000));

function rationaleOf(c) {
  const verified = c.top_skills.filter((s) => s.verification_state === 'verified');
  const vProjects = (c.projects || []).filter((p) => p.verification_state === 'verified');
  const limitations = [];
  if (!(c.projects || []).length) limitations.push('no_projects');
  if (!(c.evaluations || []).length) limitations.push('no_evaluations');
  if (c.top_skills.some((s) => s.verification_state !== 'verified')) limitations.push('self_declared_skills');
  if (days(c.updated_at) > 90) limitations.push('stale');
  return {
    config_version: SAMPLE_RANKING.version,
    factors: [
      { key: 'verified_skills', weight: 0.4, contribution: Math.min(40, verified.reduce((a, s) => a + s.level * 3, 0)), evidence: verified.map((s) => `${s.name} ${s.level}/5`).join(', ') },
      { key: 'project_evidence', weight: 0.3, contribution: Math.min(30, vProjects.length * 15), evidence: vProjects.map((p) => p.title).join(', ') },
      { key: 'evaluations', weight: 0.2, contribution: Math.min(20, (c.evaluations || []).length * 12), evidence: (c.evaluations || []).map((e) => e.project).join(', ') },
      { key: 'freshness', weight: 0.1, contribution: days(c.updated_at) <= 30 ? 10 : days(c.updated_at) <= 90 ? 6 : 2, evidence: c.updated_at },
    ],
    limitations,
  };
}

function rowOf(c) {
  return { id: c.id, name: c.name, career_role: c.career_role, readiness: c.readiness, top_skills: c.top_skills, location: c.location, languages: c.languages, availability: c.availability, projects_count: (c.projects || []).length, evaluations_count: (c.evaluations || []).length, data_freshness: c.updated_at, rationale: rationaleOf(c) };
}

function mockSearch(params) {
  if (params.sort && !TALENT_SORTS.includes(params.sort)) fail(422, 'VALIDATION_ERROR', 'The selected sort is invalid.', { errors: { sort: ['The selected sort is invalid.'] } });
  let rows = db.talent.filter((c) => !db.hidden.has(c.id)); // BR-02/BR-05: consent first
  const q = String(params.search || '').toLowerCase();
  if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(q));
  if (params.career_role) rows = rows.filter((c) => c.role_slug === params.career_role);
  if (params.min_readiness != null) rows = rows.filter((c) => c.readiness.score >= Number(params.min_readiness));
  if (params.skills) rows = rows.filter((c) => c.top_skills.some((s) => String(s.skill_id) === String(params.skills) && s.verification_state === 'verified'));
  if (params.location) rows = rows.filter((c) => c.location === params.location);
  if (params.language) rows = rows.filter((c) => c.languages.includes(params.language));
  if (params.availability) rows = rows.filter((c) => c.availability === params.availability);
  // Deterministic order (ADL-17): ties broken by id.
  rows.sort(params.sort === 'readiness'
    ? (a, b) => b.readiness.score - a.readiness.score || a.id - b.id
    : (a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || a.id - b.id);
  const per = Math.min(100, Math.max(1, Number(params.per_page) || 15));
  const total = rows.length;
  const last = Math.max(1, Math.ceil(total / per));
  const page = Math.min(Math.max(1, Number(params.page) || 1), last);
  return { success: true, data: rows.slice((page - 1) * per, page * per).map(rowOf), meta: { current_page: page, last_page: last, per_page: per, total, ranking_version: SAMPLE_RANKING.version } };
}

function mockCandidate(id) {
  const c = visible(id);
  if (!c) fail(404, 'NOT_FOUND', 'Not found.'); // guide: 404, never 403
  return { success: true, data: { ...rowOf(c), skills: c.top_skills, projects: c.projects, evaluations: c.evaluations, limitations: rationaleOf(c).limitations, contact_allowed: c.contact_allowed !== false } };
}

function mockCompare(ids = []) {
  const shown = ids.map(Number).filter((id) => visible(id));
  return {
    success: true,
    data: {
      evidence_period: { from: '2025-11-04', to: '2026-11-04' },
      candidates: shown.map((id) => mockCandidate(id).data),
      removed_count: ids.length - shown.length, // TC-24: count only, nothing about who
    },
  };
}

function listOut(l) {
  const ids = l.candidate_ids.filter((id) => visible(id));
  return { id: l.id, name: l.name, created_by: l.created_by, created_at: l.created_at, updated_at: l.updated_at, candidates_count: ids.length, hidden_count: l.candidate_ids.length - ids.length, candidates: ids.map((id) => rowOf(visible(id))) };
}
const findList = (id) => db.lists.find((l) => l.id === id) || fail(404, 'NOT_FOUND', 'Not found.');

function mockContact(id, body) {
  const c = visible(id);
  if (!c) fail(404, 'NOT_FOUND', 'Not found.');
  if (c.contact_allowed === false) fail(403, 'CONTACT_NOT_CONSENTED', 'This candidate does not accept company contact.');
  const recent = db.contacts.filter((x) => x.candidate_id === c.id && days(x.at) <= 7).length;
  if (recent >= 2) fail(429, 'CONTACT_RATE_LIMITED', 'You have contacted this candidate twice this week. Try again later.', { details: { retry_after_days: 7 } });
  db.contacts.push({ candidate_id: c.id, type: body.type, at: NOW() });
  return { success: true, data: { id: `ct${++db.seq}`, type: body.type, status: 'sent', sent_at: NOW() } };
}

/* ------------------------------------------------------------------ */
/* API                                                                  */
/* ------------------------------------------------------------------ */

export async function searchTalent(query = {}, { preview } = {}) {
  const params = talentParams(query);
  const res = preview ? await previewCall(() => mockSearch(params)) : await liveCall(TALENT_ENDPOINTS.list(params));
  const page = normalizePage(res, normalizeCandidateRow, { page: query.page, perPage: query.perPage || TALENT_PAGE_SIZE });
  // TODO(api, ASSUMED): meta.suggestions (permitted filter adjustments, BR-12) and meta.ranking_version.
  return { ...page, suggestions: page.meta?.suggestions || null, rankingVersion: page.meta?.ranking_version || null };
}

export async function getTalentFilterOptions({ preview } = {}) {
  const res = preview ? await previewCall(() => ({ success: true, data: SAMPLE_TALENT_FILTERS })) : await liveCall(TALENT_ENDPOINTS.filters());
  const d = unwrapApiData(res) || {};
  return {
    careerRoles: d.career_roles || [],
    readinessBands: d.readiness_bands?.length ? d.readiness_bands : READINESS_BANDS,
    // ASSUMED keys; a filter shows only when the backend lists its values.
    skills: d.skills || null, locations: d.locations || null, languages: d.languages || null, availability: d.availability || null,
  };
}

export async function getCandidate(id, { preview } = {}) {
  const res = preview ? await previewCall(() => mockCandidate(id)) : await liveCall(TALENT_ENDPOINTS.candidate(id));
  return normalizeCandidate(unwrapApiData(res));
}

/*
 * POST /api/v1/talent/compare returns `{ students, skills, unavailable }`.
 *
 * The page used to read `data.candidates`, which the live endpoint never sends,
 * so `people` was always `[]` and the compare screen showed "choose at least
 * two candidates" even with two chosen and a 200 back from the server.
 *
 * `skills` on each student is the top 5 only; the full union lives in the
 * top-level `skills` matrix (`levels[studentId]`), so that is the authoritative
 * per-skill list when it is present.
 */
export function normalizeComparedStudent(s = {}, matrix = null) {
  const fromMatrix = Array.isArray(matrix)
    ? matrix
        .filter((row) => row && row.levels && row.levels[s.id] != null)
        .map((row) => ({
          id: row.name,
          name: row.name,
          level: row.levels[s.id],
          verified: row.verified ? Boolean(row.verified[s.id]) : null,
        }))
    : null;

  const skills = fromMatrix && fromMatrix.length
    ? fromMatrix
    : (s.skills || []).map(skillOf);

  return {
    ...normalizeCandidateRow(s),
    skills,
    projects: [],
    evaluations: [],
    // The endpoint sends no evidence rows, so these are honest absences rather
    // than claims that the candidate has none.
    limitations: [
      'no_projects',
      'no_evaluations',
      ...(skills.some((sk) => sk.verified === false) ? ['self_declared_skills'] : []),
    ],
    contactAllowed: s.contactable !== false,
  };
}

export async function compareCandidates(ids, { preview } = {}) {
  // `student_ids`: the API names the people after the resource it stores.
  const body = { student_ids: ids };
  const res = preview ? await previewCall(() => mockCompare(ids)) : await liveCall(TALENT_ENDPOINTS.compare(), { method: 'POST', body });
  const d = unwrapApiData(res) || {};

  if (Array.isArray(d.students)) {
    return {
      period: d.evidence_period || null,
      candidates: d.students.map((s) => normalizeComparedStudent(s, d.skills)),
      removedCount: Number(d.removed_count ?? (Array.isArray(d.unavailable) ? d.unavailable.length : 0)),
    };
  }

  return { period: d.evidence_period || null, candidates: (d.candidates || []).map(normalizeCandidate), removedCount: Number(d.removed_count || 0) };
}

const normList = (l = {}) => ({ id: l.id, name: l.name, createdBy: l.created_by?.name || null, createdAt: l.created_at, updatedAt: l.updated_at, count: l.candidates_count ?? (l.candidates || []).length, hiddenCount: l.hidden_count || 0, candidates: (l.candidates || []).map(normalizeCandidateRow) });

export async function getLists({ preview } = {}) {
  const res = preview ? await previewCall(() => ({ data: db.lists.map(listOut) })) : await liveCall(TALENT_ENDPOINTS.lists());
  const d = unwrapApiData(res);
  return (Array.isArray(d) ? d : []).map(normList);
}
export async function getList(listId, { preview } = {}) {
  const res = preview ? await previewCall(() => ({ data: listOut(findList(listId)) })) : await liveCall(TALENT_ENDPOINTS.listDetail(listId));
  return normList(unwrapApiData(res));
}
export async function createList(name, candidateIds = [], { preview, idempotencyKey } = {}) {
  const path = TALENT_ENDPOINTS.createList();
  if (preview) {
    const res = await previewCall(() => {
      if (!name.trim()) fail(422, 'VALIDATION_ERROR', 'The name field is required.', { errors: { name: ['The name field is required.'] } });
      const l = { id: `L${++db.seq}`, name: name.trim(), candidate_ids: [...new Set(candidateIds.map(Number))], created_by: { name: 'Lina Haddad' }, created_at: NOW(), updated_at: NOW() };
      db.lists.unshift(l); return { data: listOut(l) };
    }, { method: 'POST', path });
    return normList(unwrapApiData(res));
  }
  // The create endpoint takes the list's own fields only; candidates are added
  // one call each afterwards, because that is the endpoint that exists.
  const res = await liveCall(path, { method: 'POST', body: { name }, headers: idempotencyHeaders(idempotencyKey) });
  const created = normList(unwrapApiData(res));
  if (candidateIds.length) {
    await addToList(created.id, candidateIds, { preview });
    return getList(created.id, { preview });
  }
  return created;
}
export async function addToList(listId, candidateIds, { preview } = {}) {
  const path = TALENT_ENDPOINTS.addToList(listId);
  if (preview) {
    const res = await previewCall(() => { const l = findList(listId); l.candidate_ids = [...new Set([...l.candidate_ids, ...candidateIds.map(Number)])]; l.updated_at = NOW(); return { data: listOut(l) }; }, { method: 'POST', path });
    return normList(unwrapApiData(res));
  }
  // One candidate per call — `POST { student_id }`. Adding somebody who is
  // already on the list is a 200, so the loop is safe to retry.
  for (const id of candidateIds) {
    await liveCall(path, { method: 'POST', body: { student_id: Number(id) } });
  }
  return getList(listId, { preview });
}
export async function renameList(listId, name, { preview } = {}) {
  const path = TALENT_ENDPOINTS.listDetail(listId);
  const res = preview
    ? await previewCall(() => { if (!name.trim()) fail(422, 'VALIDATION_ERROR', 'The name field is required.'); const l = findList(listId); l.name = name.trim(); l.updated_at = NOW(); return { data: listOut(l) }; }, { method: 'PATCH', path })
    : await liveCall(path, { method: 'PATCH', body: { name } });
  return normList(unwrapApiData(res));
}
export async function deleteList(listId, { preview } = {}) {
  const path = TALENT_ENDPOINTS.listDetail(listId);
  if (preview) await previewCall(() => { findList(listId); db.lists = db.lists.filter((l) => l.id !== listId); return {}; }, { method: 'DELETE', path });
  else await liveCall(path, { method: 'DELETE' });
  return true;
}
export async function removeFromList(listId, candidateId, { preview } = {}) {
  const path = TALENT_ENDPOINTS.removeFromList(listId, candidateId);
  const res = preview
    ? await previewCall(() => { const l = findList(listId); l.candidate_ids = l.candidate_ids.filter((x) => x !== Number(candidateId)); return { data: listOut(l) }; }, { method: 'DELETE', path })
    : await liveCall(path, { method: 'DELETE' });
  const d = unwrapApiData(res);
  return d?.id ? normList(d) : getList(listId, { preview });
}

const normNote = (n = {}) => ({ id: n.id, body: n.body ?? n.note ?? '', author: n.author?.name ?? n.author ?? '', at: n.created_at ?? null });
export async function getNotes(id, { preview } = {}) {
  const res = preview ? await previewCall(() => { if (!visible(id)) fail(404, 'NOT_FOUND', 'Not found.'); return { data: db.notes[id] || [] }; }) : await liveCall(TALENT_ENDPOINTS.notes(id));
  const d = unwrapApiData(res);
  return (Array.isArray(d) ? d : []).map(normNote);
}
export async function addNote(id, body, { preview, idempotencyKey } = {}) {
  const path = TALENT_ENDPOINTS.addNote(id);
  const res = preview
    ? await previewCall(() => { const n = { id: `n${++db.seq}`, body, author: { name: 'Lina Haddad' }, created_at: NOW() }; db.notes[id] = [n, ...(db.notes[id] || [])]; return { data: n }; }, { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body: { body }, headers: idempotencyHeaders(idempotencyKey) });
  return normNote(unwrapApiData(res));
}

/** Invite or message (Scenario 3). Blocked contact comes back as an error with a shareable reason (Scenario 4). */
export async function contactCandidate(id, { type, message, projectId }, { preview, idempotencyKey } = {}) {
  const body = { type, message, ...(projectId ? { project_id: projectId } : {}) };
  const path = TALENT_ENDPOINTS.contact(id);
  const res = preview
    ? await previewCall(() => mockContact(id, body), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) });
  return unwrapApiData(res);
}
// TODO(api): exact codes.
export const CONTACT_BLOCK_CODES = ['CONTACT_NOT_CONSENTED', 'CONTACT_RATE_LIMITED', 'CONTACT_FLAGGED', 'ORGANIZATION_NOT_VERIFIED'];

/** Candidate funnel for the dashboard (COMP-07 AC-09) — aggregate counts only. */
export async function getTalentFunnel({ preview } = {}) {
  const res = preview
    ? await previewCall(() => ({ data: { saved: new Set(db.lists.flatMap((l) => l.candidate_ids.filter((x) => visible(x)))).size, contacted: new Set(db.contacts.map((c) => c.candidate_id)).size, responded: db.contacts.filter((c) => c.responded).length } }))
    : await liveCall(TALENT_ENDPOINTS.funnel());
  const d = unwrapApiData(res) || {};
  return { saved: Number(d.saved ?? 0), contacted: Number(d.contacted ?? 0), responded: Number(d.responded ?? 0) };
}
