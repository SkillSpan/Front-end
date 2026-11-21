// US-COMP-05 — Consent-Aware Talent Search & Ranking (COMP-01/02, BR-02/05/12, ADL-17, AC-02/07/12).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import TalentSearch from '../talent/TalentSearch';
import CandidateSummary from '../talent/CandidateSummary';
import TalentCompare from '../talent/TalentCompare';
import TalentLists from '../talent/TalentLists';
import { resetTalentMock, mockHideCandidate } from '../talent/talentApi';
import { compareSelection } from '../talent/selection';
import { resetMockBackend } from '../projects/mockBackend';

function mount(path, { lang, previewState } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/talent" element={<TalentSearch demo="full" previewState={previewState} />} />
          <Route path="/company/talent/compare" element={<TalentCompare demo="full" previewState={previewState} />} />
          <Route path="/company/talent/lists" element={<TalentLists demo="full" previewState={previewState} />} />
          <Route path="/company/talent/lists/:listId" element={<TalentLists demo="full" previewState={previewState} />} />
          <Route path="/company/talent/:id" element={<CandidateSummary demo="full" previewState={previewState} />} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetTalentMock(); resetMockBackend(); clearQueryCache(); compareSelection.clear(); window.localStorage.clear(); window.sessionStorage.clear(); api.companyRequest.mockReset(); });

const names = () => screen.getAllByRole('listitem').filter((li) => li.classList.contains('cw-tl-card')).map((li) => within(li).getAllByRole('button')[0].textContent);

describe('Guide routes (COMPANY_FRONTEND_A_TO_Z §7)', () => {
  it('GET /talent with the guide parameter names, GET /talent/filters, GET /talent/{student}', async () => {
    const { searchTalent, getTalentFilterOptions, getCandidate } = await import('../talent/talentApi');
    api.companyRequest.mockResolvedValue({ success: true, data: [{ id: 31, name: 'Lina H.', career_role: 'Backend Developer', readiness: { score: 78, band: 'near_ready' }, top_skills: [] }], meta: { current_page: 1, last_page: 3, per_page: 8, total: 42 } });
    const page = await searchTalent({ search: 'lin', role: 'backend-developer', minReadiness: '60', sort: 'readiness', page: 2 });
    expect(api.companyRequest.mock.calls[0][0]).toBe('/api/v1/talent?search=lin&career_role=backend-developer&min_readiness=60&sort=readiness&page=2&per_page=8');
    expect(page.items[0]).toMatchObject({ id: 31, name: 'Lina H.', careerRole: 'Backend Developer', readiness: { score: 78, band: 'near_ready' } });
    expect(page.total).toBe(42);

    api.companyRequest.mockResolvedValue({ success: true, data: { career_roles: [{ id: 3, title: 'Backend Developer', slug: 'backend-developer' }], readiness_bands: ['developing'] } });
    const f = await getTalentFilterOptions();
    expect(api.companyRequest.mock.calls[1][0]).toBe('/api/v1/talent/filters');
    expect(f.careerRoles[0].slug).toBe('backend-developer');
    expect(f.skills).toBeNull(); // extra COMP-01 filters only when the backend lists them

    api.companyRequest.mockResolvedValue({ success: true, data: { id: 31, name: 'Lina H.', top_skills: [] } });
    await getCandidate(31);
    expect(api.companyRequest.mock.calls[2][0]).toBe('/api/v1/talent/31');
  });
  it('an unsupported sort is a 422, never silently ignored', async () => {
    const { searchTalent } = await import('../talent/talentApi');
    await expect(searchTalent({ sort: 'salary' }, { preview: true })).rejects.toMatchObject({ status: 422, code: 'VALIDATION_ERROR' });
  });
});

describe('Talent search screen', () => {
  it('ranks by readiness with deterministic ties and shows rank, band, verified skills and evidence counts', async () => {
    mount('/company/talent');
    expect(await screen.findByText('Rami Haddad')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '12 candidates' })).toBeInTheDocument();
    expect(names().slice(0, 3)).toEqual(['Rami Haddad', 'Sara Nasser', 'Basel Nofal']);
    const card = screen.getByText('Rami Haddad').closest('li');
    expect(within(card).getByText('#1')).toBeInTheDocument();
    expect(within(card).getByText('Highly ready')).toBeInTheDocument();
    expect(within(card).getByText('Projects: 2')).toBeInTheDocument();
    expect(within(card).getAllByText('Verified').length).toBeGreaterThan(0); // AC-03 labelled, not colour only
    expect(within(card).getByText('Self-declared')).toBeInTheDocument();
  });
  it('never lists a candidate who withdrew consent (BR-02, BR-05)', async () => {
    mockHideCandidate(32);
    mount('/company/talent');
    await screen.findByText('Rami Haddad');
    expect(screen.queryByText('Sara Nasser')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '11 candidates' })).toBeInTheDocument();
  });
  it('filters by career role and minimum readiness from the URL', async () => {
    mount('/company/talent?role=ux-ui-designer&min=60');
    await waitFor(() => expect(screen.getByRole('heading', { name: '2 candidates' })).toBeInTheDocument());
    expect(names()).toEqual(['Sara Nasser', 'Omar Khalil']);
  });
  it('shows the rank rationale with factors and missing-evidence limitations (COMP-02, AC-07)', async () => {
    mount('/company/talent');
    await screen.findByText('Ahmad Jaber');
    const card = screen.getByText('Ahmad Jaber').closest('li');
    fireEvent.click(within(card).getByRole('button', { name: /Why this rank/ }));
    expect(within(card).getByText('Verified skills')).toBeInTheDocument();
    expect(within(card).getByText(/No completed projects/)).toBeInTheDocument();
    expect(within(card).getByText(/makes no hiring decision/)).toBeInTheDocument();
  });
  it('no match → empty state with permitted filter adjustments (BR-12)', async () => {
    mount('/company/talent?role=backend-developer&min=90');
    expect(await screen.findByText('No candidates match')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Any readiness' }));
    expect(await screen.findByText('Rami Haddad')).toBeInTheDocument();
  });
  it('compare tray: at most 4, Compare needs 2', async () => {
    mount('/company/talent');
    await screen.findByText('Rami Haddad');
    const boxes = screen.getAllByRole('checkbox', { name: 'Compare' });
    fireEvent.click(boxes[0]);
    expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compare (1)' })).toBeDisabled();
    [1, 2, 3].forEach((i) => fireEvent.click(boxes[i]));
    expect(screen.getByText('4 of 4 selected')).toBeInTheDocument();
    expect(boxes[4]).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Compare (4)' })).toBeEnabled();
  });
  it('saves a candidate to a new list from a result card (US-COMP-07 Scenario 1)', async () => {
    mount('/company/talent');
    await screen.findByText('Rami Haddad');
    fireEvent.click(within(screen.getByText('Rami Haddad').closest('li')).getByRole('button', { name: 'Save to list' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByLabelText('New list'));
    fireEvent.click(within(dlg).getByRole('button', { name: 'Create list' }));
    expect(await within(dlg).findByText('Give the list a name.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText(/List name/), { target: { value: 'Backend shortlist' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Create list' }));
    expect(await screen.findByText('Saved to “Backend shortlist”')).toBeInTheDocument();
  });
  it('is gated without talent permission', async () => {
    mount('/company/talent', { previewState: 'readonly' });
    expect(await screen.findByText('Talent search isn’t available for your role')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
  it('error state offers Retry', async () => {
    mount('/company/talent', { previewState: 'error' });
    expect(await screen.findByRole('button', { name: /Retry|Try again/i })).toBeInTheDocument();
  });
  it('Arabic strings', async () => {
    mount('/company/talent', { lang: 'ar' });
    expect(await screen.findByRole('heading', { name: 'عدد المرشحين: 12' })).toBeInTheDocument();
    expect(screen.getAllByText('جاهز بدرجة عالية').length).toBeGreaterThan(0);
  });
});
