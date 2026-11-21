// US-COMP-06 — Candidate Evidence Summary & Comparison (COMP-03/04, BR-03/07/09, AC-03..09, TC-24).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
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

describe('Compare route (sprint-document name, TODO until the guide lists it)', () => {
  it('POST /api/v1/talent/compare with student_ids; hidden candidates only counted', async () => {
    const { compareCandidates } = await import('../talent/talentApi');
    api.companyRequest.mockResolvedValue({ data: { evidence_period: { from: '2025-11-04', to: '2026-11-04' }, candidates: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }], removed_count: 1 } });
    const r = await compareCandidates([1, 2, 3]);
    expect(api.companyRequest.mock.calls[0][0]).toBe('/api/v1/talent/compare');
    expect(api.companyRequest.mock.calls[0][1]).toMatchObject({ method: 'POST', body: { student_ids: [1, 2, 3] } });
    expect(r.removedCount).toBe(1);
    expect(r.candidates.map((c) => c.name)).toEqual(['A', 'B']);
  });
});

describe('Evidence summary', () => {
  it('separates verified from self-declared skills and shows contribution evidence (AC-03, AC-04)', async () => {
    mount('/company/talent/32');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sara Nasser' })).toBeInTheDocument();
    const skills = screen.getByRole('heading', { name: 'Skills' }).closest('section');
    expect(within(skills).getByRole('heading', { name: 'Verified' })).toBeInTheDocument();
    expect(within(skills).getByRole('heading', { name: 'Self-declared' })).toBeInTheDocument();
    expect(within(skills).getByText('User Research')).toBeInTheDocument();
    expect(screen.getByText('Team role: UX researcher')).toBeInTheDocument();
    expect(screen.getByText(/Ran 12 patient interviews/)).toBeInTheDocument();
    expect(screen.getByText(/agreed to share with companies/)).toBeInTheDocument();
  });
  it('missing evidence is stated, not hidden', async () => {
    mount('/company/talent/38');
    await screen.findByRole('heading', { level: 1, name: 'Mahmoud Saad' });
    expect(screen.getByText('No completed projects shared yet.')).toBeInTheDocument();
    expect(screen.getByText('No evaluations shared yet.')).toBeInTheDocument();
  });
  it('a candidate you may not see is a 404 "not available" (guide: 404, never 403)', async () => {
    mockHideCandidate(33);
    mount('/company/talent/33');
    expect(await screen.findByText('Candidate not available')).toBeInTheDocument();
  });
  it('loading state shows skeletons', async () => {
    const { container } = mount('/company/talent/32', { previewState: 'loading' });
    expect(container.querySelector('[aria-busy="true"]')).toBeTruthy();
    expect(screen.queryByText('Sara Nasser')).not.toBeInTheDocument();
  });
});

describe('Comparison', () => {
  it('needs at least two candidates', async () => {
    mount('/company/talent/compare?ids=31');
    expect(await screen.findByText('Pick candidates to compare')).toBeInTheDocument();
  });
  it('same field set and evidence period for everyone, human-review notice always shown', async () => {
    mount('/company/talent/compare?ids=31,32');
    expect(await screen.findByText(/Evidence period:/)).toBeInTheDocument();
    expect(screen.getByText('For human review only')).toBeInTheDocument();
    const table = screen.getByRole('table');
    const headers = within(table).getAllByRole('columnheader');
    expect(headers).toHaveLength(3);
    // Every skill row exists for both candidates; a missing one says "No evidence".
    const row = within(table).getByRole('rowheader', { name: 'User Research' }).closest('tr');
    expect(within(row).getAllByRole('cell')).toHaveLength(2);
    expect(within(row).getByText('No evidence')).toBeInTheDocument();
    const laravel = within(table).getByRole('rowheader', { name: 'Laravel' }).closest('tr');
    expect(within(laravel).getByText('4/5')).toBeInTheDocument();
  });
  it('a candidate who became hidden is removed and only counted (TC-24)', async () => {
    mount('/company/talent/compare?ids=31,32', { previewState: 'hidden' });
    expect(await screen.findByText('Candidates no longer available: 1')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('columnheader')).toHaveLength(3);
  });
  it('removing one of two leaves the "not enough" state', async () => {
    mount('/company/talent/compare?ids=31,32');
    await screen.findByRole('table');
    fireEvent.click(screen.getByRole('button', { name: 'Remove Rami Haddad from comparison' }));
    expect(await screen.findByText('Pick candidates to compare')).toBeInTheDocument();
  });
  it('error state', async () => {
    mount('/company/talent/compare?ids=31,32', { previewState: 'error' });
    expect(await screen.findByRole('button', { name: /Retry|Try again/i })).toBeInTheDocument();
  });
});
