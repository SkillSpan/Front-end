/*
 * US-PRJ-02 — Company Project Management & Lifecycle: API module.
 * Requirements: PRJ-03, PRJ-05, PRJ-06, PRJ-07, PRJ-08, NOT-01, AUTH-04,
 * NFR-PERF-03, NFR-SEC-06, UC-07, SRS Table 70, SRS Table 75.
 *
 * ENDPOINTS — the sprint document's API section for this story. TODO(api):
 * confirm with the backend's projects guide (COMPANY_FRONTEND_A_TO_Z.pdf §11
 * points to it; we do not have it yet). Only this object needs to change.
 */
import { apiKey } from '../../../../cache/queryCache';
import { mockCloneProject, mockGetProject, mockListProjects, mockTransition } from '../mockBackend';
import { ACTIONS } from '../lifecycle';
import { idempotencyHeaders, liveCall, normalizePage, previewCall, toQuery, unwrapApiData } from './shared';
import { submitProject } from './projectPublicationApi';

export const LIFECYCLE_ENDPOINTS = {
  // TODO(api): sprint doc US-PRJ-02 API — confirm.
  list: (params) => `/api/v1/company/projects${toQuery(params)}`, // GET ?page&per_page&status&search&sort
  detail: (id) => `/api/v1/company/projects/${encodeURIComponent(id)}`, // GET { data: project }
  transition: (id) => `/api/v1/projects/${encodeURIComponent(id)}/transitions`, // POST { action, to, reason }
  clone: (id) => `/api/v1/projects/${encodeURIComponent(id)}/clone`, // POST → { data: new draft }
};

export const PROJECTS_PAGE_SIZE = 8; // BR-14 pagination

// The screen's sort keys, mapped to the ones the API accepts. Two screen keys
// can share an API sort: the list is ordered by id, so "recently created" and
// "recently updated" are the same order, and inventing a third name for it
// would only produce a silent fallback.
export const PROJECT_SORTS = ['updated_desc', 'deadline_asc', 'title_asc', 'created_desc'];
const SORT_TO_API = { updated_desc: 'recent', created_desc: 'recent', deadline_asc: 'deadline', title_asc: 'title' };

export function listParams({ page = 1, perPage = PROJECTS_PAGE_SIZE, state = '', search = '', sort = 'updated_desc' } = {}) {
  // `q`, not `search`: the API's free-text parameter is named after the term,
  // and an unknown one is dropped silently — the list would come back unfiltered.
  return { page, per_page: perPage, status: state || undefined, q: search || undefined, sort: SORT_TO_API[sort] || 'recent' };
}

// Cache keys (src/cache). Preview answers get their own variant so they never mix with live ones.
const v = (preview) => (preview ? { variant: 'preview' } : undefined);
export const projectKeys = {
  list: (q, preview) => apiKey('/api/v1/company/projects', listParams(q), v(preview)),
  detail: (id, preview) => apiKey(`/api/v1/company/projects/${id}`, null, v(preview)),
};

/** A list row → what My Projects shows (Scenario 1: title, type, state, deadline, filled capacity). */
export function normalizeProjectRow(p = {}) {
  const cap = p.capacity_state || {};
  return {
    id: p.id,
    title: p.title ?? p.name ?? '',
    type: p.project_type ?? p.type ?? '',
    status: p.status ?? p.state ?? 'draft',
    domain: p.domain ?? p.track ?? '',
    deadline: p.application_deadline ?? p.deadline?.date ?? p.deadline ?? null,
    filled: Number(cap.accepted ?? p.filled ?? 0),
    capacity: Number(cap.total ?? p.capacity ?? 0),
    applications: p.applications_count ?? null,
    updatedAt: p.updated_at ?? null,
  };
}

export async function listCompanyProjects(query = {}, { preview } = {}) {
  const res = preview
    ? await previewCall(() => mockListProjects(query))
    : await liveCall(LIFECYCLE_ENDPOINTS.list(listParams(query)));
  const page = normalizePage(res, normalizeProjectRow, { page: query.page, perPage: query.perPage || PROJECTS_PAGE_SIZE });
  // The per-state counts are a sibling of `data` (`stats.by_status`), not a
  // member of `meta`. Without this the filter chips simply lose their numbers.
  const statusCounts = res?.stats?.by_status || res?.meta?.status_counts || null;
  return { ...page, statusCounts };
}

export async function getCompanyProject(id, { preview } = {}) {
  const res = preview ? await previewCall(() => mockGetProject(id)) : await liveCall(LIFECYCLE_ENDPOINTS.detail(id));
  return unwrapApiData(res);
}

/**
 * Run one Table 70 action. Submit / Resubmit go through US-PRJ-01's submit
 * endpoint; Start through US-MATCH-04's (teamFormationApi); the rest through
 * POST /projects/{id}/transitions. Cancel carries its required reason (BR-10).
 * TODO(api): body field names { action, to, reason } are assumed.
 */
export async function runProjectAction(id, action, { reason, preview, idempotencyKey } = {}) {
  const meta = ACTIONS[action];
  if (!meta) throw { status: 0, code: 'UNKNOWN_ACTION', message: `Unknown action ${action}` };
  if (meta.endpoint === 'submit') return submitProject(id, { preview, idempotencyKey });
  if (meta.endpoint !== 'transition') throw { status: 0, code: 'WRONG_ENDPOINT', message: `${action} has its own endpoint` };
  const body = { action, to: meta.to, ...(reason ? { reason } : {}) };
  const path = LIFECYCLE_ENDPOINTS.transition(id);
  const res = preview
    ? await previewCall(() => mockTransition(id, body), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) });
  return unwrapApiData(res);
}

/** Clone into a new Draft without applications or evaluations (BR-11, AC-08). */
export async function cloneProject(id, { preview, idempotencyKey } = {}) {
  const path = LIFECYCLE_ENDPOINTS.clone(id);
  const res = preview
    ? await previewCall(() => mockCloneProject(id, { idempotencyKey }), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', headers: idempotencyHeaders(idempotencyKey) });
  return unwrapApiData(res);
}
