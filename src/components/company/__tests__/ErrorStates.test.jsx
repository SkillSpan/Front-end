// Error states of the Sprint 4 list/detail screens: a failed request shows the
// error card with Retry instead of a blank page (US-PRJ-02, US-MATCH-03/04, US-COMP-05..07).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { clearQueryCache } from '../../../cache/queryCache';
import ProjectsList from '../projects/ProjectsList';
import ApplicationsPage from '../applications/ApplicationsPage';
import ApplicationDetail from '../applications/ApplicationDetail';
import TeamFormation from '../team/TeamFormation';
import TalentSearch from '../talent/TalentSearch';
import CandidateSummary from '../talent/CandidateSummary';
import TalentCompare from '../talent/TalentCompare';
import TalentLists from '../talent/TalentLists';
import { resetMockBackend } from '../projects/mockBackend';
import { resetTalentMock } from '../talent/talentApi';

function mount(path, route, el) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes><Route path={route} element={el} /></Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}
const retry = () => screen.findByRole('button', { name: /Retry|Try again/i });

beforeEach(() => { resetMockBackend(); resetTalentMock(); clearQueryCache(); window.localStorage.clear(); api.companyRequest.mockReset(); });

describe('Preview error state renders the error card (no blank page)', () => {
  const cases = [
    ['My Projects', '/company/projects', '/company/projects', <ProjectsList demo="full" previewState="error" />],
    ['Applications', '/company/applicants?project=p1', '/company/applicants', <ApplicationsPage demo="full" previewState="error" />],
    ['Application detail', '/company/applicants/a107', '/company/applicants/:id', <ApplicationDetail demo="full" previewState="error" />],
    ['Team formation', '/company/projects/p1/team', '/company/projects/:id/team', <TeamFormation demo="full" previewState="error" />],
    ['Talent search', '/company/talent', '/company/talent', <TalentSearch demo="full" previewState="error" />],
    ['Candidate summary', '/company/talent/32', '/company/talent/:id', <CandidateSummary demo="full" previewState="error" />],
    ['Compare', '/company/talent/compare?ids=31,32', '/company/talent/compare', <TalentCompare demo="full" previewState="error" />],
    ['Saved lists', '/company/talent/lists', '/company/talent/lists', <TalentLists demo="full" previewState="error" />],
  ];
  it.each(cases)('%s', async (_name, path, route, el) => {
    mount(path, route, el);
    expect(await retry()).toBeInTheDocument();
  });
});

describe('A real failed request (live mode)', () => {
  it('My Projects: 500 → error card with Retry, Retry refetches', async () => {
    api.companyRequest.mockRejectedValue({ status: 500, code: 'SERVER_ERROR', message: 'Server error' });
    mount('/company/projects', '/company/projects', <ProjectsList />);
    const btn = await retry();
    const before = api.companyRequest.mock.calls.length;
    fireEvent.click(btn);
    await waitFor(() => expect(api.companyRequest.mock.calls.length).toBeGreaterThan(before));
  });
  it('Talent search: 500 on GET /api/v1/talent → error card', async () => {
    api.companyRequest.mockRejectedValue({ status: 500, code: 'SERVER_ERROR', message: 'Server error' });
    mount('/company/talent', '/company/talent', <TalentSearch />);
    expect(await retry()).toBeInTheDocument();
    expect(api.companyRequest.mock.calls.some(([p]) => p.startsWith('/api/v1/talent?'))).toBe(true);
  });
});
