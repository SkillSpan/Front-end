/*
 * PREVIEW / TEST BACKEND — in memory, never used for a signed-in company.
 *
 * It answers the same requests the four Sprint 4 API modules send to the
 * real server and applies the sprint document's rules, so every preview
 * screen and every test exercises real behaviour (state rules, capacity,
 * idempotent decisions, atomic start) instead of static pictures:
 *   US-PRJ-01  create / update draft / submit (moderation or owner approval)
 *   US-PRJ-02  list + filters + search + sort + pagination, detail,
 *              transitions (SRS Table 70), clone, archive read-only
 *   US-MATCH-03 applications list/detail, decisions + capacity + idempotency
 *   US-MATCH-04 team view, assignments, critical-skill exception,
 *              invitations, responses, waitlist promotion, start (atomic)
 * Errors are thrown in api.js's shape: { status, message, code, errors, details }.
 */
import { SAMPLE_APPLICATIONS, SAMPLE_PROJECTS, SAMPLE_RUBRICS, SAMPLE_TEAM } from './projectsMock';
import { TRANSITIONS, ACTIONS, isEditable, isCloneable } from './lifecycle';
import { completeness, projectToForm } from './projectForm';

const clone = (v) => JSON.parse(JSON.stringify(v));
const now = () => new Date().toISOString();
const ACTOR = { id: 0, name: 'Lina Haddad' };

let db;
let seq;
let idempotency;
// Approval policy (PRJ-03, OQ-02): 'moderation' (default) or 'owner_approval'.
let policy = 'moderation';

export function resetMockBackend({ approvalPolicy = 'moderation' } = {}) {
  db = {
    projects: clone(SAMPLE_PROJECTS),
    applications: clone(SAMPLE_APPLICATIONS),
    team: clone(SAMPLE_TEAM),
  };
  seq = 100;
  idempotency = new Map();
  policy = approvalPolicy;
}
resetMockBackend();

export function mockApprovalPolicy() { return policy; }

function fail(status, code, message, extra = {}) {
  const err = { status, code, message, errors: extra.errors || {}, details: extra.details };
  throw err;
}

const findProject = (id) => {
  const p = db.projects.find((x) => String(x.id) === String(id));
  if (!p) fail(404, 'PROJECT_NOT_FOUND', 'This project does not exist or does not belong to your organization.');
  return p;
};

function remember(key, fn) {
  if (key && idempotency.has(key)) return clone(idempotency.get(key));
  const result = fn();
  if (key) idempotency.set(key, clone(result));
  return result;
}

function record(project, to, reason) {
  project.status_history = project.status_history || [];
  project.status_history.push({ from: project.status, to, actor: ACTOR, reason: reason || '', at: now() });
  project.status = to;
  project.updated_at = now();
}

const acceptedCount = (projectId, roleId) => db.applications.filter((a) => a.project_id === projectId && a.status === 'accepted' && (roleId == null || a.requested_role?.id === roleId)).length;

function refreshCapacity(project) {
  const accepted = acceptedCount(project.id);
  project.capacity_state = { accepted, total: project.capacity, remaining: Math.max(0, (project.capacity || 0) - accepted) };
}

function withPolicy(project) {
  return { ...clone(project), approval_policy: policy };
}

/* ------------------------------------------------------------------ */
/* US-PRJ-02 — list + detail                                           */
/* ------------------------------------------------------------------ */

export function mockListProjects({ page = 1, perPage = 10, state = '', search = '', sort = 'updated_desc' } = {}) {
  let rows = db.projects.slice();
  if (state) {
    const states = String(state).split(',');
    rows = rows.filter((p) => states.includes(p.status));
  }
  if (search) {
    const q = String(search).trim().toLowerCase();
    rows = rows.filter((p) => p.title.toLowerCase().includes(q));
  }
  const cmp = {
    updated_desc: (a, b) => String(b.updated_at).localeCompare(String(a.updated_at)),
    deadline_asc: (a, b) => String(a.application_deadline || '9999').localeCompare(String(b.application_deadline || '9999')),
    title_asc: (a, b) => a.title.localeCompare(b.title),
    created_desc: (a, b) => String(b.created_at).localeCompare(String(a.created_at)),
  }[sort] || (() => 0);
  rows.sort(cmp);
  const total = rows.length;
  const size = Math.max(1, Number(perPage) || 10);
  const lastPage = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Number(page) || 1), lastPage);
  const counts = {};
  db.projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  return {
    data: rows.slice((current - 1) * size, current * size).map((p) => ({
      id: p.id, title: p.title, project_type: p.project_type, status: p.status, domain: p.domain,
      application_deadline: p.application_deadline, capacity: p.capacity, capacity_state: p.capacity_state,
      applications_count: p.applications_count, updated_at: p.updated_at,
    })),
    meta: { current_page: current, per_page: size, total, last_page: lastPage, status_counts: counts },
  };
}

export function mockGetProject(id) {
  const p = findProject(id);
  refreshCapacity(p);
  return { data: withPolicy(p) };
}

/* ------------------------------------------------------------------ */
/* US-PRJ-01 — create, update, submit                                  */
/* ------------------------------------------------------------------ */

function applyPayload(project, payload) {
  const rubric = SAMPLE_RUBRICS.find((r) => String(r.id) === String(payload.rubric_id));
  Object.assign(project, {
    ...payload,
    required_skills: (payload.required_skills || []).map((s) => ({ ...s, skill_name: s.skill_name || `Skill ${s.skill_id}` })),
    roles: (payload.roles || []).map((r, i) => ({ id: r.id || `r${i + 1}`, ...r })),
    rubric: rubric ? { id: rubric.id, name: rubric.name, version: rubric.version, status: rubric.status } : null,
    updated_at: now(),
  });
}

export function mockCreateProject(payload, { idempotencyKey, names } = {}) {
  return remember(idempotencyKey, () => {
    if (!payload?.title) fail(422, 'PROJECT_VALIDATION_FAILED', 'The project could not be saved.', { errors: { title: ['A project title is required.'] } });
    seq += 1;
    const project = { id: `p${seq}`, status: 'draft', version: 1, applications_count: 0, created_at: now(), status_history: [{ from: null, to: 'draft', actor: ACTOR, at: now() }] };
    applyPayload(project, withNames(payload, names));
    refreshCapacity(project);
    db.projects.push(project);
    return { data: withPolicy(project) };
  });
}

function withNames(payload, names = {}) {
  return {
    ...payload,
    required_skills: (payload.required_skills || []).map((s) => ({ ...s, skill_name: names[s.skill_id] || s.skill_name })),
  };
}

export function mockUpdateProject(id, payload, { names } = {}) {
  const p = findProject(id);
  if (!isEditable(p.status)) fail(409, 'PROJECT_NOT_EDITABLE', 'Only Draft and Changes Requested projects can be edited.');
  const accepted = acceptedCount(p.id);
  if (payload.capacity != null && payload.capacity < accepted) {
    fail(422, 'CAPACITY_BELOW_ACCEPTED', 'Capacity cannot be lower than the number of accepted participants.', { errors: { capacity: [`At least ${accepted} — participants are already accepted.`] } });
  }
  // BR-09 / Scenario 5: material change after applications exist → new version.
  const material = (p.applications_count || 0) > 0;
  applyPayload(p, withNames(payload, names));
  if (material) p.version = (p.version || 1) + 1;
  refreshCapacity(p);
  return { data: withPolicy(p), meta: { material_change: material, version: p.version } };
}

export function mockSubmitProject(id, { idempotencyKey } = {}) {
  return remember(idempotencyKey, () => {
    const p = findProject(id);
    if (!['draft', 'changes_requested'].includes(p.status)) fail(409, 'INVALID_TRANSITION', `A ${p.status.replace('_', ' ')} project cannot be submitted.`);
    const check = completeness(projectToForm(p));
    if (!check.complete) {
      fail(422, 'PROJECT_INCOMPLETE', 'The project is missing required information.', { details: { missing: check.missing.map((m) => m.field) } });
    }
    p.submitted_at = now();
    if (policy === 'owner_approval') {
      // BR-13: complete project → Approved, approver metadata recorded.
      record(p, 'approved', 'Owner approval (policy)');
      p.approval = { status: 'approved', approver: ACTOR, decided_at: now(), policy };
    } else {
      record(p, 'submitted');
      p.approval = { status: 'pending' };
    }
    return { data: withPolicy(p) };
  });
}

/* ------------------------------------------------------------------ */
/* US-PRJ-02 — transitions + clone                                     */
/* ------------------------------------------------------------------ */

export function mockTransition(id, { action, reason } = {}) {
  const p = findProject(id);
  const allowed = TRANSITIONS[p.status] || [];
  if (!allowed.includes(action) || ACTIONS[action]?.endpoint !== 'transition') {
    fail(409, 'INVALID_TRANSITION', 'This action is not allowed in the project’s current state.', { details: { from: p.status, action } });
  }
  if (action === 'cancel' && !String(reason || '').trim()) {
    fail(422, 'REASON_REQUIRED', 'A reason is required to cancel a project.', { errors: { reason: ['Please give a reason.'] } });
  }
  if (action === 'open') {
    if (!p.rubric || p.rubric.status !== 'approved') fail(422, 'RUBRIC_REQUIRED', 'An approved evaluation rubric is required before the project can open.');
    const check = completeness(projectToForm(p));
    if (!check.complete) fail(422, 'PROJECT_INCOMPLETE', 'The project is missing required information.', { details: { missing: check.missing.map((m) => m.field) } });
  }
  const to = ACTIONS[action].to;
  record(p, to, reason);
  if (to === 'archived') p.archived_at = now();
  if (action === 'revise') p.approval = null;
  return { data: withPolicy(p) };
}

export function mockCloneProject(id, { idempotencyKey } = {}) {
  return remember(idempotencyKey, () => {
    const src = findProject(id);
    if (!isCloneable(src.status)) fail(409, 'CLONE_NOT_ALLOWED', 'Only approved projects can be cloned.');
    seq += 1;
    const copy = clone(src);
    Object.assign(copy, {
      id: `p${seq}`, title: `${src.title} (copy)`, status: 'draft', version: 1, cloned_from: { id: src.id, title: src.title },
      applications_count: 0, capacity_state: { accepted: 0, total: src.capacity, remaining: src.capacity },
      approval: null, submitted_at: null, archived_at: null, created_at: now(), updated_at: now(),
      status_history: [{ from: null, to: 'draft', actor: ACTOR, reason: `Cloned from ${src.title}`, at: now() }],
    });
    db.projects.push(copy);
    return { data: withPolicy(copy) };
  });
}

/* ------------------------------------------------------------------ */
/* US-MATCH-03 — applications + decisions                              */
/* ------------------------------------------------------------------ */

export const DECISIONS = { shortlist: 'shortlisted', waitlist: 'waitlisted', accept: 'accepted', reject: 'rejected' };
// OQ-07 (sprint assumption): allowed application transitions.
export const DECISION_FROM = {
  submitted: ['shortlist', 'waitlist', 'accept', 'reject'],
  shortlisted: ['waitlist', 'accept', 'reject'],
  waitlisted: ['accept', 'reject'],
};

export function mockListApplications(projectId, { status = '', sort = 'submitted_desc', page = 1, perPage = 10 } = {}) {
  const p = findProject(projectId);
  let rows = db.applications.filter((a) => a.project_id === p.id);
  const counts = {};
  rows.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
  if (status) {
    const set = String(status).split(',');
    rows = rows.filter((a) => set.includes(a.status));
  }
  const cmp = {
    submitted_desc: (a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)),
    submitted_asc: (a, b) => String(a.submitted_at).localeCompare(String(b.submitted_at)),
    name_asc: (a, b) => a.applicant.name.localeCompare(b.applicant.name),
  }[sort] || (() => 0);
  rows.sort(cmp);
  const total = rows.length;
  const size = Math.max(1, Number(perPage) || 10);
  const lastPage = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Number(page) || 1), lastPage);
  refreshCapacity(p);
  return {
    data: rows.slice((current - 1) * size, current * size).map((a) => ({
      id: a.id, status: a.status, submitted_at: a.submitted_at, project_version: a.project_version,
      requested_role: a.requested_role, applicant: { id: a.applicant.id, name: a.applicant.name, headline: a.applicant.headline },
    })),
    meta: {
      current_page: current, per_page: size, total, last_page: lastPage, status_counts: counts,
      project: { id: p.id, title: p.title, status: p.status, capacity: p.capacity, capacity_state: p.capacity_state, roles: roleCapacity(p) },
    },
  };
}

function roleCapacity(p) {
  return (p.roles || []).map((r) => ({ id: r.id, name: r.name, capacity: r.capacity, accepted: acceptedCount(p.id, r.id) }));
}

export function mockGetApplication(id) {
  const a = db.applications.find((x) => x.id === id);
  if (!a) fail(404, 'APPLICATION_NOT_FOUND', 'This application does not exist or belongs to another organization.');
  const p = findProject(a.project_id);
  refreshCapacity(p);
  const required = (p.required_skills || []).map((s) => s.skill_id);
  return {
    data: {
      ...clone(a),
      // Only skills relevant to the project's required skills (US-MATCH-03 Application View).
      skills: a.skills.filter((s) => required.includes(s.skill_id)).map((s) => ({ ...s, required_level: p.required_skills.find((r) => r.skill_id === s.skill_id)?.minimum_required_level, is_critical_entry: p.required_skills.find((r) => r.skill_id === s.skill_id)?.is_critical_entry })),
      allowed_decisions: DECISION_FROM[a.status] || [],
      project: { id: p.id, title: p.title, status: p.status, version: p.version, capacity: p.capacity, capacity_state: p.capacity_state, roles: roleCapacity(p) },
    },
  };
}

export function mockDecide(id, { decision, reason } = {}, { idempotencyKey } = {}) {
  return remember(idempotencyKey, () => {
    const a = db.applications.find((x) => x.id === id);
    if (!a) fail(404, 'APPLICATION_NOT_FOUND', 'This application does not exist or belongs to another organization.');
    if (['withdrawn', 'expired'].includes(a.status)) fail(409, 'APPLICATION_NOT_DECIDABLE', `A ${a.status} application cannot receive a decision.`);
    if (!(DECISION_FROM[a.status] || []).includes(decision)) fail(409, 'INVALID_APPLICATION_TRANSITION', 'This decision is not allowed for the application’s current status.');
    const p = findProject(a.project_id);
    if (decision === 'accept') {
      refreshCapacity(p);
      if (p.capacity_state.remaining <= 0) fail(409, 'PROJECT_CAPACITY_FULL', 'The project is full. You can waitlist this applicant instead.');
      const role = p.roles.find((r) => r.id === a.requested_role?.id);
      if (role && acceptedCount(p.id, role.id) >= role.capacity) fail(409, 'ROLE_CAPACITY_FULL', `The ${role.name} role is full. You can waitlist this applicant instead.`, { details: { role_id: role.id } });
    }
    const to = DECISIONS[decision];
    a.decision_history.push({ from: a.status, to, actor: ACTOR, reason: reason || '', at: now() });
    a.status = to;
    refreshCapacity(p);
    return mockGetApplication(id);
  });
}

/* ------------------------------------------------------------------ */
/* US-MATCH-04 — team formation + start                                */
/* ------------------------------------------------------------------ */

function teamOf(projectId) {
  if (!db.team[projectId]) db.team[projectId] = { assignments: [], conflicts: {}, exceptions: [] };
  return db.team[projectId];
}

function criticalGaps(p, a) {
  return (p.required_skills || []).filter((s) => s.is_critical_entry).map((s) => {
    const mine = a.skills.find((x) => x.skill_id === s.skill_id);
    return { skill_id: s.skill_id, skill_name: s.skill_name, required_level: s.minimum_required_level, level: mine?.level ?? 0 };
  }).filter((g) => g.level < g.required_level);
}

export function mockGetTeam(projectId) {
  const p = findProject(projectId);
  const team = teamOf(p.id);
  const accepted = db.applications.filter((a) => a.project_id === p.id && a.status === 'accepted');
  const participants = accepted.map((a) => {
    const asg = team.assignments.find((x) => x.application_id === a.id && x.invitation?.status !== 'declined');
    const exception = team.exceptions.find((x) => x.application_id === a.id) || null;
    const declined = !asg && team.assignments.some((x) => x.application_id === a.id && x.invitation?.status === 'declined');
    return {
      application_id: a.id, learner: a.applicant, requested_role: a.requested_role,
      critical_gaps: criticalGaps(p, a), exception, declined_invitation: declined,
      conflict: team.conflicts[a.id] || null,
      assignment: asg ? { id: asg.id, role_id: asg.role_id, status: asg.status, invitation: asg.invitation || null } : null,
    };
  });
  const roles = (p.roles || []).map((r) => {
    const mine = team.assignments.filter((x) => x.role_id === r.id && x.invitation?.status !== 'declined');
    return {
      id: r.id, name: r.name, capacity: r.capacity, min_required: r.min_required ?? 1,
      assigned: mine.length, confirmed: mine.filter((x) => x.invitation?.status === 'accepted').length,
      remaining: Math.max(0, r.capacity - mine.length),
    };
  });
  const unfilled = roles.filter((r) => r.confirmed < r.min_required).map((r) => ({ id: r.id, name: r.name, needed: r.min_required - r.confirmed }));
  const waitlist = db.applications.filter((a) => a.project_id === p.id && a.status === 'waitlisted').map((a) => ({ application_id: a.id, learner: a.applicant, requested_role: a.requested_role }));
  return {
    data: {
      project: { id: p.id, title: p.title, status: p.status, start_date: p.start_date, capacity: p.capacity },
      roles, participants, waitlist,
      composition: { valid: unfilled.length === 0, unfilled_roles: unfilled },
      workspace: p.workspace || null,
    },
  };
}

export function mockAssign(projectId, { members = [] } = {}) {
  const p = findProject(projectId);
  if (p.status !== 'selection') fail(409, 'PROJECT_NOT_IN_SELECTION', 'Team formation is available while the project is in Selection.');
  const team = teamOf(p.id);
  // Mirrors the real request: `members: [{ application_id, project_role_id }]`.
  members.forEach(({ application_id: appId, project_role_id: roleId, exception }) => {
    const a = db.applications.find((x) => x.id === appId && x.project_id === p.id);
    if (!a || a.status !== 'accepted') fail(422, 'NOT_ACCEPTED', 'Only accepted applicants can be assigned to a role.');
    const role = p.roles.find((r) => r.id === roleId);
    if (!role) fail(422, 'ROLE_NOT_FOUND', 'This role does not exist on the project.');
    if (team.conflicts[appId]) fail(409, 'CONFLICTING_ASSIGNMENT', `${a.applicant.name} already has an active assignment on another project.`, { details: { application_id: appId } });
    const current = team.assignments.filter((x) => x.role_id === roleId && x.application_id !== appId && x.invitation?.status !== 'declined').length;
    if (current >= role.capacity) fail(409, 'ROLE_CAPACITY_FULL', `The ${role.name} role is full.`, { details: { role_id: roleId } });
    const gaps = criticalGaps(p, a);
    const approved = team.exceptions.find((x) => x.application_id === appId && x.status === 'approved');
    if (gaps.length && !approved) {
      if (exception?.support && exception?.risk) {
        // OQ / BR-06: "approved according to configuration" — the preview approves at once.
        team.exceptions.push({ application_id: appId, support: exception.support, risk: exception.risk, status: 'approved', approver: ACTOR, at: now() });
      } else {
        fail(422, 'CRITICAL_SKILL_NOT_MET', `${a.applicant.name} does not meet a critical-entry skill.`, { details: { application_id: appId, gaps } });
      }
    }
    const existing = team.assignments.find((x) => x.application_id === appId && x.invitation?.status !== 'declined');
    if (existing) { existing.role_id = roleId; existing.status = 'assigned'; existing.invitation = null; } else {
      seq += 1;
      team.assignments.push({ id: `t${seq}`, application_id: appId, role_id: roleId, status: 'assigned', invitation: null });
    }
  });
  return mockGetTeam(p.id);
}

export function mockUnassign(projectId, applicationId) {
  const p = findProject(projectId);
  const team = teamOf(p.id);
  team.assignments = team.assignments.filter((x) => !(x.application_id === applicationId && x.invitation?.status !== 'accepted'));
  return mockGetTeam(p.id);
}

export function mockSendInvitations(projectId, { idempotencyKey } = {}) {
  return remember(idempotencyKey, () => {
    const p = findProject(projectId);
    const team = teamOf(p.id);
    team.assignments.filter((x) => x.status === 'assigned' && !x.invitation).forEach((x) => {
      seq += 1;
      x.status = 'invited';
      x.invitation = { id: `inv${seq}`, status: 'pending', sent_at: now() };
    });
    return mockGetTeam(p.id);
  });
}

export function mockRespondInvitation(invitationId, { response } = {}) {
  for (const [projectId, team] of Object.entries(db.team)) {
    const asg = team.assignments.find((x) => x.invitation?.id === invitationId);
    if (asg) {
      if (asg.invitation.status !== 'pending') fail(409, 'INVITATION_ALREADY_ANSWERED', 'This invitation was already answered.');
      asg.invitation.status = response === 'accepted' ? 'accepted' : 'declined';
      asg.invitation.responded_at = now();
      asg.status = response === 'accepted' ? 'confirmed' : 'declined';
      return { data: { id: invitationId, status: asg.invitation.status, project_id: projectId } };
    }
  }
  return fail(404, 'INVITATION_NOT_FOUND', 'Invitation not found.');
}

export function mockGetInvitation(invitationId) {
  for (const [projectId, team] of Object.entries(db.team)) {
    const asg = team.assignments.find((x) => x.invitation?.id === invitationId);
    if (asg) {
      const p = findProject(projectId);
      const role = p.roles.find((r) => r.id === asg.role_id);
      return { data: { id: invitationId, status: asg.invitation.status, sent_at: asg.invitation.sent_at, role: role ? { id: role.id, name: role.name } : null, project: { id: p.id, title: p.title, start_date: p.start_date, end_date: p.end_date, work_mode: p.work_mode, organization: { name: 'Nova Tech' } } } };
    }
  }
  return fail(404, 'INVITATION_NOT_FOUND', 'Invitation not found.');
}

export function mockStartProject(projectId, { idempotencyKey } = {}) {
  return remember(idempotencyKey, () => {
    const p = findProject(projectId);
    if (p.status !== 'selection') fail(409, 'INVALID_TRANSITION', 'Only a project in Selection can start.');
    const view = mockGetTeam(p.id).data;
    if (!view.composition.valid) {
      fail(422, 'TEAM_COMPOSITION_INSUFFICIENT', 'Some required roles are not filled yet.', { details: { unfilled_roles: view.composition.unfilled_roles } });
    }
    // BR-13: team, workspace record and the Active transition together, or nothing.
    seq += 1;
    p.workspace = { id: `ws${seq}`, created_at: now() };
    p.team_id = `team${seq}`;
    record(p, 'active', 'Team confirmed');
    return { data: withPolicy(p) };
  });
}

// Preview helpers ------------------------------------------------------

/** Preview-only: show one project in another state (status displays for Figma / screenshots). */
export function mockForceState(id, state, extra = {}) {
  const p = findProject(id);
  p.status = state;
  Object.assign(p, extra);
  return p;
}

/** Preview-only: mark an accepted participant as already on another active team (BR-07). */
export function mockAddConflict(projectId, applicationId, other) {
  teamOf(projectId).conflicts[applicationId] = other;
}
