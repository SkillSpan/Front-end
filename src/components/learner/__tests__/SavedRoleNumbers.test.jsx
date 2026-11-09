import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ getCareerRoleSkills: vi.fn(), getSkillsMatrix: vi.fn() }));
vi.mock('../../../api', () => ({
  ...api,
  getCareerRoles: vi.fn(),
  getSavedCareerRoles: vi.fn().mockResolvedValue({ data: [{ id: 99, title: 'Data Analyst' }] }),
  setCareerRoleSaved: vi.fn(),
  unwrapApiData: (p) => p?.data ?? p,
}));
import CareerRolesView from '../CareerRolesView';

describe('saved role numbers loaded outside the catalogue page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCareerRoleSkills.mockResolvedValue({ data: { skills: [
      { skill_id: 10, skill_name: 'SQL', required_level: 2, importance_weight: 0.4, is_critical: true },
      { skill_id: 11, skill_name: 'Python', required_level: 3, importance_weight: 0.6, is_critical: false },
    ] } });
    api.getSkillsMatrix.mockResolvedValue({ data: [
      { skill_id: 10, skill: { id: 10 }, level: '1.00' },
      { skill_id: 11, skill: { id: 11 }, level: '3.00' },
    ] });
  });

  async function openSaved() {
    render(<CareerRolesView initialRoles={[{ id: 1, title: 'First page role' }]} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved Roles/ })).toHaveTextContent('1'));
    fireEvent.click(screen.getByRole('button', { name: /Saved Roles/ }));
    await screen.findByRole('heading', { name: 'Data Analyst' });
  }

  it('loads the saved role requirements and learner levels after remount', async () => {
    await openSaved();
    await waitFor(() => expect(screen.getByTestId('saved-role-readiness')).toHaveTextContent('80%'));
    expect(screen.getByTestId('saved-role-skills-met')).toHaveTextContent('1/2');
    expect(api.getCareerRoleSkills).toHaveBeenCalledWith(99);
  });

  it('shows unavailable values instead of a blank percent or fake zero counts', async () => {
    api.getCareerRoleSkills.mockImplementation((id) => id === 99
      ? Promise.reject(new Error('unavailable')) : Promise.resolve({ data: { skills: [] } }));
    await openSaved();
    await waitFor(() => expect(api.getCareerRoleSkills).toHaveBeenCalledWith(99));
    expect(screen.getByTestId('saved-role-readiness')).toHaveTextContent('—');
    expect(screen.getByTestId('saved-role-skills-met')).toHaveTextContent('—');
  });
});
