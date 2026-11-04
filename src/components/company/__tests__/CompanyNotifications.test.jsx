import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getOrganizationProfile: vi.fn(),
  getCompanyDashboard: vi.fn().mockResolvedValue({ data: { counts: { projects: 0, applicationsPending: 0, unreadNotifications: 0 }, permissions: { can_publish_projects: true, can_view_projects: true, can_review_applications: true, can_manage_profile: true }, tasks: [], projectStates: { draft: 0, submitted: 0, changes_requested: 0, approved: 0, open: 0, selection: 0, active: 0, under_review: 0, completed: 0, rejected: 0, cancelled: 0, archived: 0 }, recentProjects: [], funnel: { total: 0, stages: {}, byProject: [] } } }),
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
import CompanyNotifications from '../notifications/CompanyNotifications';
import CompanyDashboard from '../CompanyDashboard';
import { pageWindow } from '../notifications/pageWindow';
import { PREVIEW_READ_KEY, classifyCompanyError, normalizeNotificationPage } from '../dashboard/companyDashboardApi';
import { QUICK_LINKS, filterQuickLinks, resolveQuickLinkContext } from '../dashboard/quickLinks';
import { unreadStore } from '../dashboard/unreadStore';

function mount(ui, { path = '/company/notifications' } = {}) {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/pending" element={<div>PENDING SCREEN</div>} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

const REP = { name: 'Rana Saleh', organizations: [{ id: 3, name: 'Acme Labs', verification_status: 'verified' }] };
const raw = (id, read = false) => ({
  id, data: { type: 'application', project_title: `Project ${id}`, project_id: id }, read_at: read ? '2026-10-01T10:00:00Z' : null, created_at: '2026-10-30T09:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  unreadStore.reset();
  api.getOrganizationProfile.mockResolvedValue({ data: { id: 3, name: 'Acme Labs', verification_status: 'verified' } });
  api.getUnreadNotificationCount.mockResolvedValue({ data: { count: 2 } });
});
afterEach(() => window.localStorage.clear());

describe('Notification History — pagination (AC-11)', () => {
  it('pages through the history with numbers and prev/next', async () => {
    mount(<CompanyNotifications demo="full" />);
    expect(await screen.findByText('1–10 of 23')).toBeTruthy();
    expect(screen.getAllByRole('listitem').filter((li) => li.className.includes('cw-nh-item'))).toHaveLength(10);
    const pager = screen.getByRole('navigation', { name: 'Notification pages' });
    expect(within(pager).getByRole('button', { name: 'Page 1' }).getAttribute('aria-current')).toBe('page');
    expect(within(pager).getByRole('button', { name: /Previous/ }).disabled).toBe(true);

    fireEvent.click(within(pager).getByRole('button', { name: /Next/ }));
    expect(await screen.findByText('11–20 of 23')).toBeTruthy();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Notification pages' })).getByRole('button', { name: 'Page 3' }));
    expect(await screen.findByText('21–23 of 23')).toBeTruthy();
    expect(within(screen.getByRole('navigation', { name: 'Notification pages' })).getByRole('button', { name: /Next/ }).disabled).toBe(true);
  });

  it('honours a configurable page size and the Unread filter', async () => {
    mount(<CompanyNotifications demo="full" pageSize={5} />);
    expect(await screen.findByText('1–5 of 23')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Unread/ }));
    expect(await screen.findByText('1–3 of 3')).toBeTruthy();
    expect(screen.queryByRole('navigation', { name: 'Notification pages' })).toBeNull();
  });

  it('builds a compact page window', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(6, 12)).toEqual([1, 'gap-5', 5, 6, 7, 'gap-12', 12]);
    expect(pageWindow(3, 12)).toEqual([1, 2, 3, 4, 'gap-12', 12]);
  });

  it('sends page / per_page to the API and reads the Laravel paginator', async () => {
    api.getNotifications.mockResolvedValue({ data: [raw(1), raw(2, true)], meta: { current_page: 2, last_page: 4, per_page: 2, total: 8 } });
    mount(<CompanyNotifications user={REP} />, { path: '/company/notifications?page=2&perPage=2' });
    expect(await screen.findByText('3–4 of 8')).toBeTruthy();
    expect(api.getNotifications).toHaveBeenCalledWith({ page: 2, perPage: 2, unread: false });
    const page = normalizeNotificationPage({ data: [raw(9)], meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 } });
    expect(page.items[0]).toMatchObject({ id: 9, unread: true, project: 'Project 9', link: '/company/applicants?project=9' });
  });
});

describe('Mark as read (AC-10)', () => {
  it('rolls back and shows an inline error when the request fails', async () => {
    api.getNotifications.mockResolvedValue({ data: [raw(1), raw(2)], meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 } });
    api.patchNotificationRead.mockRejectedValue({ status: 500, message: 'boom' });
    mount(<CompanyNotifications user={REP} />);
    await screen.findByText('1–2 of 2');
    expect(unreadStore.get()).toBe(2);

    fireEvent.click(screen.getAllByRole('button', { name: /Mark as read/ })[0]);
    // Optimistic first …
    expect(unreadStore.get()).toBe(1);
    // … then rolled back with an inline error.
    expect(await screen.findByText('Couldn’t mark this as read. It’s still unread.')).toBeTruthy();
    expect(api.patchNotificationRead).toHaveBeenCalledWith(1);
    expect(unreadStore.get()).toBe(2);
    expect(screen.getAllByRole('button', { name: /Mark as read/ })).toHaveLength(2);
    expect(screen.getAllByText('Unread', { selector: '.cw-new' })).toHaveLength(2);
  });

  it('rolls back "mark all" when it fails', async () => {
    api.getNotifications.mockResolvedValue({ data: [raw(1), raw(2)], meta: { current_page: 1, last_page: 1, per_page: 10, total: 2 } });
    api.markAllNotificationsRead.mockRejectedValue({ status: 503 });
    mount(<CompanyNotifications user={REP} />);
    await screen.findByText('1–2 of 2');
    fireEvent.click(screen.getByRole('button', { name: /Mark all as read/ }));
    expect(await screen.findByText('Couldn’t mark all as read. Nothing was changed.')).toBeTruthy();
    expect(screen.getAllByText('Unread', { selector: '.cw-new' })).toHaveLength(2);
    expect(unreadStore.get()).toBe(2);
  });

  it('keeps the read state after a refresh in the preview', async () => {
    const first = mount(<CompanyNotifications demo="full" />);
    await screen.findByText('1–10 of 23');
    fireEvent.click(screen.getAllByRole('button', { name: /Mark as read/ })[0]);
    expect(JSON.parse(window.localStorage.getItem(PREVIEW_READ_KEY))).toEqual(['n1']);
    first.unmount();
    mount(<CompanyNotifications demo="full" />);
    await screen.findByText('1–10 of 23');
    expect(screen.getAllByRole('button', { name: /Mark as read/ })).toHaveLength(2);
    expect(unreadStore.get()).toBe(2);
  });
});

describe('Dashboard sections fail on their own (Scenario 6, BR-14)', () => {
  it('a failing notifications request leaves the other sections in place, and Retry recovers it', async () => {
    api.getNotifications.mockRejectedValueOnce({ status: 500, message: 'down' });
    mount(<CompanyDashboard user={REP} />, { path: '/company/dashboard' });
    expect(await screen.findByText('Welcome to SkillSpan, Rana')).toBeTruthy();
    const errorCard = await screen.findByRole('region', { name: 'Notifications' });
    expect(within(errorCard).getByText('This section couldn’t load.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Quick links' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Current tasks' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Application funnel' })).toBeTruthy();

    api.getNotifications.mockResolvedValueOnce({ data: [raw(7)], meta: { current_page: 1, last_page: 1, per_page: 5, total: 1 } });
    fireEvent.click(within(errorCard).getByRole('button', { name: /Try again/ }));
    expect(await screen.findByText('Project 7')).toBeTruthy();
    expect(screen.queryByText('This section couldn’t load.')).toBeNull();
  });

  it('preview: ?state=error&section=funnel fails only the funnel', () => {
    mount(<CompanyDashboard demo="full" previewState="error" />, { path: '/company/dashboard?state=error&section=funnel' });
    expect(screen.getAllByText('This section couldn’t load.')).toHaveLength(1);
    expect(screen.getByRole('region', { name: 'Application funnel' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Current tasks' })).toBeTruthy();
  });

  it('preview: ?state=loading shows a skeleton for each of the six sections', () => {
    const { container } = mount(<CompanyDashboard demo="full" previewState="loading" />, { path: '/company/dashboard?state=loading' });
    expect(container.querySelectorAll('.cw-sk-card')).toHaveLength(6);
  });
});

describe('401 / 403 (Scenario 5)', () => {
  it('classifies auth failures', () => {
    expect(classifyCompanyError({ status: 401 })).toBe('expired');
    expect(classifyCompanyError({ status: 403, code: 'ORGANIZATION_PENDING' })).toBe('pending');
    expect(classifyCompanyError({ status: 403 }, { verification_status: 'pending' })).toBe('pending');
    expect(classifyCompanyError({ status: 403 }, { verification_status: 'verified' })).toBe('denied');
    expect(classifyCompanyError({ status: 500 })).toBeNull();
  });

  it('401 ends the session through the app’s existing handler', async () => {
    api.getOrganizationProfile.mockRejectedValue({ status: 401, message: 'Unauthenticated.' });
    mount(<CompanyDashboard user={REP} />, { path: '/company/dashboard' });
    await waitFor(() => expect(api.expireSession).toHaveBeenCalled());
  });

  it('403 for a pending organization goes to /company/pending', async () => {
    api.getOrganizationProfile.mockRejectedValue({ status: 403, code: 'ORGANIZATION_PENDING' });
    mount(<CompanyDashboard user={REP} />, { path: '/company/dashboard' });
    expect(await screen.findByText('PENDING SCREEN')).toBeTruthy();
  });

  it('any other 403 shows access denied and no company data', async () => {
    api.getOrganizationProfile.mockRejectedValue({ status: 403 });
    mount(<CompanyDashboard user={REP} />, { path: '/company/dashboard' });
    expect(await screen.findByText('You don’t have access to this page')).toBeTruthy();
    expect(screen.queryByText('Acme Labs')).toBeNull();
  });
});

describe('Quick links follow permissions (AC-12, BR-07)', () => {
  const keys = (ctx) => filterQuickLinks(resolveQuickLinkContext(ctx)).map((l) => l.key);

  it('a pending or rejected organization sees none', () => {
    expect(keys({ organization: { verification_status: 'pending' } })).toEqual([]);
    expect(keys({ organization: { verification_status: 'rejected' } })).toEqual([]);
  });

  it('shows only what the permissions allow', () => {
    const organization = { verification_status: 'verified' };
    expect(keys({ organization, permissions: { can_view_projects: true, can_manage_profile: true } })).toEqual(['projects', 'profile']);
    expect(keys({ organization, permissions: { can_publish_projects: true, can_review_applications: false } })).toEqual(['create']);
  });

  it('"Continue drafts" appears only when there are draft projects', () => {
    const organization = { verification_status: 'verified' };
    expect(keys({ organization, projectStates: { draft: 0 } })).not.toContain('drafts');
    expect(keys({ organization, projectStates: { draft: 2 } })).toContain('drafts');
    expect(QUICK_LINKS.every((l) => Array.isArray(l.requires) && l.requires.includes('org_approved'))).toBe(true);
  });

  it('the card renders only the permitted links', () => {
    mount(<CompanyDashboard demo="empty" />, { path: '/company/dashboard' });
    const card = screen.getByRole('region', { name: 'Quick links' });
    expect(within(card).getByText('Create project')).toBeTruthy();
    expect(within(card).queryByText('Continue drafts')).toBeNull();
  });
});
