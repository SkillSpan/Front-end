/*
 * Project lifecycle — the single source of truth on the frontend for what a
 * company representative may do with a project in each state.
 *
 * US-PRJ-02 "Company Lifecycle Actions" (SRS Table 70, PRJ-05). The table below
 * is the sprint document's table, row for row:
 *
 *   Current state      Allowed company action                    Resulting state
 *   Draft              Submit / Cancel                           Submitted / Cancelled
 *   Submitted          Cancel                                    Cancelled
 *   Changes Requested  Revise and resubmit / Cancel              Submitted / Cancelled
 *   Approved           Open (scheduled or authorized) / Cancel   Open / Cancelled
 *   Open               Move to Selection / Cancel                Selection / Cancelled
 *   Selection          Reopen applications / Start project       Open / Active / Cancelled
 *                      (US-MATCH-04) / Cancel
 *   Rejected           Revise as new draft / Archive             Draft / Archived
 *   Cancelled          Archive                                   Archived
 *   Completed          Archive                                   Archived
 *
 * Moderation (Submitted → Approved / Changes Requested / Rejected) is an
 * administrator action and Active → Under Review / Completed belong to
 * execution — none of them is offered here (outside Sprint 4).
 *
 * The UI only OFFERS these actions; the backend still validates every
 * transition (BR-02, AC-10) and its refusal is shown as is (Scenario 8).
 * Status words follow the approved project status dictionary (SRS Table 75).
 */

export const PROJECT_STATES = [
  'draft', 'submitted', 'changes_requested', 'approved',
  'open', 'selection', 'active', 'under_review',
  'completed', 'rejected', 'cancelled', 'archived',
];

// Same three groups as the dashboard's "Projects by state" card (US-COMP-03).
export const STATE_GROUPS = [
  { key: 'preparing', states: ['draft', 'submitted', 'changes_requested', 'approved'] },
  { key: 'live', states: ['open', 'selection', 'active', 'under_review'] },
  { key: 'closed', states: ['completed', 'rejected', 'cancelled', 'archived'] },
];

// Pill tone per state (text always carries the state too — never colour only).
export const STATE_TONE = {
  draft: 'gray', submitted: 'violet', changes_requested: 'amber', approved: 'green',
  open: 'blue', selection: 'violet', active: 'green', under_review: 'blue',
  completed: 'gray', rejected: 'red', cancelled: 'red', archived: 'gray',
};

/*
 * action → { to, endpoint, reason, confirm }
 *   endpoint  'submit'     POST /api/v1/projects/{id}/submit       (US-PRJ-01)
 *             'transition' POST /api/v1/projects/{id}/transitions  (US-PRJ-02)
 *             'start'      POST /api/v1/projects/{id}/start        (US-MATCH-04)
 *             'edit'       opens the form (Draft / Changes Requested only)
 *   reason    'required' (Cancel, BR-10) | 'optional' | undefined
 */
export const ACTIONS = {
  submit: { to: 'submitted', endpoint: 'submit', tone: 'pri' },
  resubmit: { to: 'submitted', endpoint: 'submit', tone: 'pri' },
  open: { to: 'open', endpoint: 'transition', tone: 'pri', reason: 'optional' },
  move_to_selection: { to: 'selection', endpoint: 'transition', tone: 'pri', reason: 'optional' },
  reopen: { to: 'open', endpoint: 'transition', tone: 'sec', reason: 'optional' },
  start: { to: 'active', endpoint: 'start', tone: 'pri' },
  revise: { to: 'draft', endpoint: 'transition', tone: 'pri', reason: 'optional' },
  archive: { to: 'archived', endpoint: 'transition', tone: 'sec', reason: 'optional' },
  cancel: { to: 'cancelled', endpoint: 'transition', tone: 'danger', reason: 'required' },
};

// SRS Table 70 — company actions per state, in the order the buttons appear.
export const TRANSITIONS = {
  draft: ['submit', 'cancel'],
  submitted: ['cancel'],
  changes_requested: ['resubmit', 'cancel'],
  approved: ['open', 'cancel'],
  open: ['move_to_selection', 'cancel'],
  selection: ['start', 'reopen', 'cancel'],
  active: [],
  under_review: [],
  rejected: ['revise', 'archive'],
  cancelled: ['archive'],
  completed: ['archive'],
  archived: [],
};

// BR-04: only Draft and Changes Requested are editable by their owner.
export const EDITABLE_STATES = ['draft', 'changes_requested'];

// BR-11 / AC-08: "Authorized users can clone an approved project into a new draft."
// ASSUMPTION (listed in CHANGES.md): "approved project" = a project that passed
// moderation, so every state after Approved can be cloned too. The backend decides.
export const CLONEABLE_STATES = ['approved', 'open', 'selection', 'active', 'under_review', 'completed'];

// BR-12: archived projects are read-only historical records.
export const READ_ONLY_STATES = ['archived'];

// States where applications exist / can be reviewed (US-MATCH-03).
export const APPLICATION_STATES = ['open', 'selection', 'active', 'under_review', 'completed', 'cancelled', 'archived'];

export function allowedActions(state) {
  return TRANSITIONS[state] || [];
}

export function canTransition(state, action) {
  return allowedActions(state).includes(action);
}

export function isEditable(state) {
  return EDITABLE_STATES.includes(state);
}

export function isCloneable(state) {
  return CLONEABLE_STATES.includes(state);
}

export function targetState(action) {
  return ACTIONS[action]?.to || null;
}
