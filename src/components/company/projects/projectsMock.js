/*
 * SAMPLE DATA — FOR DESIGN PREVIEW AND TESTS ONLY.
 * Nova Tech, its projects and every learner below are fictional. Nothing here
 * comes from the backend; a signed-in company only ever sees server data.
 *
 * The twelve projects match the dashboard sample (companyDashboardMock.js):
 * draft 1 · submitted 1 · changes requested 1 · open 2 · selection 1 ·
 * active 2 · completed 3 · archived 1 — so every preview screen agrees.
 *
 * Shapes follow the sprint document's Database / API sections (US-PRJ-01,
 * US-PRJ-02, US-MATCH-03, US-MATCH-04) and the field names the Sprint 3
 * learner screens already read from GET /api/v1/projects (required_skills,
 * minimum_required_level, is_critical_entry, application_deadline,
 * work_mode, capacity, capacity_state …). TODO(api): confirm against the
 * backend's projects guide — see CHANGES.md "Assumed fields".
 */

// GET /api/v1/skills/taxonomy (Sprint 3, US-SKL-01): flat list, the tree is in parent_skill_id.
export const SAMPLE_TAXONOMY = [
  { id: 100, name: 'Design', parent_skill_id: null, slug: 'design' },
  { id: 101, name: 'User Research', parent_skill_id: 100 },
  { id: 102, name: 'Interaction Design', parent_skill_id: 100 },
  { id: 103, name: 'Visual Design', parent_skill_id: 100 },
  { id: 104, name: 'Prototyping (Figma)', parent_skill_id: 100 },
  { id: 105, name: 'Accessibility (WCAG)', parent_skill_id: 100 },
  { id: 200, name: 'Web Development', parent_skill_id: null, slug: 'web' },
  { id: 201, name: 'React', parent_skill_id: 200 },
  { id: 202, name: 'JavaScript', parent_skill_id: 200 },
  { id: 203, name: 'HTML & CSS', parent_skill_id: 200 },
  { id: 204, name: 'REST APIs', parent_skill_id: 200 },
  { id: 205, name: 'Laravel', parent_skill_id: 200 },
  { id: 300, name: 'Data', parent_skill_id: null, slug: 'data' },
  { id: 301, name: 'SQL', parent_skill_id: 300 },
  { id: 302, name: 'Data Visualization', parent_skill_id: 300 },
  { id: 303, name: 'Python', parent_skill_id: 300 },
  { id: 400, name: 'Professional Skills', parent_skill_id: null, slug: 'professional' },
  { id: 401, name: 'Communication', parent_skill_id: 400 },
  { id: 402, name: 'Teamwork', parent_skill_id: 400 },
  { id: 403, name: 'Technical Writing', parent_skill_id: 400 },
];

// GET /api/v1/career-roles (Sprint 3, US-CAR-01).
export const SAMPLE_CAREER_ROLES = [
  { id: 1, title: 'UX/UI Designer' },
  { id: 2, title: 'Front-end Developer' },
  { id: 3, title: 'Data Analyst' },
  { id: 4, title: 'Back-end Developer' },
  { id: 5, title: 'Mobile Developer' },
];

// Approved rubric versions the company can attach (PRJ-09, AC-07).
// TODO(api): no rubric list endpoint in the sprint document (rubric authoring is
// Administration, out of scope — OQ-04). Assumed: GET /api/v1/rubrics?status=approved.
export const SAMPLE_RUBRICS = [
  { id: 11, name: 'UX case study rubric', version: '2.1', status: 'approved', criteria: 5 },
  { id: 12, name: 'Software project rubric', version: '3.0', status: 'approved', criteria: 6 },
  { id: 13, name: 'Data analysis rubric', version: '1.4', status: 'approved', criteria: 4 },
];

const skill = (id, name, min, critical = false) => ({ skill_id: id, skill_name: name, minimum_required_level: min, is_critical_entry: critical });
const actor = { id: 0, name: 'Lina Haddad' };
const moderator = { id: 900, name: 'SkillSpan moderation' };

export const SAMPLE_PROJECTS = [
  {
    id: 'p1', title: 'Clinic App UX Redesign', status: 'selection', version: 2,
    summary: 'Redesign the patient booking flow of a clinic network’s mobile app.',
    project_type: 'company_sponsored', domain: 'UX/UI', difficulty: 'intermediate',
    scope: 'Booking, rescheduling and reminders for 14 clinics. Payments are out of scope.',
    objectives: ['Cut booking time to under two minutes', 'Reach WCAG 2.2 AA on every booking screen'],
    deliverables: ['Research report with 8 patient interviews', 'Clickable Figma prototype', 'Design hand-off file'],
    learning_outcomes: ['Plan and run usability tests', 'Turn research into design decisions'],
    roles: [
      { id: 'r1', name: 'UX Researcher', capacity: 2, min_required: 1 },
      { id: 'r2', name: 'UI Designer', capacity: 2, min_required: 1 },
      { id: 'r3', name: 'Front-end Developer', capacity: 1, min_required: 1 },
    ],
    capacity: 5, capacity_state: { accepted: 3, total: 5, remaining: 2 },
    start_date: '2026-11-16', end_date: '2027-01-29', application_deadline: '2026-10-25',
    schedule: 'Weekly review on Sundays · about 10 hours a week', duration_weeks: 11,
    work_mode: 'hybrid', location: 'Gaza City',
    required_skills: [skill(101, 'User Research', 3, true), skill(104, 'Prototyping (Figma)', 3, true), skill(105, 'Accessibility (WCAG)', 2), skill(201, 'React', 3)],
    career_role: { id: 1, title: 'UX/UI Designer' },
    eligibility: { organization: '', location: 'Palestine', language: 'Arabic and English', schedule: '10 hours a week', work_mode: 'Hybrid — two on-site days a month' },
    confidentiality: 'confidential', confidential_info: 'Patient-flow analytics and the clinic network’s name are shared only with accepted participants under NDA.',
    rubric: { id: 11, name: 'UX case study rubric', version: '2.1', status: 'approved' },
    applications_count: 16, approval: { status: 'approved', approver: moderator, decided_at: '2026-10-03T10:20:00Z' },
    submitted_at: '2026-10-02T08:00:00Z', created_at: '2026-09-28T09:00:00Z', updated_at: '2026-10-26T09:00:00Z',
    status_history: [
      { from: null, to: 'draft', actor, at: '2026-09-28T09:00:00Z' },
      { from: 'draft', to: 'submitted', actor, at: '2026-10-02T08:00:00Z' },
      { from: 'submitted', to: 'approved', actor: moderator, at: '2026-10-03T10:20:00Z' },
      { from: 'approved', to: 'open', actor, at: '2026-10-04T08:00:00Z' },
      { from: 'open', to: 'selection', actor: { id: null, name: 'System' }, reason: 'Application deadline passed', at: '2026-10-26T00:00:00Z' },
    ],
  },
  {
    id: 'p2', title: 'Data Dashboard for Retail', status: 'open', version: 1,
    summary: 'Build a sales dashboard for a chain of five grocery stores.',
    project_type: 'simulation', domain: 'Data', difficulty: 'beginner',
    scope: 'Daily sales, stock alerts and a weekly summary for store managers.',
    objectives: ['Clean and model 12 months of sales data', 'Ship a dashboard managers can read on a phone'],
    deliverables: ['Cleaned dataset + data dictionary', 'Interactive dashboard', 'Five-minute walkthrough video'],
    learning_outcomes: ['Model sales data with SQL', 'Choose the right chart for a decision'],
    roles: [{ id: 'r1', name: 'Data Analyst', capacity: 3, min_required: 2 }, { id: 'r2', name: 'Data Visualization', capacity: 1, min_required: 1 }],
    capacity: 4, capacity_state: { accepted: 0, total: 4, remaining: 4 },
    start_date: '2026-11-23', end_date: '2026-12-21', application_deadline: '2026-11-12',
    schedule: 'Self-paced with two live check-ins', duration_weeks: 4, work_mode: 'remote', location: '',
    required_skills: [skill(301, 'SQL', 2, true), skill(302, 'Data Visualization', 2), skill(303, 'Python', 1)],
    career_role: { id: 3, title: 'Data Analyst' },
    eligibility: { organization: '', location: '', language: 'English', schedule: '', work_mode: 'Remote' },
    confidentiality: 'public', confidential_info: '',
    rubric: { id: 13, name: 'Data analysis rubric', version: '1.4', status: 'approved' },
    applications_count: 4, approval: { status: 'approved', approver: actor, decided_at: '2026-10-20T09:00:00Z', policy: 'owner_approval' },
    submitted_at: '2026-10-20T09:00:00Z', created_at: '2026-10-18T09:00:00Z', updated_at: '2026-10-21T09:00:00Z',
    status_history: [
      { from: null, to: 'draft', actor, at: '2026-10-18T09:00:00Z' },
      { from: 'draft', to: 'approved', actor, reason: 'Owner approval (policy)', at: '2026-10-20T09:00:00Z' },
      { from: 'approved', to: 'open', actor, at: '2026-10-21T09:00:00Z' },
    ],
  },
  {
    id: 'p3', title: 'Mobile Onboarding Flow', status: 'changes_requested', version: 1,
    summary: 'Design the first-run experience of a budgeting app.',
    project_type: 'company_sponsored', domain: 'Mobile', difficulty: 'intermediate',
    scope: 'Sign-up, permissions and the first budget. Bank linking is out of scope.',
    objectives: ['Raise day-one activation'], deliverables: ['Onboarding prototype', 'Copy deck'],
    learning_outcomes: ['Design progressive onboarding'],
    roles: [{ id: 'r1', name: 'Product Designer', capacity: 2, min_required: 1 }, { id: 'r2', name: 'Mobile Developer', capacity: 2, min_required: 1 }],
    capacity: 4, capacity_state: { accepted: 0, total: 4, remaining: 4 },
    start_date: '2026-12-01', end_date: '2027-01-26', application_deadline: '2026-11-20',
    schedule: 'Two sprints of three weeks', duration_weeks: 8, work_mode: 'remote', location: '',
    required_skills: [skill(102, 'Interaction Design', 3, true), skill(104, 'Prototyping (Figma)', 2)],
    career_role: { id: 5, title: 'Mobile Developer' },
    eligibility: { organization: '', location: '', language: 'English', schedule: '', work_mode: 'Remote' },
    confidentiality: 'public', confidential_info: '',
    rubric: { id: 11, name: 'UX case study rubric', version: '2.1', status: 'approved' },
    applications_count: 0,
    approval: { status: 'changes_requested', approver: moderator, reason: 'Please list the learning outcomes per role and lower the minimum level for Interaction Design to 2 — this project is marked Intermediate.', decided_at: '2026-10-30T14:05:00Z' },
    submitted_at: '2026-10-29T10:00:00Z', created_at: '2026-10-27T10:00:00Z', updated_at: '2026-10-30T14:05:00Z',
    status_history: [
      { from: null, to: 'draft', actor, at: '2026-10-27T10:00:00Z' },
      { from: 'draft', to: 'submitted', actor, at: '2026-10-29T10:00:00Z' },
      { from: 'submitted', to: 'changes_requested', actor: moderator, reason: 'Please list the learning outcomes per role and lower the minimum level for Interaction Design to 2 — this project is marked Intermediate.', at: '2026-10-30T14:05:00Z' },
    ],
  },
  {
    id: 'p4', title: 'Inventory API', status: 'active', version: 1,
    summary: 'A REST API for warehouse stock, used by three internal apps.',
    project_type: 'company_sponsored', domain: 'Backend', difficulty: 'advanced',
    scope: 'Stock, transfers and audit log endpoints.', objectives: ['Replace the spreadsheet stock count'],
    deliverables: ['Documented API', 'Test suite'], learning_outcomes: ['Design a versioned REST API'],
    roles: [{ id: 'r1', name: 'Back-end Developer', capacity: 3, min_required: 2 }, { id: 'r2', name: 'QA', capacity: 1, min_required: 1 }],
    capacity: 4, capacity_state: { accepted: 4, total: 4, remaining: 0 },
    start_date: '2026-10-15', end_date: '2026-12-10', application_deadline: '2026-10-10',
    schedule: 'Daily stand-up at 9:00', duration_weeks: 8, work_mode: 'onsite', location: 'Ramallah',
    required_skills: [skill(205, 'Laravel', 3, true), skill(204, 'REST APIs', 3, true), skill(301, 'SQL', 2)],
    career_role: { id: 4, title: 'Back-end Developer' },
    eligibility: { organization: '', location: 'West Bank', language: 'Arabic', schedule: 'Full-time', work_mode: 'On-site' },
    confidentiality: 'confidential', confidential_info: 'Warehouse locations and supplier names.',
    rubric: { id: 12, name: 'Software project rubric', version: '3.0', status: 'approved' },
    applications_count: 9, approval: { status: 'approved', approver: moderator, decided_at: '2026-09-20T09:00:00Z' },
    submitted_at: '2026-09-19T09:00:00Z', created_at: '2026-09-15T09:00:00Z', updated_at: '2026-10-15T09:00:00Z',
    status_history: [{ from: 'selection', to: 'active', actor, at: '2026-10-15T09:00:00Z' }],
  },
  {
    id: 'p5', title: 'Brand Identity Kit', status: 'draft', version: 1,
    summary: 'A starter brand kit for a new coffee roaster.',
    project_type: 'simulation', domain: 'Graphic design', difficulty: '',
    scope: '', objectives: ['Logo, colour and type system'], deliverables: ['Brand guidelines PDF'],
    learning_outcomes: [], roles: [{ id: 'r1', name: 'Brand Designer', capacity: 3, min_required: 1 }],
    capacity: 3, capacity_state: { accepted: 0, total: 3, remaining: 3 },
    start_date: '2026-12-07', end_date: '', application_deadline: '', schedule: '', duration_weeks: null,
    work_mode: '', location: '', required_skills: [], career_role: null,
    eligibility: { organization: '', location: '', language: '', schedule: '', work_mode: '' },
    confidentiality: 'public', confidential_info: '', rubric: null, applications_count: 0, approval: null,
    created_at: '2026-10-28T11:00:00Z', updated_at: '2026-10-28T11:00:00Z',
    status_history: [{ from: null, to: 'draft', actor, at: '2026-10-28T11:00:00Z' }],
  },
  {
    id: 'p6', title: 'Customer Support Chatbot', status: 'submitted', version: 1,
    summary: 'Conversation design for an Arabic-first support bot.',
    project_type: 'company_sponsored', domain: 'Conversation design', difficulty: 'intermediate',
    scope: 'Top 20 support questions.', objectives: ['Answer 60% of tickets without an agent'], deliverables: ['Conversation flows', 'Test transcripts'],
    learning_outcomes: ['Write for conversational UI'], roles: [{ id: 'r1', name: 'Conversation Designer', capacity: 2, min_required: 1 }],
    capacity: 2, capacity_state: { accepted: 0, total: 2, remaining: 2 },
    start_date: '2026-12-14', end_date: '2027-02-08', application_deadline: '2026-12-01', schedule: 'Weekly', duration_weeks: 8,
    work_mode: 'remote', location: '', required_skills: [skill(401, 'Communication', 3, true), skill(403, 'Technical Writing', 2)],
    career_role: null, eligibility: { organization: '', location: '', language: 'Arabic', schedule: '', work_mode: 'Remote' },
    confidentiality: 'public', confidential_info: '', rubric: { id: 12, name: 'Software project rubric', version: '3.0', status: 'approved' },
    applications_count: 0, approval: { status: 'pending' }, submitted_at: '2026-11-02T12:00:00Z',
    created_at: '2026-11-01T12:00:00Z', updated_at: '2026-11-02T12:00:00Z',
    status_history: [{ from: null, to: 'draft', actor, at: '2026-11-01T12:00:00Z' }, { from: 'draft', to: 'submitted', actor, at: '2026-11-02T12:00:00Z' }],
  },
  {
    id: 'p7', title: 'Open-data Accessibility Audit', status: 'open', version: 1,
    summary: 'Audit three public-service websites against WCAG 2.2.',
    project_type: 'simulation', domain: 'Accessibility', difficulty: 'beginner',
    scope: 'Three websites, 10 key pages each.', objectives: ['Publish a prioritised fix list'], deliverables: ['Audit report'],
    learning_outcomes: ['Test with a screen reader'], roles: [{ id: 'r1', name: 'Accessibility Auditor', capacity: 6, min_required: 2 }],
    capacity: 6, capacity_state: { accepted: 1, total: 6, remaining: 5 },
    start_date: '2026-11-30', end_date: '2026-12-25', application_deadline: '2026-11-19', schedule: 'Self-paced', duration_weeks: 4,
    work_mode: 'remote', location: '', required_skills: [skill(105, 'Accessibility (WCAG)', 2, true), skill(203, 'HTML & CSS', 2)],
    career_role: { id: 2, title: 'Front-end Developer' }, eligibility: { organization: '', location: '', language: 'English', schedule: '', work_mode: 'Remote' },
    confidentiality: 'public', confidential_info: '', rubric: { id: 11, name: 'UX case study rubric', version: '2.1', status: 'approved' },
    applications_count: 7, approval: { status: 'approved', approver: moderator, decided_at: '2026-10-24T09:00:00Z' },
    created_at: '2026-10-22T09:00:00Z', updated_at: '2026-10-25T09:00:00Z', status_history: [],
  },
  {
    id: 'p8', title: 'Logistics Tracking Web App', status: 'active', version: 1, summary: 'Live tracking for a courier company.',
    project_type: 'company_sponsored', domain: 'Web', difficulty: 'advanced', roles: [{ id: 'r1', name: 'Front-end Developer', capacity: 3, min_required: 2 }],
    capacity: 3, capacity_state: { accepted: 3, total: 3, remaining: 0 }, start_date: '2026-10-05', end_date: '2026-12-14', application_deadline: '2026-09-28',
    work_mode: 'remote', required_skills: [skill(201, 'React', 3, true)], confidentiality: 'public', applications_count: 11,
    rubric: { id: 12, name: 'Software project rubric', version: '3.0', status: 'approved' }, created_at: '2026-09-10T09:00:00Z', updated_at: '2026-10-05T09:00:00Z',
  },
  {
    id: 'p9', title: 'E-commerce Checkout Revamp', status: 'completed', version: 1, summary: 'A shorter checkout for a fashion store.',
    project_type: 'company_sponsored', domain: 'UX/UI', difficulty: 'intermediate', roles: [{ id: 'r1', name: 'UX Designer', capacity: 3, min_required: 1 }],
    capacity: 3, capacity_state: { accepted: 3, total: 3, remaining: 0 }, start_date: '2026-06-01', end_date: '2026-08-10', application_deadline: '2026-05-20',
    work_mode: 'remote', required_skills: [skill(102, 'Interaction Design', 3, true)], confidentiality: 'public', applications_count: 14,
    rubric: { id: 11, name: 'UX case study rubric', version: '2.0', status: 'approved' }, created_at: '2026-05-01T09:00:00Z', updated_at: '2026-08-12T09:00:00Z',
  },
  {
    id: 'p10', title: 'Analytics Onboarding Emails', status: 'completed', version: 1, summary: 'Lifecycle emails for a SaaS product.',
    project_type: 'simulation', domain: 'Marketing', difficulty: 'beginner', roles: [{ id: 'r1', name: 'Content Writer', capacity: 2, min_required: 1 }],
    capacity: 2, capacity_state: { accepted: 2, total: 2, remaining: 0 }, start_date: '2026-07-01', end_date: '2026-07-29', application_deadline: '2026-06-20',
    work_mode: 'remote', required_skills: [skill(403, 'Technical Writing', 2)], confidentiality: 'public', applications_count: 6,
    rubric: { id: 13, name: 'Data analysis rubric', version: '1.3', status: 'approved' }, created_at: '2026-06-01T09:00:00Z', updated_at: '2026-07-30T09:00:00Z',
  },
  {
    id: 'p11', title: 'Warehouse Barcode Scanner', status: 'completed', version: 2, summary: 'A scanning app for stock counts.',
    project_type: 'company_sponsored', domain: 'Mobile', difficulty: 'intermediate', roles: [{ id: 'r1', name: 'Mobile Developer', capacity: 2, min_required: 1 }],
    capacity: 2, capacity_state: { accepted: 2, total: 2, remaining: 0 }, start_date: '2026-03-01', end_date: '2026-05-01', application_deadline: '2026-02-15',
    work_mode: 'onsite', location: 'Nablus', required_skills: [skill(202, 'JavaScript', 3, true)], confidentiality: 'public', applications_count: 8,
    rubric: { id: 12, name: 'Software project rubric', version: '2.4', status: 'approved' }, created_at: '2026-02-01T09:00:00Z', updated_at: '2026-05-03T09:00:00Z',
  },
  {
    id: 'p12', title: 'Legacy Intranet Migration', status: 'archived', version: 1, summary: 'Moving a staff intranet to a modern stack.',
    project_type: 'company_sponsored', domain: 'Web', difficulty: 'advanced', roles: [{ id: 'r1', name: 'Full-stack Developer', capacity: 2, min_required: 1 }],
    capacity: 2, capacity_state: { accepted: 2, total: 2, remaining: 0 }, start_date: '2025-11-01', end_date: '2026-01-31', application_deadline: '2025-10-15',
    work_mode: 'hybrid', location: 'Gaza City', required_skills: [skill(205, 'Laravel', 3, true)], confidentiality: 'confidential', confidential_info: 'Internal system names.',
    applications_count: 5, rubric: { id: 12, name: 'Software project rubric', version: '2.0', status: 'approved' }, archived_at: '2026-03-01T09:00:00Z',
    created_at: '2025-10-01T09:00:00Z', updated_at: '2026-03-01T09:00:00Z',
  },
];

/* ------------------------------------------------------------------ */
/* Applications (US-MATCH-03) — the approved application view only.    */
/* ------------------------------------------------------------------ */

const learner = (id, name, headline, university) => ({ id, name, headline, university });
const lv = (id, name, level, verified) => ({ skill_id: id, skill_name: name, level, verification_state: verified ? 'verified' : 'self_assessed' });
const motivation = 'I have run two usability studies for a university clinic and want to work on a real product with a team.';

// Clinic App UX Redesign (p1, Selection) — 16 applications: 6 submitted, 2 shortlisted,
// 3 accepted, 1 waitlisted, 2 rejected, 1 withdrawn, 1 expired (8 awaiting a decision).
const CLINIC = [
  ['a101', 'Sara Nasser', 'UX researcher · 4th-year HCI', 'Islamic University of Gaza', 'accepted', 'r1', [lv(101, 'User Research', 4, true), lv(104, 'Prototyping (Figma)', 3, true), lv(105, 'Accessibility (WCAG)', 3, true)], '2026-10-06T09:12:00Z'],
  ['a102', 'Omar Khalil', 'UI designer', 'Al-Azhar University', 'accepted', 'r2', [lv(101, 'User Research', 3, true), lv(104, 'Prototyping (Figma)', 4, true), lv(105, 'Accessibility (WCAG)', 2, false)], '2026-10-07T13:40:00Z'],
  ['a103', 'Yousef Darwish', 'Front-end developer', 'Palestine Technical College', 'accepted', 'r3', [lv(101, 'User Research', 2, false), lv(104, 'Prototyping (Figma)', 3, true), lv(201, 'React', 4, true)], '2026-10-08T08:05:00Z'],
  ['a104', 'Huda Mansour', 'Visual designer', 'University of Palestine', 'waitlisted', 'r2', [lv(101, 'User Research', 3, false), lv(104, 'Prototyping (Figma)', 3, true)], '2026-10-09T10:00:00Z'],
  ['a105', 'Rami Haddad', 'Product designer', 'Birzeit University', 'shortlisted', 'r1', [lv(101, 'User Research', 3, true), lv(104, 'Prototyping (Figma)', 3, true), lv(105, 'Accessibility (WCAG)', 2, true)], '2026-10-10T11:20:00Z'],
  ['a106', 'Noor Saleh', 'UX/UI student', 'An-Najah National University', 'shortlisted', 'r2', [lv(101, 'User Research', 3, false), lv(104, 'Prototyping (Figma)', 4, true)], '2026-10-11T15:00:00Z'],
  ['a107', 'Khaled Odeh', 'Interaction designer', 'Islamic University of Gaza', 'submitted', 'r1', [lv(101, 'User Research', 3, true), lv(102, 'Interaction Design', 3, true)], '2026-10-12T09:00:00Z'],
  ['a108', 'Maya Barghouti', 'Design student', 'Birzeit University', 'submitted', 'r2', [lv(104, 'Prototyping (Figma)', 3, true)], '2026-10-13T09:30:00Z'],
  ['a109', 'Ahmad Jaber', 'Front-end developer', 'Al-Quds University', 'submitted', 'r3', [lv(201, 'React', 3, true), lv(104, 'Prototyping (Figma)', 2, false)], '2026-10-14T12:00:00Z'],
  ['a110', 'Dana Qasem', 'UX writer', 'University of Palestine', 'submitted', 'r1', [lv(101, 'User Research', 2, false)], '2026-10-16T08:45:00Z'],
  ['a111', 'Tariq Awad', 'Graphic designer', 'Al-Aqsa University', 'submitted', 'r2', [lv(103, 'Visual Design', 4, true), lv(104, 'Prototyping (Figma)', 3, false)], '2026-10-18T17:10:00Z'],
  ['a112', 'Layla Hamdan', 'HCI student', 'An-Najah National University', 'submitted', 'r1', [lv(101, 'User Research', 3, true), lv(105, 'Accessibility (WCAG)', 3, true)], '2026-10-21T10:00:00Z'],
  ['a113', 'Basel Nofal', 'Designer', 'Al-Azhar University', 'rejected', 'r2', [lv(104, 'Prototyping (Figma)', 1, false)], '2026-10-05T09:00:00Z'],
  ['a114', 'Reem Shaath', 'Developer', 'Palestine Polytechnic University', 'rejected', 'r3', [lv(201, 'React', 2, false)], '2026-10-06T16:00:00Z'],
  ['a115', 'Fadi Zaqout', 'UX student', 'Islamic University of Gaza', 'withdrawn', 'r1', [lv(101, 'User Research', 2, false)], '2026-10-07T09:00:00Z'],
  ['a116', 'Salma Abed', 'UI designer', 'University College of Applied Sciences', 'expired', 'r2', [lv(104, 'Prototyping (Figma)', 3, true)], '2026-10-24T23:10:00Z'],
];

const RETAIL = [
  ['a201', 'Hana Yassin', 'Statistics student', 'Birzeit University', 'submitted', 'r1', [lv(301, 'SQL', 3, true), lv(302, 'Data Visualization', 2, true)], '2026-10-23T09:00:00Z'],
  ['a202', 'Mahmoud Saad', 'Data analyst trainee', 'Islamic University of Gaza', 'submitted', 'r1', [lv(301, 'SQL', 2, true), lv(303, 'Python', 3, true)], '2026-10-24T10:00:00Z'],
  ['a203', 'Rana Abu Ali', 'Business student', 'An-Najah National University', 'submitted', 'r2', [lv(302, 'Data Visualization', 3, false)], '2026-10-27T11:00:00Z'],
  ['a204', 'Ziad Hassan', 'CS student', 'Al-Azhar University', 'submitted', 'r1', [lv(301, 'SQL', 1, false)], '2026-10-30T12:00:00Z'],
];

const DECISION_REASONS = {
  a101: 'Strongest research portfolio; clinic study is directly relevant.',
  a113: 'Prototyping level is below the minimum for this project.',
};

function toApplication(project, [id, name, headline, university, status, roleId, skills, at]) {
  const role = project.roles.find((r) => r.id === roleId);
  const history = [{ from: null, to: 'submitted', actor: { id: null, name } , at }];
  if (status !== 'submitted' && status !== 'withdrawn' && status !== 'expired') {
    history.push({ from: 'submitted', to: status, actor, reason: DECISION_REASONS[id] || '', at: '2026-10-27T09:00:00Z' });
  }
  if (status === 'withdrawn') history.push({ from: 'submitted', to: 'withdrawn', actor: { id: null, name }, at: '2026-10-12T09:00:00Z' });
  if (status === 'expired') history.push({ from: 'submitted', to: 'expired', actor: { id: null, name: 'System' }, reason: 'Submitted after the application deadline', at: '2026-10-25T23:59:00Z' });
  return {
    id,
    project_id: project.id,
    project_version: project.version,
    status,
    submitted_at: at,
    requested_role: role ? { id: role.id, name: role.name } : null,
    // Application data submitted by the learner for the project.
    answers: [
      { question: 'Why this project?', answer: motivation },
      { question: 'Weekly availability', answer: '10–12 hours' },
    ],
    portfolio_url: status === 'withdrawn' ? null : `https://portfolio.example/${id}`,
    // Applicant fields permitted by the learner's visibility settings (PROF-04, PORT-03).
    applicant: learner(`l-${id}`, name, headline, university),
    // Verified skills relevant to the project's required skills (with verification state where permitted).
    skills,
    decision_history: history,
  };
}

export const SAMPLE_APPLICATIONS = [
  ...CLINIC.map((row) => toApplication(SAMPLE_PROJECTS[0], row)),
  ...RETAIL.map((row) => toApplication(SAMPLE_PROJECTS[1], row)),
];

/* ------------------------------------------------------------------ */
/* Team formation (US-MATCH-04) — Clinic App UX Redesign (p1).         */
/* ------------------------------------------------------------------ */

// a101 assigned + invitation accepted; a102 assigned + invitation pending;
// a103 accepted but not assigned yet (misses the critical "User Research" level 3).
export const SAMPLE_TEAM = {
  p1: {
    assignments: [
      { id: 't1', application_id: 'a101', role_id: 'r1', status: 'confirmed', invitation: { id: 'inv1', status: 'accepted', responded_at: '2026-10-28T10:00:00Z' } },
      { id: 't2', application_id: 'a102', role_id: 'r2', status: 'invited', invitation: { id: 'inv2', status: 'pending', sent_at: '2026-11-02T09:00:00Z' } },
    ],
    // BR-07: active assignments on other projects (configured as blocking).
    conflicts: {},
    exceptions: [],
  },
};
