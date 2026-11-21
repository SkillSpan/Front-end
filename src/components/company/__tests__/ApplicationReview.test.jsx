// US-MATCH-03 — Application Review & Selection Decisions.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import ApplicationsPage from '../applications/ApplicationsPage';
import ApplicationDetail from '../applications/ApplicationDetail';
import { allowedDecisions, decideApplication, listApplications, getApplication, APPLICATION_STATUSES } from '../applications/applicationReviewApi';
import { resetMockBackend, mockDecide, mockGetApplication } from '../projects/mockBackend';

function mount(path, { lang, previewState } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/applicants" element={<ApplicationsPage demo="full" previewState={previewState} />} />
          <Route path="/company/applicants/:id" element={<ApplicationDetail demo="full" previewState={previewState} />} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetMockBackend(); clearQueryCache(); window.localStorage.clear(); api.companyRequest.mockReset(); });

describe('Decision rules', () => {
  it('uses the SRS Table 75 application statuses (BR-04)', () => {
    expect(APPLICATION_STATUSES).toEqual(['draft', 'submitted', 'shortlisted', 'waitlisted', 'accepted', 'rejected', 'withdrawn', 'expired']);
  });
  it('withdrawn and expired applications get no decision (BR-05, AC-09)', () => {
    expect(allowedDecisions({ status: 'withdrawn', allowedDecisions: ['accept'] })).toEqual([]);
    expect(allowedDecisions({ status: 'expired' })).toEqual([]);
    expect(allowedDecisions({ status: 'submitted' })).toEqual(['shortlist', 'waitlist', 'accept', 'reject']);
    expect(allowedDecisions({ status: 'shortlisted', allowedDecisions: ['accept', 'reject'] })).toEqual(['accept', 'reject']); // server wins
  });
  it('acceptance is blocked when the role is full (BR-06, AC-08)', () => {
    mockDecide('a104', { decision: 'accept' }); // UI Designer role → 2/2 accepted
    let err;
    try { mockDecide('a106', { decision: 'accept' }); } catch (e) { err = e; }
    expect(err.code).toBe('ROLE_CAPACITY_FULL');
    expect(mockGetApplication('a106').data.status).toBe('shortlisted');
  });
  it('a retried decision with the same key is one decision (BR-11, AC-12)', () => {
    mockDecide('a107', { decision: 'shortlist', reason: 'Strong research' }, { idempotencyKey: 'k1' });
    mockDecide('a107', { decision: 'shortlist', reason: 'Strong research' }, { idempotencyKey: 'k1' });
    const hist = mockGetApplication('a107').data.decision_history;
    expect(hist.filter((h) => h.to === 'shortlisted')).toHaveLength(1);
    expect(hist.at(-1)).toMatchObject({ from: 'submitted', to: 'shortlisted', reason: 'Strong research' }); // AC-07 actor/reason/time
    expect(hist.at(-1).actor.name).toBeTruthy();
    expect(hist.at(-1).at).toBeTruthy();
  });
});

describe('Live API calls (sprint-document endpoints, TODO until confirmed)', () => {
  it('list, detail and decision', async () => {
    api.companyRequest.mockResolvedValue({ data: [{ id: 9, status: 'submitted', submitted_at: '2026-10-01T00:00:00Z', applicant: { name: 'A' } }], meta: { total: 1, per_page: 8, current_page: 1, last_page: 1 } });
    const page = await listApplications(7, { status: 'submitted', page: 2 });
    expect(api.companyRequest.mock.calls[0][0]).toBe('/api/v1/projects/7/applications?status=submitted&sort=submitted_desc&page=2&per_page=8');
    expect(page.items[0]).toMatchObject({ id: 9, name: 'A', status: 'submitted' });

    api.companyRequest.mockResolvedValue({ data: { id: 9, status: 'submitted', applicant: { name: 'A' } } });
    await getApplication(9);
    expect(api.companyRequest.mock.calls[1][0]).toBe('/api/v1/applications/9');
    await decideApplication(9, 'reject', { reason: 'Not now', idempotencyKey: 'abc' });
    const [path, opts] = api.companyRequest.mock.calls[2];
    expect(path).toBe('/api/v1/applications/9/decision');
    // The API takes `status` with the past-tense value; the screen's verb is
    // mapped to it inside the module.
    expect(opts).toMatchObject({ method: 'POST', body: { status: 'rejected', reason: 'Not now' }, headers: { 'Idempotency-Key': 'abc' } });
    await decideApplication(9, 'shortlist', {});
    expect(api.companyRequest.mock.calls[3][1].body).toEqual({ status: 'shortlisted' }); // reason is optional (AC-06)
  });
});

describe('Applications list', () => {
  it('without a project, asks which project to review', async () => {
    mount('/company/applicants');
    expect(await screen.findByText('Choose a project')).toBeTruthy();
    expect(await screen.findByText('Clinic App UX Redesign')).toBeTruthy();
  });

  it('lists a project’s applications with status and date, filterable by status (AC-01, AC-02)', async () => {
    mount('/company/applicants?project=p1');
    expect(await screen.findByText('Khaled Odeh')).toBeTruthy();
    expect(screen.getByText(/9 awaiting a decision/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Withdrawn/ }));
    expect(await screen.findByText('Fadi Zaqout')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Khaled Odeh')).toBeNull());
  });

  it('empty state', async () => {
    mount('/company/applicants?project=p1', { previewState: 'empty' });
    expect(await screen.findByText('No applications yet')).toBeTruthy();
  });

  it('renders in Arabic', async () => {
    mount('/company/applicants?project=p1', { lang: 'ar' });
    expect((await screen.findAllByRole('heading', { name: 'الطلبات' })).length).toBeGreaterThan(0);
  });
});

describe('Application detail', () => {
  it('shows the approved application view (AC-03)', async () => {
    mount('/company/applicants/a107');
    expect((await screen.findAllByText('Khaled Odeh')).length).toBeGreaterThan(0);
    expect(screen.getByText('Why this project?')).toBeTruthy();
    expect(screen.getByText('User Research')).toBeTruthy();
    // Interaction Design is not a required skill of p1 — not part of the view.
    expect(screen.queryByText('Interaction Design')).toBeNull();
  });

  it('shortlists with an optional reason and shows it in the history (AC-05, AC-06, AC-07)', async () => {
    mount('/company/applicants/a107');
    fireEvent.click((await screen.findAllByRole('button', { name: /^Shortlist$/ }))[0]);
    const dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText(/Reason/), { target: { value: 'Great clinic study' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Shortlist' }));
    expect(await screen.findByText('Khaled Odeh is shortlisted')).toBeTruthy();
    expect(screen.getByText('Great clinic study')).toBeTruthy();
    expect(mockGetApplication('a107').data.status).toBe('shortlisted');
  });

  it('accepting into a full role is blocked, with Waitlist as the way out (Scenario 5)', async () => {
    mockDecide('a104', { decision: 'accept' }); // fills the UI Designer role (2/2)
    mount('/company/applicants/a106');
    const accept = (await screen.findAllByRole('button', { name: /^Accept$/ }))[0];
    expect(accept).toBeDisabled();
    expect(screen.getAllByText(/The UI Designer role is full/).length).toBeGreaterThan(0);
  });

  it('a withdrawn application has no decision actions (Scenario 6)', async () => {
    mount('/company/applicants/a115');
    expect(await screen.findByText('Withdrawn by the learner')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /^Accept$/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Reject$/ })).toBeNull();
  });

  it('read-only representatives see the view but cannot decide (AUTH-04)', async () => {
    mount('/company/applicants/a107', { previewState: 'readonly' });
    expect((await screen.findAllByText(/can view applications but not decide/)).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /^Accept$/ })).toBeNull();
  });

  it('another organization’s application reads as not found (AC-13)', async () => {
    mount('/company/applicants/zz9');
    expect((await screen.findAllByText(/not found|doesn’t exist/i)).length).toBeGreaterThan(0);
  });
});
