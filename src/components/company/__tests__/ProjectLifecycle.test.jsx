// US-PRJ-02 — Company Project Management & Lifecycle.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import ProjectsList from '../projects/ProjectsList';
import ProjectDetail from '../projects/ProjectDetail';
import { PROJECT_STATES, TRANSITIONS, allowedActions, isEditable } from '../projects/lifecycle';
import { resetMockBackend, mockForceState, mockGetProject, mockTransition, mockCloneProject } from '../projects/mockBackend';
import { listCompanyProjects, runProjectAction, cloneProject, getCompanyProject } from '../projects/api/projectLifecycleApi';

function mount(path, el, { lang } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/projects" element={el || <ProjectsList demo="full" />} />
          <Route path="/company/projects/:id" element={el || <ProjectDetail demo="full" />} />
          <Route path="/company/projects/:id/edit" element={<div>edit page</div>} />
          <Route path="/company/projects/new" element={<div>create page</div>} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetMockBackend(); clearQueryCache(); window.localStorage.clear(); api.companyRequest.mockReset(); });

describe('SRS Table 70 — project lifecycle', () => {
  it('knows the 12 project states', () => {
    expect(PROJECT_STATES).toEqual(['draft', 'submitted', 'changes_requested', 'approved', 'open', 'selection', 'active', 'under_review', 'completed', 'rejected', 'cancelled', 'archived']);
  });
  it('offers only the transitions Table 70 allows the owner', () => {
    expect(TRANSITIONS.open).toEqual(['move_to_selection', 'cancel']);
    expect(allowedActions('selection')).toEqual(['start', 'reopen', 'cancel']);
    expect(allowedActions('archived')).toEqual([]);
    expect(isEditable('draft')).toBe(true);
    expect(isEditable('open')).toBe(false);
  });
  it('the server rejects an invalid transition and keeps the state (Scenario 4)', () => {
    let err;
    try { mockTransition('p4', { action: 'archive' }); } catch (e) { err = e; }
    expect(err.status).toBe(409);
    expect(mockGetProject('p4').data.status).toBe('active');
  });
  it('cancel needs a reason (BR-10)', () => {
    expect(() => mockTransition('p2', { action: 'cancel' })).toThrow();
    expect(mockTransition('p2', { action: 'cancel', reason: 'Budget' }).data.status).toBe('cancelled');
  });
  it('clone creates a fresh draft without applications (Scenario 6)', () => {
    const copy = mockCloneProject('p9').data;
    expect(copy.status).toBe('draft');
    expect(copy.applications_count).toBe(0);
    expect(copy.id).not.toBe('p9');
  });
});

describe('Live API calls use the sprint-document endpoints (TODO until the projects guide arrives)', () => {
  it('lists, reads, transitions and clones', async () => {
    api.companyRequest.mockResolvedValue({ data: [{ id: 7, title: 'A', status: 'open', project_type: 'simulation', capacity_state: { accepted: 1, total: 4 } }], meta: { total: 1, per_page: 8, current_page: 1, last_page: 1 }, stats: { total: 1, by_status: { open: 1 } } });
    const page = await listCompanyProjects({ state: 'open', search: 'A', page: 1 });
    // `q` and `recent` are the API's names; `search` and `updated_desc` were
    // dropped silently, which returned the unfiltered list.
    expect(api.companyRequest.mock.calls[0][0]).toBe('/api/v1/company/projects?page=1&per_page=8&status=open&q=A&sort=recent');
    expect(page.items[0]).toMatchObject({ id: 7, title: 'A', status: 'open', filled: 1, capacity: 4 });
    expect(page.statusCounts).toEqual({ open: 1 });

    api.companyRequest.mockResolvedValue({ data: { id: 7, status: 'selection' } });
    await getCompanyProject(7);
    expect(api.companyRequest.mock.calls[1][0]).toBe('/api/v1/company/projects/7');
    await runProjectAction(7, 'cancel', { reason: 'Budget', idempotencyKey: 'k' });
    const [path, opts] = api.companyRequest.mock.calls[2];
    expect(path).toBe('/api/v1/projects/7/transitions');
    expect(opts.method).toBe('POST');
    expect(opts.body).toMatchObject({ action: 'cancel', to: 'cancelled', reason: 'Budget' });
    expect(opts.headers).toEqual({ 'Idempotency-Key': 'k' });
    await cloneProject(7);
    expect(api.companyRequest.mock.calls[3][0]).toBe('/api/v1/projects/7/clone');
  });
});

describe('My Projects', () => {
  it('lists the organization’s projects with state, type, deadline and capacity (Scenario 1)', async () => {
    mount('/company/projects');
    expect(await screen.findByText('Clinic App UX Redesign')).toBeTruthy();
    expect(screen.getAllByRole('heading', { name: 'Projects' }).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Selection').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Create project/ })).toBeTruthy();
  });

  it('filters by state from the URL (Scenario 2)', async () => {
    mount('/company/projects?state=completed');
    expect(await screen.findAllByText('Completed')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Clinic App UX Redesign')).toBeNull());
  });

  it('shows a no-match state for a search with no result', async () => {
    mount('/company/projects?search=zzzz');
    expect(await screen.findByText('No projects match')).toBeTruthy();
  });

  it('empty organization → create-first-project state', async () => {
    mount('/company/projects?preview=empty', <ProjectsList demo="full" previewState="empty" />);
    expect(await screen.findByText(/Create your first project/)).toBeTruthy();
  });

  it('a read-only representative cannot create projects (AUTH-04)', async () => {
    mount('/company/projects', <ProjectsList demo="full" previewState="readonly" />);
    await screen.findByText('Clinic App UX Redesign');
    expect(screen.queryByRole('button', { name: /Create project/ })).toBeNull();
  });

  it('renders in Arabic', async () => {
    mount('/company/projects', null, { lang: 'ar' });
    expect((await screen.findAllByRole('heading', { name: 'المشاريع' })).length).toBeGreaterThan(0);
  });
});

describe('Project details', () => {
  it('Changes Requested shows the moderator reason and Revise (UC-07)', async () => {
    mount('/company/projects/p3');
    expect((await screen.findAllByText(/lower the minimum level for Interaction Design/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Revise and resubmit/ }));
    expect(await screen.findByText('edit page')).toBeTruthy();
  });

  it('Open → Selection asks first, then moves the project', async () => {
    mount('/company/projects/p2');
    fireEvent.click(await screen.findByRole('button', { name: /Move to selection/ }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: /Move to selection/ }));
    await waitFor(() => expect(mockGetProject('p2').data.status).toBe('selection'));
    expect(await screen.findByText(/Project is now Selection/)).toBeTruthy();
  });

  it('cancelling requires a reason (BR-10)', async () => {
    mount('/company/projects/p7');
    fireEvent.click(await screen.findByRole('button', { name: /Cancel project/ }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: /Cancel project/ }));
    expect(await within(dlg).findByText('Please give a reason.')).toBeTruthy();
    expect(mockGetProject('p7').data.status).toBe('open');
    fireEvent.change(within(dlg).getByLabelText(/Reason for cancelling/), { target: { value: 'Budget moved' } });
    fireEvent.click(within(dlg).getByRole('button', { name: /Cancel project/ }));
    await waitFor(() => expect(mockGetProject('p7').data.status).toBe('cancelled'));
  });

  it('an archived project is read-only with no lifecycle actions', async () => {
    mount('/company/projects/p12');
    expect(await screen.findByText('Archived projects are read-only records.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Edit/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Cancel project/ })).toBeNull();
  });

  it('a project of another organization reads as not found (NFR-SEC-06)', async () => {
    mount('/company/projects/p999');
    expect(await screen.findByText('Project not found')).toBeTruthy();
  });

  it('a stale transition reports the conflict and keeps the page (Scenario 4)', async () => {
    mount('/company/projects/p2');
    await screen.findByRole('button', { name: /Move to selection/ });
    mockForceState('p2', 'cancelled'); // someone else cancelled it meanwhile
    fireEvent.click(screen.getByRole('button', { name: /Move to selection/ }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: /Move to selection/ }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(mockGetProject('p2').data.status).toBe('cancelled');
  });
});
