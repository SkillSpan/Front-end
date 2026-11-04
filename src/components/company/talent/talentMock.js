/*
 * Preview data for the talent screens (US-COMP-05/06/07) — design previews and
 * tests only. Shapes follow GET /api/v1/talent (COMPANY_FRONTEND_A_TO_Z §7:
 * id, name, career_role, readiness { score, band }, top_skills) plus the
 * fields the sprint document asks the result / summary to carry, marked
 * ASSUMED in talentApi.js until the backend confirms them.
 */
export const SAMPLE_TALENT_FILTERS = {
  career_roles: [
    { id: 1, title: 'UX/UI Designer', slug: 'ux-ui-designer' },
    { id: 2, title: 'Front-end Developer', slug: 'front-end-developer' },
    { id: 3, title: 'Data Analyst', slug: 'data-analyst' },
    { id: 4, title: 'Backend Developer', slug: 'backend-developer' },
  ],
  readiness_bands: ['foundation_needed', 'developing', 'moderate_readiness', 'near_ready', 'highly_ready'],
  // ASSUMED (COMP-01 filters the guide does not list yet):
  skills: [
    { id: 101, name: 'User Research' }, { id: 103, name: 'Visual Design' }, { id: 104, name: 'Prototyping (Figma)' },
    { id: 201, name: 'React' }, { id: 202, name: 'TypeScript' }, { id: 205, name: 'Laravel' }, { id: 301, name: 'SQL' }, { id: 303, name: 'Python' },
  ],
  locations: ['Gaza', 'Ramallah', 'Nablus', 'Hebron', 'Remote'],
  languages: ['Arabic', 'English', 'French'],
  availability: ['full_time', 'part_time', 'project_based'],
};

const sk = (id, name, level, verified) => ({ skill_id: id, name, level, verification_state: verified ? 'verified' : 'self_declared' });
const pj = (title, role, contribution, verified, completedAt) => ({ title, team_role: role, contribution, verification_state: verified ? 'verified' : 'self_declared', completed_at: completedAt });

// readiness.band per SRS Table 52 words; scores are illustrative sample values.
export const SAMPLE_TALENT = [
  { id: 31, name: 'Rami Haddad', career_role: 'Backend Developer', role_slug: 'backend-developer', readiness: { score: 86, band: 'highly_ready' }, location: 'Ramallah', languages: ['Arabic', 'English'], availability: 'full_time', updated_at: '2026-11-01T10:00:00Z',
    top_skills: [sk(205, 'Laravel', 4, true), sk(301, 'SQL', 4, true), sk(303, 'Python', 3, false)],
    projects: [pj('Inventory API', 'Back-end lead', 'Designed the stock reservation endpoints and their tests (38 merged PRs).', true, '2026-06-30'), pj('Clinic booking backend', 'Back-end developer', 'Built the appointment slot service.', true, '2026-02-15')],
    evaluations: [{ project: 'Inventory API', summary: 'Exceeds expectations on API design and testing.', score_band: 'strong' }] },
  { id: 32, name: 'Sara Nasser', career_role: 'UX/UI Designer', role_slug: 'ux-ui-designer', readiness: { score: 82, band: 'near_ready' }, location: 'Gaza', languages: ['Arabic', 'English'], availability: 'part_time', updated_at: '2026-10-29T10:00:00Z',
    top_skills: [sk(101, 'User Research', 4, true), sk(104, 'Prototyping (Figma)', 3, true), sk(103, 'Visual Design', 3, false)],
    projects: [pj('Clinic App UX Redesign', 'UX researcher', 'Ran 12 patient interviews and wrote the journey map.', true, '2026-10-20')],
    evaluations: [{ project: 'Clinic App UX Redesign', summary: 'Research synthesis rated strong by the evaluator.', score_band: 'strong' }] },
  { id: 33, name: 'Omar Khalil', career_role: 'UX/UI Designer', role_slug: 'ux-ui-designer', readiness: { score: 74, band: 'near_ready' }, location: 'Gaza', languages: ['Arabic'], availability: 'project_based', updated_at: '2026-10-12T10:00:00Z',
    top_skills: [sk(104, 'Prototyping (Figma)', 4, true), sk(103, 'Visual Design', 4, true), sk(101, 'User Research', 2, false)],
    projects: [pj('Retail dashboard UI', 'UI designer', 'Designed the KPI cards and the filter panel.', true, '2026-05-10')],
    evaluations: [] },
  { id: 34, name: 'Yousef Darwish', career_role: 'Front-end Developer', role_slug: 'front-end-developer', readiness: { score: 71, band: 'moderate_readiness' }, location: 'Nablus', languages: ['Arabic', 'English'], availability: 'full_time', updated_at: '2026-09-20T10:00:00Z',
    top_skills: [sk(201, 'React', 4, true), sk(202, 'TypeScript', 3, false)],
    projects: [pj('Clinic booking web app', 'Front-end developer', 'Built the booking calendar component.', true, '2026-04-01')],
    evaluations: [{ project: 'Clinic booking web app', summary: 'Meets expectations; accessibility needs work.', score_band: 'meets' }] },
  { id: 35, name: 'Hana Yassin', career_role: 'Data Analyst', role_slug: 'data-analyst', readiness: { score: 68, band: 'moderate_readiness' }, location: 'Hebron', languages: ['Arabic', 'English', 'French'], availability: 'part_time', updated_at: '2026-10-30T10:00:00Z',
    top_skills: [sk(301, 'SQL', 3, true), sk(303, 'Python', 3, true)],
    projects: [pj('Retail sales analysis', 'Analyst', 'Cleaned 2 years of sales data and built the weekly report.', true, '2026-08-12')],
    evaluations: [] },
  { id: 36, name: 'Ahmad Jaber', career_role: 'Front-end Developer', role_slug: 'front-end-developer', readiness: { score: 63, band: 'moderate_readiness' }, location: 'Remote', languages: ['Arabic'], availability: 'project_based', updated_at: '2026-07-02T10:00:00Z',
    top_skills: [sk(201, 'React', 3, true), sk(104, 'Prototyping (Figma)', 2, false)],
    projects: [], evaluations: [] },
  { id: 37, name: 'Noor Saleh', career_role: 'UX/UI Designer', role_slug: 'ux-ui-designer', readiness: { score: 58, band: 'developing' }, location: 'Nablus', languages: ['Arabic', 'English'], availability: 'part_time', updated_at: '2026-10-25T10:00:00Z',
    top_skills: [sk(104, 'Prototyping (Figma)', 3, true), sk(101, 'User Research', 2, false)],
    projects: [pj('Campus events app', 'Designer (team of 4)', 'Designed onboarding screens; teammates owned the event flow.', false, '2026-03-20')],
    evaluations: [], contact_allowed: false },
  { id: 38, name: 'Mahmoud Saad', career_role: 'Data Analyst', role_slug: 'data-analyst', readiness: { score: 52, band: 'developing' }, location: 'Gaza', languages: ['Arabic'], availability: 'full_time', updated_at: '2026-06-15T10:00:00Z',
    top_skills: [sk(301, 'SQL', 2, true), sk(303, 'Python', 3, false)],
    projects: [], evaluations: [] },
  { id: 39, name: 'Dana Qasem', career_role: 'UX/UI Designer', role_slug: 'ux-ui-designer', readiness: { score: 47, band: 'developing' }, location: 'Ramallah', languages: ['Arabic', 'English'], availability: 'project_based', updated_at: '2026-10-05T10:00:00Z',
    top_skills: [sk(101, 'User Research', 2, false)], projects: [], evaluations: [] },
  { id: 40, name: 'Tariq Awad', career_role: 'UX/UI Designer', role_slug: 'ux-ui-designer', readiness: { score: 39, band: 'foundation_needed' }, location: 'Gaza', languages: ['Arabic'], availability: 'part_time', updated_at: '2026-05-01T10:00:00Z',
    top_skills: [sk(103, 'Visual Design', 3, false)], projects: [], evaluations: [] },
  { id: 41, name: 'Rana Abu Ali', career_role: 'Data Analyst', role_slug: 'data-analyst', readiness: { score: 44, band: 'developing' }, location: 'Nablus', languages: ['Arabic', 'English'], availability: 'part_time', updated_at: '2026-09-28T10:00:00Z',
    top_skills: [sk(301, 'SQL', 2, false)], projects: [], evaluations: [] },
  { id: 42, name: 'Basel Nofal', career_role: 'Backend Developer', role_slug: 'backend-developer', readiness: { score: 77, band: 'near_ready' }, location: 'Remote', languages: ['Arabic', 'English'], availability: 'full_time', updated_at: '2026-10-31T10:00:00Z',
    top_skills: [sk(205, 'Laravel', 3, true), sk(301, 'SQL', 3, true)],
    projects: [pj('Payments API', 'Back-end developer', 'Implemented webhook retries and idempotency keys.', true, '2026-09-01')],
    evaluations: [{ project: 'Payments API', summary: 'Strong on reliability; documentation was thin.', score_band: 'meets' }] },
];

export const SAMPLE_LISTS = [
  { id: 'L1', name: 'Clinic follow-up — designers', candidate_ids: [32, 33, 37], created_by: { name: 'Lina Haddad' }, created_at: '2026-10-28T09:00:00Z', updated_at: '2026-11-02T09:00:00Z' },
  { id: 'L2', name: 'Backend pipeline 2027', candidate_ids: [31, 42], created_by: { name: 'Lina Haddad' }, created_at: '2026-10-30T09:00:00Z', updated_at: '2026-10-30T09:00:00Z' },
];

export const SAMPLE_NOTES = {
  32: [{ id: 'n1', body: 'Strong interviewer — consider for the clinic follow-up study.', author: { name: 'Lina Haddad' }, created_at: '2026-11-01T12:00:00Z' }],
};

// Assumed ranking configuration (BR-08 versioned weights) — preview only.
export const SAMPLE_RANKING = { version: 'rank-2026.10', factors: ['verified_skills', 'project_evidence', 'evaluations', 'freshness'] };
