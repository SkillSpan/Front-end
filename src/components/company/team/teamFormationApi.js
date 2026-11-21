/*
 * US-MATCH-04 — Team Formation & Project Start: API module.
 * Requirements: MATCH-06, PRJ-05, PRJ-06, WRK-01 (workspace record only), NOT-01,
 * NFR-REL-02, SRS Table 71 (rules 03, 04, 05, 08), UC-08.
 *
 * ENDPOINTS — the three in the sprint document's API section, plus three the
 * screens need that the document does not name (marked ASSUMED). TODO(api):
 * confirm all of them with the backend's projects guide.
 */
import { apiKey } from '../../../cache/queryCache';
import {
  mockAssign, mockGetInvitation, mockGetTeam, mockRespondInvitation, mockSendInvitations, mockStartProject, mockUnassign,
} from '../projects/mockBackend';
import { decideApplication } from '../applications/applicationReviewApi';
import { idempotencyHeaders, liveCall, previewCall, unwrapApiData } from '../projects/api/shared';

export const TEAM_ENDPOINTS = {
  // Sprint doc US-MATCH-04 API — TODO(api): confirm.
  assignments: (projectId) => `/api/v1/projects/${encodeURIComponent(projectId)}/team/assignments`, // POST { assignments: [{ application_id, role_id, exception? }] }
  respond: (invitationId) => `/api/v1/team-invitations/${encodeURIComponent(invitationId)}/response`, // POST { response: accepted | declined }
  start: (projectId) => `/api/v1/projects/${encodeURIComponent(projectId)}/start`, // POST → { data: project (active) }
  // TODO(api, ASSUMED — not in the sprint doc): the Team Formation view
  // (roles + remaining capacity, accepted participants, assignments, invitations, waitlist).
  team: (projectId) => `/api/v1/projects/${encodeURIComponent(projectId)}/team`,
  // TODO(api, ASSUMED): "Send Invitations" (Scenario 2) for the assigned participants.
  invitations: (projectId) => `/api/v1/projects/${encodeURIComponent(projectId)}/team/invitations`,
  // TODO(api, ASSUMED): remove an assignment that has not been confirmed yet.
  unassign: (projectId, applicationId) => `/api/v1/projects/${encodeURIComponent(projectId)}/team/assignments/${encodeURIComponent(applicationId)}`,
  // TODO(api, ASSUMED): the learner's invitation (accept / decline view).
  invitation: (invitationId) => `/api/v1/team-invitations/${encodeURIComponent(invitationId)}`,
};

const v = (preview) => (preview ? { variant: 'preview' } : undefined);
export const teamKeys = {
  team: (projectId, preview) => apiKey(`/api/v1/projects/${projectId}/team`, null, v(preview)),
  invitation: (id, preview) => apiKey(`/api/v1/team-invitations/${id}`, null, v(preview)),
};

// Invitation / assignment words shown on screen (UC-08).
export const INVITATION_TONE = { pending: 'amber', accepted: 'green', declined: 'red' };

/** GET team → what the screen reads. Unknown fields are left out, never invented. */
export function normalizeTeam(t = {}) {
  const roles = (t.roles || []).map((r) => {
    const capacity = Number(r.capacity) || 0;
    const assigned = Number(r.assigned ?? 0);
    return {
      id: r.id, name: r.name || '', capacity,
      minRequired: Number(r.min_required ?? r.minimum ?? 1),
      assigned, confirmed: Number(r.confirmed ?? 0),
      remaining: r.remaining != null ? Number(r.remaining) : Math.max(0, capacity - assigned),
    };
  });
  const participants = (t.participants || []).map((p) => ({
    applicationId: p.application_id,
    name: p.learner?.name ?? p.name ?? '',
    headline: p.learner?.headline ?? '',
    requestedRole: p.requested_role ?? null,
    gaps: (p.critical_gaps || []).map((g) => ({ name: g.skill_name, required: g.required_level, level: g.level })),
    exception: p.exception || null,
    conflict: p.conflict || null,
    declined: Boolean(p.declined_invitation), // TODO(api, ASSUMED): flag for a participant who declined the invitation
    assignment: p.assignment ? {
      id: p.assignment.id, roleId: p.assignment.role_id, status: p.assignment.status,
      invitation: p.assignment.invitation ? { id: p.assignment.invitation.id, status: p.assignment.invitation.status, at: p.assignment.invitation.responded_at || p.assignment.invitation.sent_at || null } : null,
    } : null,
  }));
  const comp = t.composition || {};
  return {
    project: t.project ? { id: t.project.id, title: t.project.title, status: t.project.status, startDate: t.project.start_date } : null,
    roles,
    participants,
    waitlist: (t.waitlist || []).map((w) => ({ applicationId: w.application_id, name: w.learner?.name ?? w.name ?? '', requestedRole: w.requested_role ?? null })),
    composition: { valid: Boolean(comp.valid), unfilled: (comp.unfilled_roles || []).map((u) => ({ id: u.id, name: u.name, needed: Number(u.needed ?? 1) })) },
    workspace: t.workspace || null,
  };
}

export async function getTeam(projectId, { preview } = {}) {
  const res = preview ? await previewCall(() => mockGetTeam(projectId)) : await liveCall(TEAM_ENDPOINTS.team(projectId));
  return normalizeTeam(unwrapApiData(res));
}

/** Assign accepted participants to roles (Scenario 1). `exception` = { support, risk } (Scenario 4, BR-06). */
export async function assignToRoles(projectId, assignments, { preview } = {}) {
  // The API names the array `members` and each row `{ application_id,
  // project_role_id }` — the role is identified, and the server resolves the
  // title itself so a screen never has to look the name up first.
  const body = {
    members: assignments.map((a) => ({
      application_id: a.applicationId,
      project_role_id: a.roleId,
      ...(a.exception ? { exception: { support: a.exception.support, risk: a.exception.risk } } : {}),
    })),
  };
  const path = TEAM_ENDPOINTS.assignments(projectId);
  const res = preview
    ? await previewCall(() => mockAssign(projectId, body), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body });
  // The server may answer with the team or with only the assignments — refetch then.
  const data = unwrapApiData(res);
  return data?.roles ? normalizeTeam(data) : getTeam(projectId, { preview });
}

export async function removeAssignment(projectId, applicationId, { preview } = {}) {
  const path = TEAM_ENDPOINTS.unassign(projectId, applicationId);
  const res = preview
    ? await previewCall(() => mockUnassign(projectId, applicationId), { method: 'DELETE', path })
    : await liveCall(path, { method: 'DELETE' });
  const data = unwrapApiData(res);
  return data?.roles ? normalizeTeam(data) : getTeam(projectId, { preview });
}

/** Send Invitations (Scenario 2, BR-08). */
export async function sendInvitations(projectId, { preview, idempotencyKey } = {}) {
  const path = TEAM_ENDPOINTS.invitations(projectId);
  const res = preview
    ? await previewCall(() => mockSendInvitations(projectId, { idempotencyKey }), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', headers: idempotencyHeaders(idempotencyKey) });
  const data = unwrapApiData(res);
  return data?.roles ? normalizeTeam(data) : getTeam(projectId, { preview });
}

/**
 * Waitlist promotion (BR-09, AC-08): accepting a waitlisted application through
 * US-MATCH-03's decision endpoint — no extra route. The accepted learner then
 * appears among the participants to assign.
 */
export async function promoteFromWaitlist(applicationId, { preview, idempotencyKey } = {}) {
  return decideApplication(applicationId, 'accept', { preview, idempotencyKey, reason: 'Promoted from the waitlist' });
}

/** Start Project (Scenario 5) — team + workspace + Active, atomically on the server (BR-13). */
export async function startProject(projectId, { preview, idempotencyKey } = {}) {
  const path = TEAM_ENDPOINTS.start(projectId);
  const res = preview
    ? await previewCall(() => mockStartProject(projectId, { idempotencyKey }), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', headers: idempotencyHeaders(idempotencyKey) });
  return unwrapApiData(res);
}

/* Learner side (AC-07) ----------------------------------------------- */

export async function getInvitation(id, { preview } = {}) {
  const res = preview ? await previewCall(() => mockGetInvitation(id)) : await liveCall(TEAM_ENDPOINTS.invitation(id));
  return unwrapApiData(res);
}

export async function respondToInvitation(id, response, { preview } = {}) {
  const body = { response };
  const path = TEAM_ENDPOINTS.respond(id);
  const res = preview
    ? await previewCall(() => mockRespondInvitation(id, body), { method: 'POST', path })
    : await liveCall(path, { method: 'POST', body });
  return unwrapApiData(res);
}

export const COMPOSITION_CODES = ['TEAM_COMPOSITION_INSUFFICIENT'];
export const CRITICAL_SKILL_CODES = ['CRITICAL_SKILL_NOT_MET'];
export const CONFLICT_CODES = ['CONFLICTING_ASSIGNMENT'];
