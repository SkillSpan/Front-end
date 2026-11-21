/*
 * US-PRJ-01 — the Create / Edit Project form model, client-side validation,
 * completeness check, and the mapping to and from the API payload.
 *
 * Client checks exist to help the representative early; the backend stays
 * the authority (PRJ-01, PRJ-02, BR-16) and its 422 errors are mapped back
 * onto the same fields, keeping every value the user typed.
 *
 * Rules implemented here (US-PRJ-01 Business Rules):
 *   BR-02  ownership is never sent — no organization / owner / status in the payload
 *   BR-03  PRJ-01 required: type, domain, objectives, deliverables, dates, capacity
 *   BR-04  PRJ-02 required before Open: skills + minimum levels, difficulty,
 *          learning outcomes, work mode, role, schedule, eligibility
 *   BR-05  skills only from the canonical taxonomy (skill_id, never free text)
 *   BR-06  minimum levels on the approved 0–5 scale (SRS Table 47), 1–5 as a minimum
 *   BR-07  application deadline not later than the start date (AS-06)
 *   BR-08  sum of role capacities not above the total capacity (AS-06)
 *   BR-09  project type: Simulation Project or Company-Sponsored Project (PRJ-10)
 *   BR-10  an approved rubric version is needed before the project can open (PRJ-09)
 *   BR-14  confidential information kept in its own field (PRJ-08, AC-08)
 */

export const PROJECT_TYPES = ['company_sponsored', 'simulation'];
export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'];
export const WORK_MODES = ['remote', 'onsite', 'hybrid'];
export const CONFIDENTIALITY = ['public', 'confidential'];

// SRS Table 47 — Standard 0–5 skill scale. A minimum level starts at 1.
export const SKILL_LEVELS = [1, 2, 3, 4, 5];
export const SKILL_LEVEL_KEYS = ['notDemonstrated', 'awareness', 'beginner', 'intermediate', 'advanced', 'expert'];

export const FORM_SECTIONS = ['basic', 'roles', 'skills', 'confidentiality', 'review'];

const blankRole = () => ({ key: `role-${Math.random().toString(36).slice(2, 8)}`, id: null, name: '', capacity: '', minRequired: '1' });

export function emptyProjectForm() {
  return {
    projectType: '',
    title: '', summary: '', domain: '', scope: '',
    objectives: [''], deliverables: [''], learningOutcomes: [''],
    roles: [blankRole()], totalCapacity: '',
    startDate: '', endDate: '', applicationDeadline: '', schedule: '', durationWeeks: '',
    workMode: '', location: '',
    skills: [], difficulty: '', careerRoleId: '',
    eligibility: { openToAll: false, organization: '', location: '', language: '', schedule: '', workMode: '' },
    confidentiality: 'public', confidentialInfo: '',
    rubricId: '',
  };
}

export { blankRole };

const list = (v) => (Array.isArray(v) ? v : (typeof v === 'string' && v ? v.split(/\r?\n/) : []));
const str = (v) => (v == null ? '' : String(v));
const hasText = (v) => str(v).trim().length > 0;
const filled = (arr) => (arr || []).map((s) => str(s).trim()).filter(Boolean);
const toInt = (v) => (v === '' || v == null ? null : Number(v));

/** API project (GET /api/v1/company/projects/{id}) → form values. */
export function projectToForm(p = {}) {
  const e = p.eligibility || {};
  const elig = {
    openToAll: Boolean(e.open_to_all),
    organization: str(e.organization), location: str(e.location), language: str(e.language),
    schedule: str(e.schedule), workMode: str(e.work_mode),
  };
  const nonEmpty = (arr) => (arr.length ? arr : ['']);
  return {
    projectType: str(p.project_type),
    title: str(p.title ?? p.name), summary: str(p.summary), domain: str(p.domain), scope: str(p.scope),
    objectives: nonEmpty(list(p.objectives)), deliverables: nonEmpty(list(p.deliverables)),
    learningOutcomes: nonEmpty(list(p.learning_outcomes).map((o) => (typeof o === 'string' ? o : (o?.title || o?.name || '')))),
    roles: (p.roles || []).length
      ? p.roles.map((r) => ({ key: `role-${r.id ?? Math.random()}`, id: r.id ?? null, name: str(r.name), capacity: str(r.capacity), minRequired: str(r.min_required ?? 1) }))
      : [blankRole()],
    totalCapacity: str(p.capacity ?? p.total_capacity),
    startDate: str(p.start_date).slice(0, 10), endDate: str(p.end_date).slice(0, 10),
    applicationDeadline: str(p.application_deadline).slice(0, 10),
    schedule: str(p.schedule), durationWeeks: str(p.duration_weeks ?? ''),
    workMode: str(p.work_mode), location: str(p.location),
    skills: (p.required_skills || []).map((s) => ({
      skillId: s.skill_id ?? s.skill?.id ?? s.id,
      skillName: str(s.skill_name ?? s.skill?.name ?? s.name),
      minLevel: Number(s.minimum_required_level ?? s.minimum_level ?? 1),
      critical: Boolean(s.is_critical_entry ?? s.is_critical),
    })),
    difficulty: str(p.difficulty), careerRoleId: str(p.career_role_id ?? p.career_role?.id ?? ''),
    eligibility: elig,
    confidentiality: p.confidentiality === 'confidential' || p.is_confidential ? 'confidential' : 'public',
    confidentialInfo: str(p.confidential_info),
    rubricId: str(p.rubric_id ?? p.rubric?.id ?? ''),
  };
}

/**
 * Form values → request body for POST /api/v1/projects and PATCH /api/v1/projects/{id}.
 * BR-02: no organization_id, owner or status — the backend sets them.
 * TODO(api): field names follow the sprint document's Database section and the
 * Sprint 3 learner payload; confirm against the backend's projects guide.
 */
export function formToPayload(form, { rubrics = [] } = {}) {
  const rubric = rubrics.find((r) => String(r.id) === String(form.rubricId));
  const e = form.eligibility || {};
  return {
    project_type: form.projectType || null,
    title: str(form.title).trim(),
    summary: str(form.summary).trim(),
    domain: str(form.domain).trim(),
    scope: str(form.scope).trim(),
    objectives: filled(form.objectives),
    deliverables: filled(form.deliverables),
    learning_outcomes: filled(form.learningOutcomes),
    roles: (form.roles || []).filter((r) => hasText(r.name) || hasText(r.capacity)).map((r) => ({
      ...(r.id ? { id: r.id } : {}),
      name: str(r.name).trim(),
      capacity: toInt(r.capacity),
      min_required: toInt(r.minRequired) ?? 1,
    })),
    capacity: toInt(form.totalCapacity),
    start_date: form.startDate || null,
    end_date: form.endDate || null,
    application_deadline: form.applicationDeadline || null,
    schedule: str(form.schedule).trim(),
    duration_weeks: toInt(form.durationWeeks),
    work_mode: form.workMode || null,
    location: str(form.location).trim(),
    required_skills: (form.skills || []).map((s) => ({
      skill_id: s.skillId,
      minimum_required_level: Number(s.minLevel),
      is_critical_entry: Boolean(s.critical),
    })),
    difficulty: form.difficulty || null,
    career_role_id: form.careerRoleId ? (Number(form.careerRoleId) || form.careerRoleId) : null,
    eligibility: {
      open_to_all: Boolean(e.openToAll),
      organization: str(e.organization).trim(),
      location: str(e.location).trim(),
      language: str(e.language).trim(),
      schedule: str(e.schedule).trim(),
      work_mode: str(e.workMode).trim(),
    },
    // PRJ-08 / AC-08: the confidential text travels in its own field.
    confidentiality: form.confidentiality,
    confidential_info: form.confidentiality === 'confidential' ? str(form.confidentialInfo).trim() : '',
    rubric_id: form.rubricId ? (Number(form.rubricId) || form.rubricId) : null,
    rubric_version: rubric?.version ?? null,
  };
}

const eligibilityDefined = (e = {}) => Boolean(e.openToAll) || ['organization', 'location', 'language', 'schedule', 'workMode'].some((k) => hasText(e[k]));
const needsLocation = (mode) => mode === 'onsite' || mode === 'hybrid';
const roleSum = (roles) => (roles || []).reduce((a, r) => a + (Number(r.capacity) || 0), 0);

/**
 * Field-level errors. mode 'draft' = only what must be right to SAVE
 * (title + type + consistency); mode 'submit' = everything PRJ-01/PRJ-02 asks.
 * Returns { fieldKey: messageKey } — message keys live in projectMessages.js.
 */
export function validateProjectForm(form, mode = 'submit', options = {}) {
  const err = {};
  const submit = mode === 'submit';
  if (!PROJECT_TYPES.includes(form.projectType)) err.projectType = 'prj.err.type';
  if (!hasText(form.title)) err.title = 'prj.err.title';
  else if (str(form.title).trim().length > 120) err.title = 'prj.err.titleLong';

  // Consistency checks — apply to drafts too, so nothing invalid is stored.
  if (form.startDate && form.endDate && form.endDate < form.startDate) err.endDate = 'prj.err.endBeforeStart';
  if (form.applicationDeadline && form.startDate && form.applicationDeadline > form.startDate) err.applicationDeadline = 'prj.err.deadlineAfterStart'; // BR-07
  const total = Number(form.totalCapacity);
  if (hasText(form.totalCapacity) && (!Number.isInteger(total) || total < 1)) err.totalCapacity = 'prj.err.capacityNumber';
  (form.roles || []).forEach((r, i) => {
    const c = Number(r.capacity);
    if (hasText(r.capacity) && (!Number.isInteger(c) || c < 1)) err[`roles.${i}.capacity`] = 'prj.err.capacityNumber';
    const m = Number(r.minRequired);
    if (hasText(r.minRequired) && (!Number.isInteger(m) || m < 0)) err[`roles.${i}.minRequired`] = 'prj.err.minNumber';
    else if (hasText(r.capacity) && m > c) err[`roles.${i}.minRequired`] = 'prj.err.minAboveCapacity';
  });
  if (hasText(form.totalCapacity) && Number.isInteger(total) && roleSum(form.roles) > total) err.roles = 'prj.err.roleSum'; // BR-08
  (form.skills || []).forEach((s, i) => {
    if (!SKILL_LEVELS.includes(Number(s.minLevel))) err[`skills.${i}.minLevel`] = 'prj.err.level'; // BR-06
    if (s.skillId == null) err[`skills.${i}`] = 'prj.err.skillTaxonomy'; // BR-05
  });
  if (hasText(form.durationWeeks) && !(Number(form.durationWeeks) > 0)) err.durationWeeks = 'prj.err.positive';

  if (!submit) return err;

  // PRJ-01 (BR-03)
  if (!hasText(form.domain)) err.domain = 'prj.err.required';
  if (!hasText(form.summary)) err.summary = 'prj.err.required';
  if (!hasText(form.scope)) err.scope = 'prj.err.required';
  if (!filled(form.objectives).length) err.objectives = 'prj.err.oneItem';
  if (!filled(form.deliverables).length) err.deliverables = 'prj.err.oneItem';
  if (!form.startDate) err.startDate = 'prj.err.required';
  if (!form.endDate) err.endDate = err.endDate || 'prj.err.required';
  if (!form.applicationDeadline) err.applicationDeadline = err.applicationDeadline || 'prj.err.required';
  if (!hasText(form.totalCapacity)) err.totalCapacity = 'prj.err.required';

  // PRJ-02 (BR-04)
  if (!filled(form.learningOutcomes).length) err.learningOutcomes = 'prj.err.oneItem';
  const roles = (form.roles || []).filter((r) => hasText(r.name) || hasText(r.capacity));
  if (!roles.length) err.roles = err.roles || 'prj.err.oneRole';
  (form.roles || []).forEach((r, i) => {
    if (!hasText(r.name) && hasText(r.capacity)) err[`roles.${i}.name`] = 'prj.err.required';
    if (hasText(r.name) && !hasText(r.capacity)) err[`roles.${i}.capacity`] = 'prj.err.required';
  });
  if (!hasText(form.schedule)) err.schedule = 'prj.err.required';
  if (!WORK_MODES.includes(form.workMode)) err.workMode = 'prj.err.required';
  if (needsLocation(form.workMode) && !hasText(form.location)) err.location = 'prj.err.location';
  if (!(form.skills || []).length) err.skills = 'prj.err.oneSkill';
  if (!DIFFICULTIES.includes(form.difficulty)) err.difficulty = 'prj.err.required';
  if (!eligibilityDefined(form.eligibility)) err.eligibility = 'prj.err.eligibility';

  // PRJ-08 / PRJ-09
  if (form.confidentiality === 'confidential' && !hasText(form.confidentialInfo)) err.confidentialInfo = 'prj.err.confidential';
  // A rubric is only required when the platform actually offers one. `GET
  // /api/v1/rubrics` can legitimately come back empty (nothing published yet),
  // and blocking the whole form on an impossible choice is what stopped
  // companies from creating projects at all.
  if (options.rubricsAvailable !== false && !form.rubricId) err.rubricId = 'prj.err.rubric';
  return err;
}

// Which section a field belongs to (for the stepper badges and "Fix" links).
export function sectionOf(field) {
  const f = String(field).split('.')[0];
  if (['projectType', 'title', 'summary', 'domain', 'scope', 'objectives', 'deliverables', 'learningOutcomes'].includes(f)) return 'basic';
  if (['roles', 'totalCapacity', 'startDate', 'endDate', 'applicationDeadline', 'schedule', 'durationWeeks', 'workMode', 'location'].includes(f)) return 'roles';
  if (['skills', 'difficulty', 'careerRoleId', 'eligibility'].includes(f)) return 'skills';
  return 'confidentiality';
}

/**
 * Completeness check for Review & Submit (Scenario 2 / Scenario 4, AC-10):
 * every missing or invalid item, grouped by section, in form order.
 */
export function completeness(form) {
  const errors = validateProjectForm(form, 'submit');
  const items = Object.entries(errors).map(([field, message]) => ({ field, message, section: sectionOf(field) }));
  const order = FORM_SECTIONS;
  items.sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section));
  const checks = 22; // the fields the check looks at (for the progress figure)
  return { complete: items.length === 0, missing: items, percent: Math.max(0, Math.round(((checks - Math.min(items.length, checks)) / checks) * 100)) };
}

/**
 * 422 from the backend → the same field keys the form uses, so each message
 * lands under its own input and nothing the user typed is lost.
 *   "required_skills.0.minimum_required_level" → "skills.0.minLevel"
 */
const SERVER_FIELDS = {
  project_type: 'projectType', title: 'title', summary: 'summary', domain: 'domain', scope: 'scope',
  objectives: 'objectives', deliverables: 'deliverables', learning_outcomes: 'learningOutcomes',
  roles: 'roles', capacity: 'totalCapacity', total_capacity: 'totalCapacity',
  start_date: 'startDate', end_date: 'endDate', application_deadline: 'applicationDeadline',
  schedule: 'schedule', duration_weeks: 'durationWeeks', work_mode: 'workMode', location: 'location',
  required_skills: 'skills', difficulty: 'difficulty', career_role_id: 'careerRoleId', eligibility: 'eligibility',
  confidentiality: 'confidentiality', confidential_info: 'confidentialInfo', rubric_id: 'rubricId', rubric_version: 'rubricId',
};
const SERVER_SUBFIELDS = { capacity: 'capacity', name: 'name', min_required: 'minRequired', minimum_required_level: 'minLevel', skill_id: '' };

export function mapServerErrors(errors = {}) {
  const out = {};
  Object.entries(errors || {}).forEach(([key, messages]) => {
    const parts = key.split('.');
    const head = SERVER_FIELDS[parts[0]] || parts[0];
    let field = head;
    if (parts.length >= 2 && /^\d+$/.test(parts[1])) {
      const sub = parts[2] != null ? SERVER_SUBFIELDS[parts[2]] ?? parts[2] : '';
      field = sub ? `${head}.${parts[1]}.${sub}` : `${head}.${parts[1]}`;
    } else if (head === 'eligibility') {
      field = 'eligibility';
    }
    const text = Array.isArray(messages) ? messages[0] : String(messages);
    if (!out[field]) out[field] = { text };
  });
  return out;
}
