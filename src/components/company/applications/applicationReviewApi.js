/*
 * US-MATCH-03 — Application Review & Selection Decisions: API module.
 * Requirements: MATCH-05, PRJ-06, PRJ-08, PORT-03, PROF-04, BR-PORT-06, NOT-01,
 * AUTH-04, NFR-SEC-07, NFR-REL-03, SRS Table 71 (rules 01, 02, 06, 07), SRS Table 75.
 *
 * ENDPOINTS — sprint document's API section for this story. TODO(api): confirm.
 * The application view is whatever the backend returns: the frontend never
 * asks for, stores or derives private learner data (AC-03/AC-04, BR-02).
 */
import { apiKey } from '../../../cache/queryCache';
import { mockDecide, mockGetApplication, mockListApplications, DECISION_FROM } from '../projects/mockBackend';
import { idempotencyHeaders, liveCall, normalizePage, previewCall, toQuery, unwrapApiData } from '../projects/api/shared';

export const REVIEW_ENDPOINTS = {
  // TODO(api): sprint doc US-MATCH-03 API — confirm.
  list: (projectId, params) => `/api/v1/projects/${encodeURIComponent(projectId)}/applications${toQuery(params)}`, // GET ?status&sort&page&per_page
  detail: (id) => `/api/v1/applications/${encodeURIComponent(id)}`, // GET { data: approved application view }
  decision: (id) => `/api/v1/applications/${encodeURIComponent(id)}/decision`, // POST { decision, reason }
};

// SRS Table 75 — application status dictionary (BR-04).
export const APPLICATION_STATUSES = ['draft', 'submitted', 'shortlisted', 'waitlisted', 'accepted', 'rejected', 'withdrawn', 'expired'];
export const APPLICATION_TONE = {
  draft: 'gray', submitted: 'blue', shortlisted: 'violet', waitlisted: 'amber',
  accepted: 'green', rejected: 'red', withdrawn: 'gray', expired: 'gray',
};
export const DECISIONS = ['shortlist', 'waitlist', 'accept', 'reject'];
export const DECISION_RESULT = { shortlist: 'shortlisted', waitlist: 'waitlisted', accept: 'accepted', reject: 'rejected' };
// OQ-07 — the sprint document's assumed transitions (submitted → all four;
// shortlisted → waitlist/accept/reject; waitlisted → accept/reject). BR-05:
// withdrawn and expired get none. The server's `allowed_decisions`, when sent, wins.
export const ALLOWED_DECISIONS = DECISION_FROM;
export const APPLICATIONS_PAGE_SIZE = 8;
export const APPLICATION_SORTS = ['submitted_desc', 'submitted_asc', 'name_asc'];

export function allowedDecisions(app) {
  if (!app) return [];
  if (['withdrawn', 'expired'].includes(app.status)) return [];
  if (Array.isArray(app.allowedDecisions)) return app.allowedDecisions.filter((d) => DECISIONS.includes(d));
  return ALLOWED_DECISIONS[app.status] || [];
}

const listParams = ({ status = '', sort = 'submitted_desc', page = 1, perPage = APPLICATIONS_PAGE_SIZE } = {}) => ({ status: status || undefined, sort, page, per_page: perPage });

const v = (preview) => (preview ? { variant: 'preview' } : undefined);
export const applicationKeys = {
  list: (projectId, q, preview) => apiKey(`/api/v1/projects/${projectId}/applications`, listParams(q), v(preview)),
  detail: (id, preview) => apiKey(`/api/v1/applications/${id}`, null, v(preview)),
};

export function normalizeApplicationRow(a = {}) {
  return {
    id: a.id,
    status: a.status || 'submitted',
    submittedAt: a.submitted_at ?? a.created_at ?? null,
    projectVersion: a.project_version ?? null,
    role: a.requested_role ?? a.role ?? null,
    name: a.applicant?.name ?? a.learner?.name ?? '',
    headline: a.applicant?.headline ?? '',
  };
}

const normalizeCapacity = (p = {}) => {
  const cap = p.capacity_state || {};
  return {
    accepted: Number(cap.accepted ?? 0),
    total: Number(cap.total ?? p.capacity ?? 0),
    remaining: cap.remaining != null ? Number(cap.remaining) : Math.max(0, Number(p.capacity ?? 0) - Number(cap.accepted ?? 0)),
    roles: (p.roles || []).map((r) => ({ id: r.id, name: r.name, capacity: Number(r.capacity) || 0, accepted: Number(r.accepted ?? 0) })),
  };
};

export async function listApplications(projectId, query = {}, { preview } = {}) {
  const res = preview
    ? await previewCall(() => mockListApplications(projectId, query))
    : await liveCall(REVIEW_ENDPOINTS.list(projectId, listParams(query)));
  const page = normalizePage(res, normalizeApplicationRow, { page: query.page, perPage: query.perPage || APPLICATIONS_PAGE_SIZE });
  const proj = page.meta?.project || null; // TODO(api): meta.project + meta.status_counts are assumed
  return {
    ...page,
    statusCounts: page.meta?.status_counts || null,
    project: proj ? { id: proj.id, title: proj.title, status: proj.status, capacity: normalizeCapacity(proj) } : null,
  };
}

/** GET /applications/{id} → the approved application view, as sent. */
export function normalizeApplication(a = {}) {
  const p = a.project || {};
  return {
    ...normalizeApplicationRow(a),
    projectId: a.project_id ?? p.id ?? null,
    project: p.id != null ? { id: p.id, title: p.title, status: p.status, version: p.version ?? null, capacity: normalizeCapacity(p) } : null,
    applicant: a.applicant || null,
    answers: Array.isArray(a.answers) ? a.answers : [],
    portfolioUrl: a.portfolio_url || null,
    skills: (a.skills || []).map((s) => ({
      id: s.skill_id ?? s.id, name: s.skill_name ?? s.name ?? '', level: s.level ?? null,
      required: s.required_level ?? null, critical: Boolean(s.is_critical_entry), verification: s.verification_state ?? null,
    })),
    history: (a.decision_history || a.history || []).map((h) => ({ from: h.from ?? h.from_status ?? null, to: h.to ?? h.to_status, actor: h.actor?.name ?? h.actor ?? '', reason: h.reason || '', at: h.at ?? h.created_at ?? null })),
    allowedDecisions: Array.isArray(a.allowed_decisions) ? a.allowed_decisions : undefined,
  };
}

export async function getApplication(id, { preview } = {}) {
  const res = preview ? await previewCall(() => mockGetApplication(id)) : await liveCall(REVIEW_ENDPOINTS.detail(id));
  return normalizeApplication(unwrapApiData(res));
}

/**
 * Shortlist / waitlist / accept / reject with an optional reason (BR-03, AC-05/06).
 * The same idempotency key is sent again if the user retries (BR-11, AC-12).
 * TODO(api): body names { decision, reason } and the decision words are assumed.
 */
export async function decideApplication(id, decision, { reason, preview, idempotencyKey } = {}) {
  // The API answers `{ status }`, and its four values are the past-tense ones:
  // shortlisted / waitlisted / accepted / rejected. The screen's verbs
  // (shortlist / waitlist / accept / reject) are the same act, so they are
  // mapped here rather than in every caller.
  const status = DECISION_RESULT[decision] || decision;
  const path = REVIEW_ENDPOINTS.decision(id);
  const res = preview
    ? await previewCall(() => mockDecide(id, { decision, ...(reason ? { reason } : {}) }, { idempotencyKey }), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body: { status, ...(reason ? { reason } : {}) }, headers: idempotencyHeaders(idempotencyKey) });
  return normalizeApplication(unwrapApiData(res));
}

/** Codes that mean "capacity is full" (Scenario 5). TODO(api): exact codes. */
export const CAPACITY_CODES = ['PROJECT_CAPACITY_FULL', 'ROLE_CAPACITY_FULL', 'CAPACITY_FULL'];
export const isCapacityError = (err) => CAPACITY_CODES.includes(String(err?.code || '').toUpperCase());
