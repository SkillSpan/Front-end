// US-MATCH-04 — Team Formation & Project Start.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import TeamFormation from '../team/TeamFormation';
import TeamInvitationPage from '../team/TeamInvitationPage';
import { applyTeamPreview } from '../team/teamPreview';
import { assignToRoles, respondToInvitation, sendInvitations, startProject } from '../team/teamFormationApi';
import {
  resetMockBackend, mockAddConflict, mockAssign, mockGetProject, mockGetTeam, mockRespondInvitation, mockStartProject,
} from '../projects/mockBackend';

function mount(path, { lang, previewState } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/projects/:id/team" element={<TeamFormation demo="full" previewState={previewState} />} />
          <Route path="/team-invitations/:id" element={<TeamInvitationPage demo />} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetMockBackend(); clearQueryCache(); window.localStorage.clear(); api.companyRequest.mockReset(); });

describe('Team rules (preview backend mirrors the server)', () => {
  it('only accepted applicants can be assigned (BR-02)', () => {
    expect(() => mockAssign('p1', { members: [{ application_id: 'a107', project_role_id: 'r1' }] })).toThrow();
  });
  it('a critical-skill gap blocks the assignment until an exception is recorded (BR-06, AC-04)', () => {
    let err;
    try { mockAssign('p1', { members: [{ application_id: 'a103', project_role_id: 'r3' }] }); } catch (e) { err = e; }
    expect(err.code).toBe('CRITICAL_SKILL_NOT_MET');
    mockAssign('p1', { members: [{ application_id: 'a103', project_role_id: 'r3', exception: { support: 'Pairing', risk: 'Delay' } }] });
    expect(mockGetTeam('p1').data.participants.find((p) => p.application_id === 'a103').assignment.role_id).toBe('r3');
  });
  it('a conflicting active assignment is blocked (BR-07, AC-05)', () => {
    mockAddConflict('p1', 'a103', { project_title: 'Inventory API' });
    let err;
    try { mockAssign('p1', { members: [{ application_id: 'a103', project_role_id: 'r3', exception: { support: 'x', risk: 'y' } }] }); } catch (e) { err = e; }
    expect(err.code).toBe('CONFLICTING_ASSIGNMENT');
  });
  it('a declined invitation releases the place (BR-05, BR-09, AC-08)', () => {
    mockRespondInvitation('inv2', { response: 'declined' });
    const r2 = mockGetTeam('p1').data.roles.find((r) => r.id === 'r2');
    expect(r2.assigned).toBe(0);
    expect(r2.remaining).toBe(2);
  });
  it('start is blocked while required roles are unfilled, and nothing changes (BR-10, BR-13, AC-09, AC-11)', () => {
    let err;
    try { mockStartProject('p1'); } catch (e) { err = e; }
    expect(err.code).toBe('TEAM_COMPOSITION_INSUFFICIENT');
    expect(err.details.unfilled_roles.map((u) => u.id)).toEqual(['r2', 'r3']);
    expect(mockGetProject('p1').data.status).toBe('selection');
    expect(mockGetTeam('p1').data.workspace).toBeFalsy();
  });
  it('a valid team starts the project: team + workspace + Active (AC-10)', () => {
    applyTeamPreview('p1', 'ready');
    mockStartProject('p1');
    expect(mockGetProject('p1').data.status).toBe('active');
    expect(mockGetTeam('p1').data.workspace).toBeTruthy();
  });
});

describe('Live API calls (sprint-document endpoints + ASSUMED ones, TODO until confirmed)', () => {
  it('assign, invite, respond, start', async () => {
    api.companyRequest.mockResolvedValue({ data: { roles: [], participants: [], composition: { valid: false } } });
    await assignToRoles(7, [{ applicationId: 3, roleId: 1, exception: { support: 's', risk: 'r' } }]);
    expect(api.companyRequest.mock.calls[0][0]).toBe('/api/v1/projects/7/team/assignments');
    // The API calls the array `members` and identifies the role by id.
    expect(api.companyRequest.mock.calls[0][1].body).toEqual({ members: [{ application_id: 3, project_role_id: 1, exception: { support: 's', risk: 'r' } }] });
    await sendInvitations(7, { idempotencyKey: 'i1' });
    expect(api.companyRequest.mock.calls[1][0]).toBe('/api/v1/projects/7/team/invitations');
    await respondToInvitation(5, 'declined');
    expect(api.companyRequest.mock.calls.at(-1)[0]).toBe('/api/v1/team-invitations/5/response');
    expect(api.companyRequest.mock.calls.at(-1)[1].body).toEqual({ response: 'declined' });
    await startProject(7, { idempotencyKey: 's1' });
    const start = api.companyRequest.mock.calls.find(([p]) => p === '/api/v1/projects/7/start');
    expect(start[1]).toMatchObject({ method: 'POST', headers: { 'Idempotency-Key': 's1' } });
  });
});

describe('Team Formation screen', () => {
  it('shows roles with remaining capacity and the accepted participants (AC-01)', async () => {
    mount('/company/projects/p1/team');
    expect(await screen.findByRole('heading', { name: 'UX Researcher' })).toBeTruthy();
    expect(screen.getByText('Sara Nasser')).toBeTruthy();
    expect(screen.getByText('Yousef Darwish')).toBeTruthy();
    expect(screen.getByText('The project can’t start yet')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Start project/ })).toBeDisabled();
  });

  it('assigning below a critical skill opens the exception dialog; support and risk are required (Scenario 4)', async () => {
    mount('/company/projects/p1/team');
    fireEvent.click(await screen.findByRole('button', { name: /^Assign$/ }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Assign with exception' }));
    expect(within(dlg).getAllByText('This is required.')).toHaveLength(2);
    fireEvent.change(within(dlg).getByLabelText(/Support plan/), { target: { value: 'Pairing weekly' } });
    fireEvent.change(within(dlg).getByLabelText(/Risk/), { target: { value: 'One week delay' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Assign with exception' }));
    expect(await screen.findByText(/Yousef Darwish assigned to Front-end Developer/)).toBeTruthy();
    expect(screen.getByText('Exception approved')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Send invitations \(1\)/ })).toBeTruthy();
  });

  it('a conflicting participant cannot be assigned (AC-05)', async () => {
    mount('/company/projects/p1/team', { previewState: 'conflict' });
    expect(await screen.findByText(/Already on an active team \(Inventory API\)/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Assign$/ })).toBeDisabled();
  });

  it('after a decline the waitlisted applicant can be promoted (AC-08)', async () => {
    mount('/company/projects/p1/team', { previewState: 'declined' });
    expect(await screen.findByText('Declined invitations')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Promote' }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Promote' }));
    expect(await screen.findByText(/Huda Mansour was promoted/)).toBeTruthy();
    await waitFor(() => expect(mockGetTeam('p1').data.waitlist).toHaveLength(0));
  });

  it('a ready team starts the project after confirmation (Scenario 5)', async () => {
    mount('/company/projects/p1/team', { previewState: 'ready' });
    const btn = await screen.findByRole('button', { name: /Start project/ });
    await waitFor(() => expect(btn).not.toBeDisabled());
    fireEvent.click(btn);
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: /Start project/ }));
    expect(await screen.findByText('The project has started')).toBeTruthy();
    expect(mockGetProject('p1').data.status).toBe('active');
  });

  it('renders in Arabic', async () => {
    mount('/company/projects/p1/team', { lang: 'ar' });
    expect((await screen.findAllByRole('heading', { name: 'تكوين الفريق' })).length).toBeGreaterThan(0);
  });
});

describe('Learner invitation (AC-07)', () => {
  it('accepts', async () => {
    mount('/team-invitations/inv2');
    fireEvent.click(await screen.findByRole('button', { name: /Accept and join/ }));
    expect(await screen.findByText(/You joined/)).toBeTruthy();
    expect(mockGetTeam('p1').data.roles.find((r) => r.id === 'r2').confirmed).toBe(1);
  });
  it('declines after confirming', async () => {
    mount('/team-invitations/inv2');
    fireEvent.click(await screen.findByRole('button', { name: /^Decline$/ }));
    const dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Decline' }));
    expect(await screen.findByText('You declined this invitation')).toBeTruthy();
  });
  it('unknown invitation → not found', async () => {
    mount('/team-invitations/nope');
    expect(await screen.findByText('Invitation not found')).toBeTruthy();
  });
});
