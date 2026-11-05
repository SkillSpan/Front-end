// US-PRJ-01 — Company Project Publication & Requirements.
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import ProjectForm from '../projects/ProjectForm.jsx';
import {
  completeness, emptyProjectForm, formToPayload, mapServerErrors, projectToForm, validateProjectForm,
} from '../projects/projectForm';
import { loadCareerRoleSkills } from '../projects/api/projectPublicationApi';
import { SAMPLE_PROJECTS } from '../projects/projectsMock';
import { resetMockBackend, mockForceState, mockGetProject, mockSubmitProject, mockTransition } from '../projects/mockBackend';

const complete = () => projectToForm(SAMPLE_PROJECTS[0]); // Clinic App: every PRJ-01/PRJ-02 field set

function mount(path, { lang } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/projects/new" element={<ProjectForm demo="full" />} />
          <Route path="/company/projects/:id/edit" element={<ProjectForm demo="full" />} />
          <Route path="/company/projects/:id" element={<div>detail page</div>} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetMockBackend(); window.localStorage.clear(); });

describe('US-PRJ-01 validation rules (projectForm.js)', () => {
  it('a draft needs only a type and a title (AC-09, BR-11)', () => {
    expect(validateProjectForm(emptyProjectForm(), 'draft')).toEqual({ projectType: 'prj.err.type', title: 'prj.err.title' });
    expect(validateProjectForm({ ...emptyProjectForm(), projectType: 'simulation', title: 'X' }, 'draft')).toEqual({});
  });

  it('BR-07: the application deadline cannot be after the start date', () => {
    const f = { ...complete(), applicationDeadline: '2026-12-01', startDate: '2026-11-16' };
    expect(validateProjectForm(f, 'draft').applicationDeadline).toBe('prj.err.deadlineAfterStart');
  });

  it('BR-08: role capacities cannot add up to more than the total capacity', () => {
    const f = { ...complete(), totalCapacity: '4' }; // roles 2 + 2 + 1
    expect(validateProjectForm(f, 'draft').roles).toBe('prj.err.roleSum');
  });

  it('BR-05 / BR-06: skills come from the taxonomy with a 1–5 minimum level', () => {
    const f = { ...complete(), skills: [{ skillId: null, skillName: 'Free text', minLevel: 7, critical: false }] };
    const e = validateProjectForm(f, 'submit');
    expect(e['skills.0']).toBe('prj.err.skillTaxonomy');
    expect(e['skills.0.minLevel']).toBe('prj.err.level');
  });

  it('BR-09 / BR-10: type and an approved rubric are required to submit', () => {
    const e = validateProjectForm({ ...complete(), projectType: 'other', rubricId: '' }, 'submit');
    expect(e.projectType).toBeTruthy();
    expect(e.rubricId).toBe('prj.err.rubric');
  });

  it('PRJ-08: a confidential project needs its confidential text', () => {
    const e = validateProjectForm({ ...complete(), confidentiality: 'confidential', confidentialInfo: '' }, 'submit');
    expect(e.confidentialInfo).toBe('prj.err.confidential');
  });

  it('AC-10: the completeness check lists every missing item', () => {
    const c = completeness(emptyProjectForm());
    expect(c.complete).toBe(false);
    const fields = c.missing.map((m) => m.field);
    ['projectType', 'title', 'domain', 'objectives', 'deliverables', 'startDate', 'endDate', 'totalCapacity', 'skills', 'difficulty', 'learningOutcomes', 'workMode', 'schedule', 'eligibility', 'rubricId']
      .forEach((f) => expect(fields).toContain(f));
    expect(completeness(complete()).complete).toBe(true);
  });

  it('BR-02: the payload never carries ownership or status; confidential info is its own field (AC-08)', () => {
    const body = formToPayload(complete(), { rubrics: [{ id: 11, version: '2.1' }] });
    expect(body).not.toHaveProperty('organization_id');
    expect(body).not.toHaveProperty('owner');
    expect(body).not.toHaveProperty('status');
    expect(body.required_skills[0]).toEqual({ skill_id: 101, minimum_required_level: 3, is_critical_entry: true });
    expect(body.confidential_info).toMatch(/NDA/);
    expect(body.rubric_version).toBe('2.1');
    expect(formToPayload({ ...complete(), confidentiality: 'public' }).confidential_info).toBe('');
  });

  it('maps the backend 422 errors back onto the form fields', () => {
    expect(mapServerErrors({ 'required_skills.0.minimum_required_level': ['Too high'], application_deadline: ['Bad'], 'roles.1.capacity': ['x'] }))
      .toEqual({ 'skills.0.minLevel': { text: 'Too high' }, applicationDeadline: { text: 'Bad' }, 'roles.1.capacity': { text: 'x' } });
  });
});

describe('US-PRJ-01 server rules (preview backend mirrors them)', () => {
  it('AC-11: a complete draft submits and moves to Submitted; a retry is not a second submission', () => {
    const p = mockGetProject('p5').data; // Brand Identity Kit draft — incomplete
    expect(() => mockSubmitProject(p.id)).toThrow();
    try { mockSubmitProject(p.id); } catch (err) { expect(err.code).toBe('PROJECT_INCOMPLETE'); expect(err.details.missing).toContain('rubricId'); }
  });

  it('AC-12: owner-approval policy moves a complete project to Approved with approver metadata', () => {
    resetMockBackend({ approvalPolicy: 'owner_approval' });
    const res = mockSubmitProject('p3', { idempotencyKey: 'k1' }); // Changes Requested, complete
    expect(res.data.status).toBe('approved');
    expect(res.data.approval.approver.name).toBe('Lina Haddad');
    expect(mockSubmitProject('p3', { idempotencyKey: 'k1' }).data.status).toBe('approved'); // same key → same answer
  });

  it('AC-13: a project without an approved rubric cannot open', () => {
    mockForceState('p5', 'approved'); // Brand Identity Kit has no rubric
    let err;
    try { mockTransition('p5', { action: 'open' }); } catch (e) { err = e; }
    expect(err.code).toBe('RUBRIC_REQUIRED');
    expect(mockGetProject('p5').data.status).toBe('approved');
  });
});

describe('Create Project screen', () => {
  it('opens on the project type choice and the five sections (AC-01, AC-02)', async () => {
    mount('/company/projects/new');
    expect(await screen.findByRole('heading', { name: 'Create project' })).toBeTruthy();
    expect(await screen.findByRole('radio', { name: /Company-sponsored project/ })).toBeTruthy();
    expect(screen.getByRole('radio', { name: /Simulation project/ })).toBeTruthy();
    const nav = screen.getByRole('navigation', { name: 'Form sections' });
    ['Basic information', 'Roles, schedule & capacity', 'Skills, difficulty & eligibility', 'Confidentiality & evaluation', 'Review & submit']
      .forEach((name) => expect(within(nav).getByRole('button', { name: new RegExp(name.replace(/[&,]/g, '.')) })).toBeTruthy());
  });

  it('Save as Draft without a title shows the field errors and keeps the values', async () => {
    mount('/company/projects/new');
    const summary = await screen.findByLabelText(/Short summary/);
    fireEvent.change(summary, { target: { value: 'Keep me' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Save as draft/ })[0]);
    expect(await screen.findByText('Give the project a title.')).toBeTruthy();
    expect(screen.getByText('Choose a project type.')).toBeTruthy();
    expect(screen.getByLabelText(/Short summary/).value).toBe('Keep me');
  });

  it('saves a draft (AC-09) and lists the missing items on Review & Submit (AC-10)', async () => {
    mount('/company/projects/new');
    fireEvent.click(await screen.findByRole('radio', { name: /Simulation project/ }));
    fireEvent.change(screen.getByLabelText(/Project title/), { target: { value: 'Coffee brand kit' } });
    fireEvent.click(screen.getAllByRole('button', { name: /Save as draft/ })[0]);
    expect(await screen.findByText('Draft saved')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Review & submit/ }));
    expect(await screen.findByText(/items missing/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Submit for approval/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Evaluation rubric/ })).toBeTruthy();
  });

  it('a complete Changes Requested project shows the reason and resubmits (UC-07)', async () => {
    mount('/company/projects/p3/edit?section=review');
    expect(await screen.findByText(/lower the minimum level for Interaction Design/)).toBeTruthy();
    const btn = await screen.findByRole('button', { name: /Resubmit/ });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(await screen.findByText('detail page')).toBeTruthy();
    expect(mockGetProject('p3').data.status).toBe('submitted');
  });

  it('a project that is not Draft / Changes Requested cannot be edited (US-PRJ-02 BR-04)', async () => {
    mount('/company/projects/p1/edit');
    expect(await screen.findByText(/project can’t be edited/)).toBeTruthy();
  });

  it('renders in Arabic', async () => {
    mount('/company/projects/new', { lang: 'ar' });
    expect(await screen.findByRole('heading', { name: 'إنشاء مشروع' })).toBeTruthy();
    expect(await screen.findByRole('radio', { name: /مشروع محاكاة/ })).toBeTruthy();
  });
});

describe('ProjectForm waits for the skill list', () => {
  it('adds a skill from the taxonomy picker with a minimum level (AC-04/AC-05)', async () => {
    mount('/company/projects/new?section=skills');
    const search = await screen.findByPlaceholderText('Search the skill list…');
    fireEvent.focus(search);
    fireEvent.change(search, { target: { value: 'figma' } });
    fireEvent.click(await screen.findByRole('option', { name: /Prototyping \(Figma\)/ }));
    expect(screen.getByText('Prototyping (Figma)')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: '4' }));
    expect(screen.getByRole('radio', { name: '4' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('checkbox', { name: /Critical entry/ }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Critical entry/ })).toBeChecked());
  });
});

/*
 * The picker offers the whole taxonomy, but the server only accepts skills
 * inside the chosen career role's map (SkillMappedToCareerRole). `null` means
 * "do not filter", so these two cases must never reach the network — a failed
 * lookup must not hide every skill in the form.
 */
describe('career role skill map', () => {
  it('is never requested without a role, or in preview', async () => {
    expect(await loadCareerRoleSkills('')).toBeNull();
    expect(await loadCareerRoleSkills(null)).toBeNull();
    expect(await loadCareerRoleSkills(7, { preview: true })).toBeNull();
  });
});
