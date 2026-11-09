import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  getCareerRoles: vi.fn(), getSavedCareerRoles: vi.fn(), setCareerRoleSaved: vi.fn(),
}));
vi.mock('../../../api', () => ({
  ...api,
  getCareerRoleSkills: vi.fn().mockResolvedValue({ data: { skills: [] } }),
  getSkillsMatrix: vi.fn().mockResolvedValue({ data: [] }),
  unwrapApiData: (p) => p?.data ?? p,
}));
import CareerRolesView from '../CareerRolesView';

const role = { id: 99, title: 'Data Analyst' };
const initialRoles = [{ id: 1, title: 'First page role' }];
async function openSearchResult() {
  fireEvent.change(screen.getByPlaceholderText('Search career roles...'), { target: { value: 'Data Analyst' } });
  await screen.findByText('Data Analyst');
  fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save Role' })).toBeEnabled());
}

describe('persistent career-role bookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getCareerRoles.mockResolvedValue({ data: { data: [role], total: 1 } });
    api.getSavedCareerRoles.mockResolvedValue({ data: [] });
    api.setCareerRoleSaved.mockResolvedValue({ data: { career_role_id: 99, is_saved: true } });
  });

  it('saves a search-only role, shows it in Saved Roles and removes it', async () => {
    render(<CareerRolesView initialRoles={initialRoles} searchDebounceMs={0} />);
    await openSearchResult();
    fireEvent.click(screen.getByRole('button', { name: 'Save Role' }));
    await screen.findByRole('button', { name: 'Saved' });
    expect(api.setCareerRoleSaved).toHaveBeenCalledWith(99, true);
    fireEvent.click(screen.getByText('Back to Roles'));
    fireEvent.click(screen.getByRole('button', { name: /Saved Roles/ }));
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument());
    expect(api.setCareerRoleSaved).toHaveBeenLastCalledWith(99, false);
  });

  it('reloads bookmarks outside the initial catalogue page', async () => {
    api.getSavedCareerRoles.mockResolvedValue({ data: [role] });
    const first = render(<CareerRolesView initialRoles={initialRoles} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved Roles/ })).toHaveTextContent('1'));
    first.unmount();
    render(<CareerRolesView initialRoles={initialRoles} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved Roles/ })).toHaveTextContent('1'));
    fireEvent.click(screen.getByRole('button', { name: /Saved Roles/ }));
    fireEvent.click(screen.getByRole('button', { name: 'View Details' }));
    await screen.findByTestId('requirements-unavailable');
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument();
  });

  it('reports a failed save without claiming success', async () => {
    api.setCareerRoleSaved.mockRejectedValue(new Error('offline'));
    render(<CareerRolesView initialRoles={initialRoles} searchDebounceMs={0} />);
    await openSearchResult();
    fireEvent.click(screen.getByRole('button', { name: 'Save Role' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be updated');
    expect(screen.getByRole('button', { name: 'Save Role' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Saved' })).not.toBeInTheDocument();
  });

  it('prevents duplicate requests while saving', async () => {
    let finish;
    api.setCareerRoleSaved.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    render(<CareerRolesView initialRoles={initialRoles} searchDebounceMs={0} />);
    await openSearchResult();
    const button = screen.getByRole('button', { name: 'Save Role' });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(api.setCareerRoleSaved).toHaveBeenCalledTimes(1);
    finish({ data: { is_saved: true } });
    await screen.findByRole('button', { name: 'Saved' });
  });

  it('allows retrying a failed initial load', async () => {
    api.getSavedCareerRoles.mockRejectedValueOnce(new Error('offline'));
    render(<CareerRolesView initialRoles={initialRoles} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry saved roles' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(api.getSavedCareerRoles).toHaveBeenCalledTimes(2);
  });

  it('keeps a bookmark when removal fails', async () => {
    api.getSavedCareerRoles.mockResolvedValue({ data: [role] });
    api.setCareerRoleSaved.mockRejectedValue(new Error('offline'));
    render(<CareerRolesView initialRoles={initialRoles} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Saved Roles/ })).toHaveTextContent('1'));
    fireEvent.click(screen.getByRole('button', { name: /Saved Roles/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be updated');
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeEnabled();
  });
});
