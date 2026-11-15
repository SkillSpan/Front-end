import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const api = vi.hoisted(() => Object.fromEntries([
  'getProfile', 'getCareerRoles', 'getProjects', 'getRecommendations', 'getLatestReadiness',
  'getLatestIntelligence', 'getUnreadNotificationCount', 'getApplications', 'getNotifications',
  'getCareerRoleById', 'fetchProfileAvatarUrl', 'updateProfile', 'calculateIntelligence',
].map((name) => [name, vi.fn()])));
vi.mock('../../../api', () => ({ ...api, unwrapApiData: (p) => p?.data ?? p }));
vi.mock('../../auth/AuthContext', () => ({ useAuth: () => ({ authUser: { name: 'Learner' } }) }));
vi.mock('../../dashboard/AppLayout', () => ({ default: ({ children, roleLabel, onNavigate }) => <>
  <p data-testid="current-role-label">{roleLabel}</p>
  <button onClick={() => onNavigate('career-journey')}>Open Journey</button>
  <button onClick={() => onNavigate('projects')}>Open Projects</button>
  {children}
</> }));
vi.mock('../CareerRolesView', async () => {
  const { default: Control } = await import('../CareerGoalControl');
  return { default: ({ initialRoles, currentGoalId, onGoalSelect, onGoalCalculate, goalBusy }) => <>
    {initialRoles.map((role) => <div key={role.id} data-testid={`role-${role.id}`}>
      <h2>{role.title}</h2>
      <Control role={role} currentGoalId={currentGoalId} onSelect={onGoalSelect} onCalculate={onGoalCalculate} busy={goalBusy} />
    </div>)}
  </> };
});
vi.mock('../CareerJourneyView', () => ({ default: ({ readiness, intelligence }) => <>
  <p data-testid="journey-readiness">{readiness?.score ?? 'none'}</p>
  <p data-testid="journey-decision">{intelligence?.role_id ?? 'none'}</p>
</> }));
vi.mock('../ProjectsView', () => ({ default: ({ roleLabel }) => <p data-testid="project-goal">{roleLabel}</p> }));
vi.mock('../SupportFab', () => ({ default: () => null }));
vi.mock('../SupportWaitingToast', () => ({ default: () => null, SUPPORT_CREATED_EVENT: 'test-support-created' }));

import LearnerWorkspace from '../LearnerWorkspace';

const roles = [{ id: 2, title: 'Backend Developer' }, { id: 99, title: 'Data Analyst' }];
let goalId;

describe('career goal persistence and workspace refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    goalId = 2;
    api.getProfile.mockImplementation(async () => ({ data: { id: 8, primary_career_role_id: goalId } }));
    api.getCareerRoles.mockResolvedValue({ data: { data: roles } });
    api.getCareerRoleById.mockImplementation(async (id) => ({ data: roles.find((r) => r.id === id) }));
    for (const name of ['getProjects', 'getRecommendations', 'getApplications', 'getNotifications']) api[name].mockResolvedValue({ data: [] });
    api.getUnreadNotificationCount.mockResolvedValue({ data: { count: 0 } });
    api.getLatestReadiness.mockImplementation(async ({ careerRoleId }) => ({ data: { career_role_id: careerRoleId, score: careerRoleId === 2 ? 64 : 20 } }));
    api.getLatestIntelligence.mockImplementation(async ({ careerRoleId }) => ({ data: { role_id: careerRoleId } }));
    api.updateProfile.mockImplementation(async (payload) => {
      goalId = payload.primary_career_role_id;
      return { data: { id: 8, primary_career_role_id: goalId } };
    });
    api.calculateIntelligence.mockResolvedValue({ data: { role_id: 99 } });
  });

  it('saves the new primary goal, refreshes scoped decisions and updates Projects', async () => {
    render(<LearnerWorkspace initialView="career-roles" />);
    await waitFor(() => expect(screen.getByTestId('current-role-label')).toHaveTextContent('Backend Developer'));
    fireEvent.click(within(screen.getByTestId('role-99')).getByRole('button', { name: 'Set as Career Goal' }));
    await waitFor(() => expect(screen.getByTestId('current-role-label')).toHaveTextContent('Data Analyst'));
    await screen.findByText('Career goal saved. Your analysis is available in Career Journey.');
    expect(api.updateProfile).toHaveBeenCalledWith({ primary_career_role_id: 99 });
    expect(api.getLatestReadiness).toHaveBeenLastCalledWith({ careerRoleId: 99 });
    expect(api.getLatestIntelligence).toHaveBeenLastCalledWith({ careerRoleId: 99 });
    expect(api.calculateIntelligence).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Open Journey' }));
    expect(screen.getByTestId('journey-readiness')).toHaveTextContent('20');
    expect(screen.getByTestId('journey-decision')).toHaveTextContent('99');
    fireEvent.click(screen.getByRole('button', { name: 'Open Projects' }));
    expect(screen.getByTestId('project-goal')).toHaveTextContent('Data Analyst');
  });

  it('never labels an old role decision as the current goal', async () => {
    goalId = 99;
    api.getLatestReadiness.mockResolvedValue({ data: { career_role_id: 2, score: 64 } });
    api.getLatestIntelligence.mockResolvedValue({ data: { role_id: 2 } });
    render(<LearnerWorkspace />);
    await waitFor(() => expect(screen.getByTestId('current-role-label')).toHaveTextContent('Data Analyst'));
    expect(screen.getByTestId('journey-readiness')).toHaveTextContent('none');
    expect(screen.getByTestId('journey-decision')).toHaveTextContent('none');
  });

  it('preserves the current goal if selecting another role is rejected', async () => {
    api.updateProfile.mockRejectedValue({ message: 'The selected career role is not available.' });
    render(<LearnerWorkspace initialView="career-roles" />);
    await waitFor(() => expect(screen.getByTestId('current-role-label')).toHaveTextContent('Backend Developer'));
    fireEvent.click(within(screen.getByTestId('role-99')).getByRole('button', { name: 'Set as Career Goal' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('not available');
    expect(screen.getByTestId('current-role-label')).toHaveTextContent('Backend Developer');
  });

  it('does not fetch unscoped history when the profile has no career goal', async () => {
    goalId = null;
    render(<LearnerWorkspace />);
    await screen.findByRole('button', { name: 'Choose Career Goal' });
    await waitFor(() => expect(api.getCareerRoles).toHaveBeenCalled());
    expect(api.getLatestReadiness).not.toHaveBeenCalled();
    expect(api.getLatestIntelligence).not.toHaveBeenCalled();
    expect(screen.getByTestId('journey-readiness')).toHaveTextContent('none');
  });
});
