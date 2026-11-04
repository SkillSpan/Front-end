/*
 * SAMPLE DATA — FOR DESIGN PREVIEW ONLY.
 * "Nova Tech", "Lina Haddad" and every project below are fictional. Nothing
 * here comes from the backend. The shape mirrors what the dashboard
 * components read, so wiring the real API is a matter of returning the same
 * object from companyDashboardApi.js.
 *
 * Project states follow the Sprint 4 lifecycle (US-COMP-03 / project states):
 *   Preparing: draft, submitted, changes_requested, approved
 *   Live:      open, selection, active, under_review
 *   Closed:    completed, rejected, cancelled, archived
 */

export const SAMPLE_USER = { id: 0, name: 'Lina Haddad', email: 'lina@novatech.example' };

const SAMPLE_ORGANIZATION = {
  id: 0,
  name: 'Nova Tech',
  initials: 'NT',
  industry: 'Software & IT services',
  verification_status: 'verified',
  verified_at: '2026-10-12',
  // Each step of the verification timeline (Sprint 1 registration + approval).
  verification_steps: ['registered', 'documents', 'approved'],
};

/*
 * Notification history (US-COMP-03 Section 5 + Notification History screen).
 * `link` is the screen the notification opens (Scenario 4). Only the newest
 * three are unread, so the bell, the sidebar badge and the panel agree.
 * TODO(api, to be confirmed): the real items come from GET /api/v1/notifications
 * — see normalizeNotification() in companyDashboardApi.js for the field mapping.
 */
const P = {
  clinic: 'Clinic App UX Redesign',
  retail: 'Data Dashboard for Retail',
  onboarding: 'Mobile Onboarding Flow',
  inventory: 'Inventory API',
  brand: 'Brand Identity Kit',
};
export const SAMPLE_NOTIFICATIONS = [
  { id: 'n1', type: 'application', tone: 'blue', project: P.clinic, ago: { value: 10, unit: 'minute' }, unread: true, link: '/company/applicants?project=p1' },
  { id: 'n2', type: 'changes', tone: 'amber', project: P.onboarding, ago: { value: 1, unit: 'hour' }, unread: true, link: '/company/projects/p3' },
  { id: 'n3', type: 'joined', tone: 'green', project: P.inventory, ago: { value: 3, unit: 'hour' }, unread: true, link: '/company/projects/p4' },
  { id: 'n4', type: 'open', tone: 'violet', project: P.retail, ago: { value: 1, unit: 'day' }, unread: false, link: '/company/projects/p2' },
  { id: 'n5', type: 'verified', tone: 'green', date: '2026-10-12', unread: false, link: '/company/profile' },
  { id: 'n6', type: 'application', tone: 'blue', project: P.retail, date: '2026-10-11', unread: false, link: '/company/applicants?project=p2' },
  { id: 'n7', type: 'deadline', tone: 'red', project: P.clinic, date: '2026-10-10', unread: false, link: '/company/projects/p1' },
  { id: 'n8', type: 'projectApproved', tone: 'green', project: P.retail, date: '2026-10-09', unread: false, link: '/company/projects/p2' },
  { id: 'n9', type: 'submitted', tone: 'gray', project: P.retail, date: '2026-10-08', unread: false, link: '/company/projects/p2' },
  { id: 'n10', type: 'application', tone: 'blue', project: P.clinic, date: '2026-10-08', unread: false, link: '/company/applicants?project=p1' },
  { id: 'n11', type: 'joined', tone: 'green', project: P.clinic, date: '2026-10-07', unread: false, link: '/company/projects/p1' },
  { id: 'n12', type: 'changes', tone: 'amber', project: P.brand, date: '2026-10-06', unread: false, link: '/company/projects/p5' },
  { id: 'n13', type: 'application', tone: 'blue', project: P.inventory, date: '2026-10-05', unread: false, link: '/company/applicants?project=p4' },
  { id: 'n14', type: 'open', tone: 'violet', project: P.clinic, date: '2026-10-04', unread: false, link: '/company/projects/p1' },
  { id: 'n15', type: 'projectApproved', tone: 'green', project: P.clinic, date: '2026-10-03', unread: false, link: '/company/projects/p1' },
  { id: 'n16', type: 'submitted', tone: 'gray', project: P.clinic, date: '2026-10-02', unread: false, link: '/company/projects/p1' },
  { id: 'n17', type: 'deadline', tone: 'red', project: P.inventory, date: '2026-09-30', unread: false, link: '/company/projects/p4' },
  { id: 'n18', type: 'joined', tone: 'green', project: P.inventory, date: '2026-09-28', unread: false, link: '/company/projects/p4' },
  { id: 'n19', type: 'application', tone: 'blue', project: P.inventory, date: '2026-09-26', unread: false, link: '/company/applicants?project=p4' },
  { id: 'n20', type: 'open', tone: 'violet', project: P.inventory, date: '2026-09-24', unread: false, link: '/company/projects/p4' },
  { id: 'n21', type: 'projectApproved', tone: 'green', project: P.inventory, date: '2026-09-22', unread: false, link: '/company/projects/p4' },
  { id: 'n22', type: 'submitted', tone: 'gray', project: P.inventory, date: '2026-09-21', unread: false, link: '/company/projects/p4' },
  { id: 'n23', type: 'approved', tone: 'green', date: '2026-09-20', unread: false, link: '/company/profile' },
];

/*
 * What the signed-in representative may do (Quick Links, BR-07).
 * TODO(api, to be confirmed): field names — expected on the dashboard summary
 * as `permissions`; see dashboard/quickLinks.js.
 */
export const SAMPLE_PERMISSIONS = {
  can_publish_projects: true,
  can_view_projects: true,
  can_review_applications: true,
  can_manage_profile: true,
  can_search_talent: true,
};

export const SAMPLE_DASHBOARD = {
  sample: true,
  organization: {
    ...SAMPLE_ORGANIZATION,
    profile: {
      completeness: 85,
      // key → done? (labels live in i18n: company.ws.field.<key>)
      fields: [
        { key: 'info', done: true },
        { key: 'contact', done: true },
        { key: 'address', done: true },
        { key: 'license', done: true },
        { key: 'size', done: false },
        { key: 'website', done: false },
      ],
    },
  },
  counts: { projects: 12, applicationsPending: 12, unreadNotifications: 3 },
  permissions: SAMPLE_PERMISSIONS,
  tasks: [
    { id: 't1', type: 'review', tone: 'blue', count: 12,
      projects: [{ name: 'Clinic App UX Redesign', count: 8 }, { name: 'Data Dashboard for Retail', count: 4 }] },
    { id: 't2', type: 'revise', tone: 'amber', project: 'Mobile Onboarding Flow' },
    { id: 't3', type: 'deadline', tone: 'red', days: 3, project: 'Data Dashboard for Retail', date: '2026-11-03', applications: 11 },
    { id: 't4', type: 'roles', tone: 'violet', open: 2, filled: 3, total: 5, project: 'Clinic App UX Redesign' },
    { id: 't5', type: 'invites', tone: 'green', count: 3,
      projects: [{ name: 'Clinic App UX Redesign', count: 2 }, { name: 'Inventory API', count: 1 }], sentAgo: { value: 2, unit: 'day' } },
    { id: 't6', type: 'draft', tone: 'gray', count: 1, project: 'Brand Identity Kit', date: '2026-10-28' },
  ],
  // The latest five of the notification history below (same ids, same read state).
  notifications: SAMPLE_NOTIFICATIONS.slice(0, 5),
  projectStates: {
    draft: 1, submitted: 1, changes_requested: 1, approved: 0,
    open: 2, selection: 1, active: 2, under_review: 0,
    completed: 3, rejected: 0, cancelled: 0, archived: 1,
  },
  recentProjects: [
    { id: 'p1', name: 'Clinic App UX Redesign', kind: 'real', track: 'UX/UI', state: 'selection', deadline: { date: '2026-10-25', closed: true }, filled: 3, capacity: 5 },
    { id: 'p2', name: 'Data Dashboard for Retail', kind: 'simulated', track: 'Data', state: 'open', deadline: { date: '2026-11-03' }, filled: 0, capacity: 4 },
    { id: 'p3', name: 'Mobile Onboarding Flow', kind: 'real', track: 'Mobile', state: 'changes_requested', deadline: null, filled: 0, capacity: 4 },
    { id: 'p4', name: 'Inventory API', kind: 'real', track: 'Backend', state: 'active', deadline: { date: '2026-10-10', closed: true }, filled: 4, capacity: 4 },
  ],
  funnel: {
    total: 35,
    stages: { submitted: 12, shortlisted: 5, waitlisted: 2, accepted: 6, rejected: 7, withdrawn: 2, expired: 1 },
    byProject: [
      { name: 'Clinic App UX Redesign', count: 18 },
      { name: 'Data Dashboard for Retail', count: 11 },
      { name: 'Inventory API', count: 6 },
    ],
  },
};

/* A company that was just approved and has not published anything yet. */
export const SAMPLE_DASHBOARD_EMPTY = {
  sample: true,
  organization: {
    ...SAMPLE_ORGANIZATION,
    verified_at: '2026-10-31',
    profile: {
      completeness: 40,
      fields: [
        { key: 'info', done: true },
        { key: 'contact', done: true },
        { key: 'license', done: true },
        { key: 'size', done: false },
        { key: 'website', done: false },
        { key: 'description', done: false },
        { key: 'address', done: false },
      ],
    },
  },
  counts: { projects: 0, applicationsPending: 0, unreadNotifications: 1 },
  permissions: SAMPLE_PERMISSIONS,
  tasks: [],
  notifications: [
    { id: 'e1', type: 'approved', tone: 'green', ago: { value: 0, unit: 'minute' }, unread: true, link: '/company/profile' },
  ],
  projectStates: {
    draft: 0, submitted: 0, changes_requested: 0, approved: 0,
    open: 0, selection: 0, active: 0, under_review: 0,
    completed: 0, rejected: 0, cancelled: 0, archived: 0,
  },
  recentProjects: [],
  funnel: { total: 0, stages: {}, byProject: [] },
};

/* Pending organization (Sprint 1, BR-01: it cannot sign in yet). */
export const SAMPLE_PENDING = {
  name: 'Nova Tech',
  email: 'lina@novatech.example',
  registeredOn: '2026-10-28',
  documents: 'Trade license',
};
