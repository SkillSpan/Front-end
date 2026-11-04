import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getOrganizationProfile: vi.fn(),
  getCompanyDashboard: vi.fn().mockResolvedValue({ data: { counts: { projects: 0, applicationsPending: 0, unreadNotifications: 0 }, permissions: { can_publish_projects: true, can_view_projects: true, can_review_applications: true, can_manage_profile: true }, tasks: [], projectStates: { draft: 0, submitted: 0, changes_requested: 0, approved: 0, open: 0, selection: 0, active: 0, under_review: 0, completed: 0, rejected: 0, cancelled: 0, archived: 0 }, recentProjects: [], funnel: { total: 0, stages: {}, byProject: [] } } }),
  getCompanyProfile: vi.fn(),
  updateCompanyProfile: vi.fn(),
  uploadCompanyProfileDocument: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  patchNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  expireSession: vi.fn(),
  unwrapApiData: (res) => res?.data?.data ?? res?.data ?? res,
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import CompanyDashboard from '../CompanyDashboard';
import CompanyNotifications from '../notifications/CompanyNotifications';
import CompanyProfile from '../CompanyProfile';
import { invalidateAfterMutation } from '../../../cache/queryCache';

const USER = { name: 'Rana Saleh', organizations: [{ id: 3, name: 'Acme Labs', verification_status: 'verified' }] };

function mount(ui, route = '/company/dashboard') {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </PreferencesProvider>,
  );
}

const notifPage = (unread) => ({
  data: [{ id: 'n1', type: 'application_received', title: 'New application', message: 'Omar applied', read_at: unread ? null : '2026-11-01T10:00:00Z', created_at: '2026-11-01T09:00:00Z' }],
  meta: { current_page: 1, per_page: 5, total: 1, last_page: 1 },
});

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('API cache on company screens', () => {
  it('dashboard → elsewhere → dashboard: the second visit renders without a skeleton', async () => {
    api.getOrganizationProfile.mockResolvedValue({ data: { id: 3, name: 'Acme Labs', verification_status: 'verified' } });
    api.getNotifications.mockResolvedValue(notifPage(true));
    api.getUnreadNotificationCount.mockResolvedValue({ data: { count: 1 } });

    const first = mount(<CompanyDashboard user={USER} />);
    expect(document.querySelectorAll('.cw-sk').length).toBeGreaterThan(0);
    expect(await screen.findByText('Welcome to SkillSpan, Rana')).toBeTruthy();
    await waitFor(() => expect(document.querySelectorAll('.cw-sk').length).toBe(0));
    first.unmount();

    mount(<CompanyDashboard user={USER} />);
    // straight from the cache: no skeleton on the very first render
    expect(document.querySelectorAll('.cw-sk').length).toBe(0);
    expect(screen.getByText('Welcome to SkillSpan, Rana')).toBeTruthy();
    expect(api.getOrganizationProfile).toHaveBeenCalledTimes(1);
  });

  it('a profile change clears the dashboard org answer, so the next visit loads it fresh', async () => {
    api.getOrganizationProfile.mockResolvedValueOnce({ data: { id: 3, name: 'Acme Labs', verification_status: 'verified' } })
      .mockResolvedValueOnce({ data: { id: 3, name: 'Acme Labs', verification_status: 'reverification_pending' } });
    api.getNotifications.mockResolvedValue(notifPage(false));
    api.getUnreadNotificationCount.mockResolvedValue({ data: { count: 0 } });

    const first = mount(<CompanyDashboard user={USER} />);
    await waitFor(() => expect(document.querySelectorAll('.cw-sk').length).toBe(0));
    first.unmount();

    act(() => { invalidateAfterMutation('PATCH', '/api/v1/profile/me'); });
    mount(<CompanyDashboard user={USER} />);
    await waitFor(() => expect(api.getOrganizationProfile).toHaveBeenCalledTimes(2));
  });

  it('notification read stays optimistic + rolls back on failure, and the cache keeps the result', async () => {
    api.getNotifications.mockResolvedValue({ ...notifPage(true), meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 } });
    api.getUnreadNotificationCount.mockResolvedValue({ data: { count: 1 } });
    api.patchNotificationRead.mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce({});

    const first = mount(<CompanyNotifications user={USER} />, '/company/notifications');
    const markBtn = await screen.findByRole('button', { name: /mark as read/i });
    fireEvent.click(markBtn);
    // rolled back with an inline error
    expect(await screen.findByText(/couldn.t mark/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /mark as read/i })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /mark as read/i }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /mark as read/i })).toBeNull());
    expect(api.patchNotificationRead).toHaveBeenCalledTimes(2);
    first.unmount();

    // Revisit: the read state is not lost, and no skeleton is shown first.
    api.getNotifications.mockResolvedValue({ ...notifPage(false), meta: { current_page: 1, per_page: 10, total: 1, last_page: 1 } });
    mount(<CompanyNotifications user={USER} />, '/company/notifications');
    expect(document.querySelectorAll('.is-skel').length).toBe(0);
    expect(screen.queryByRole('button', { name: /mark as read/i })).toBeNull();
  });

  it('profile view ⇄ edit: the second screen opens from the cache, without the skeleton', async () => {
    api.getCompanyProfile.mockResolvedValue({
      data: {
        organization_name: 'Acme Labs', organization_type: 'company', organization_industry: 'Software & IT Services',
        description: 'We build things.', country: 'Jordan', city: 'Amman', verification_status: 'verified', documents: [],
      },
    });
    const view = mount(<CompanyProfile user={USER} />, '/company/profile');
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy(); // first visit: skeleton
    expect(await screen.findByRole('heading', { name: 'Acme Labs' })).toBeTruthy();
    view.unmount();

    mount(<CompanyProfile user={USER} mode="edit" />, '/company/profile/edit');
    expect(document.querySelector('[aria-busy="true"]')).toBeNull();
    expect(screen.getByDisplayValue('Acme Labs')).toBeTruthy();
    expect(api.getCompanyProfile).toHaveBeenCalledTimes(1);
  });
});
