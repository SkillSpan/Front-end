import { describe, it, expect, vi, beforeEach } from 'vitest';

// Responses copied from the backend's US-COMP-03 frontend guide (02-11-2026).
vi.mock('../../../api', () => ({
  getCompanyDashboard: vi.fn(),
  getOrganizationProfile: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  patchNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  unwrapApiData: (payload) => payload?.data?.data ?? payload?.data ?? payload,
}));

import * as api from '../../../api';
import {
  canPublishProjects,
  classifyCompanyError,
  fetchDashboardSummary,
  fetchUnreadCount,
  listNotifications,
  markNotificationRead,
  quickLinksFor,
} from '../dashboard/companyDashboardApi';
import { safeRedirect } from '../../../utils/safeRedirect';
import { clearQueryCache } from '../../../cache/queryCache';

const GUIDE_DASHBOARD = {
  success: true,
  message: 'Company dashboard retrieved successfully.',
  data: {
    counts: { projects: 12, applicationsPending: 5, unreadNotifications: 3 },
    permissions: { can_publish_projects: false, can_view_projects: true, can_review_applications: true, can_manage_profile: true },
    tasks: [
      { id: 'review', type: 'review', tone: 'blue', count: 5, projects: [{ name: 'مشروع التخرج', count: 3 }] },
      { id: 'revise-7', type: 'revise', tone: 'amber', project: 'تطبيق موبايل', project_id: 7 },
      { id: 'deadline-9', type: 'deadline', tone: 'red', days: 3, project: 'لوحة تحكم', project_id: 9, date: '2026-11-05', applications: 4 },
      { id: 'roles-11', type: 'roles', tone: 'violet', open: 2, filled: 3, total: 5, project: 'API للدفع', project_id: 11 },
      { id: 'draft-14', type: 'draft', tone: 'gray', count: 1, project: 'مسودة', project_id: 14, date: '2026-10-30' },
    ],
    projectStates: { draft: 1, submitted: 1, changes_requested: 1, approved: 0, open: 2, selection: 1, active: 2, under_review: 0, completed: 3, rejected: 0, cancelled: 0, archived: 1 },
    recentProjects: [{ id: 1, name: 'مشروع التخرج', kind: 'real', track: 'UX/UI', state: 'selection', deadline: { date: '2026-10-25', closed: true }, filled: 3, capacity: 5 }],
    funnel: { total: 35, stages: { submitted: 12, shortlisted: 5, waitlisted: 2, accepted: 6, rejected: 7, withdrawn: 2, expired: 1 }, byProject: [{ name: 'مشروع التخرج', count: 18 }] },
  },
};

const GUIDE_NOTIFICATIONS = {
  data: [{ id: 12, category: 'project', title: 'Project approved', body: 'Your project is live.', link: '/company/projects/7', read_at: null, created_at: '2026-11-01T09:30:00Z' }],
  meta: { current_page: 1, per_page: 10, total: 34, last_page: 4, unread_count: 12 },
};

beforeEach(() => {
  vi.clearAllMocks();
  clearQueryCache();
});

describe('GET /api/v1/company/dashboard → dashboard sections (US-COMP-03)', () => {
  it('maps every field exactly as the server sends it, adding nothing up', async () => {
    api.getCompanyDashboard.mockResolvedValue(GUIDE_DASHBOARD);
    const s = await fetchDashboardSummary();
    expect(s.counts).toEqual(GUIDE_DASHBOARD.data.counts);
    expect(s.tasks).toEqual(GUIDE_DASHBOARD.data.tasks);
    expect(s.projectStates).toEqual(GUIDE_DASHBOARD.data.projectStates);
    expect(s.recentProjects).toEqual(GUIDE_DASHBOARD.data.recentProjects);
    expect(s.funnel).toEqual(GUIDE_DASHBOARD.data.funnel);
    expect(s.permissions).toEqual(GUIDE_DASHBOARD.data.permissions);
    expect(s.notifications).toEqual([]);
  });

  it('permissions gate the publish actions and the Quick Links', async () => {
    api.getCompanyDashboard.mockResolvedValue(GUIDE_DASHBOARD);
    const s = await fetchDashboardSummary();
    expect(canPublishProjects(s.permissions)).toBe(false);
    const { links } = quickLinksFor({ verification_status: 'verified' }, s.permissions, s.projectStates);
    const keys = links.map((l) => l.key);
    expect(keys).not.toContain('create');
    expect(keys).not.toContain('drafts');
    expect(keys).toContain('projects');
    expect(canPublishProjects(undefined)).toBe(true); // no permissions object → representative defaults
  });

  it('a missing / partial body falls back to empty sections', async () => {
    api.getCompanyDashboard.mockResolvedValue({ success: true, data: {} });
    const s = await fetchDashboardSummary();
    expect(s.tasks).toEqual([]);
    expect(s.funnel).toEqual({ total: 0, stages: {}, byProject: [] });
    expect(s.permissions).toBeUndefined();
  });
});

describe('notifications (US-COMP-03 guide §6)', () => {
  it('asks with page, per_page (max 50) and unread=1, and reads meta.unread_count', async () => {
    api.getNotifications.mockResolvedValue(GUIDE_NOTIFICATIONS);
    const page = await listNotifications({ page: 1, perPage: 80, unread: true });
    expect(api.getNotifications).toHaveBeenCalledWith({ page: 1, perPage: 50, unread: true });
    expect(page).toMatchObject({ page: 1, perPage: 10, total: 34, lastPage: 4, unreadCount: 12 });
    expect(page.items[0]).toMatchObject({
      id: 12, category: 'project', title: 'Project approved', body: 'Your project is live.',
      link: '/company/projects/7', unread: true, createdAt: '2026-11-01T09:30:00Z', date: '2026-11-01',
    });
  });

  it('marks one read with PATCH and reads data.unread_count', async () => {
    api.patchNotificationRead.mockResolvedValue({ success: true });
    await markNotificationRead(12);
    expect(api.patchNotificationRead).toHaveBeenCalledWith(12);
    api.getUnreadNotificationCount.mockResolvedValue({ data: { unread_count: 7 } });
    expect(await fetchUnreadCount()).toBe(7);
  });
});

describe('403 codes (guide §4) — branch on code, not message', () => {
  it.each([
    ['ORGANIZATION_PENDING', 'pending'],
    ['ORGANIZATION_NOT_APPROVED', 'denied'],
    ['COMPANY_ADMIN_ONLY', 'denied'],
    ['NOT_ORGANIZATION_ADMIN', 'denied'],
    ['NO_ORGANIZATION', 'denied'],
  ])('%s → %s', (code, expected) => {
    expect(classifyCompanyError({ status: 403, code, message: 'anything' }, { verification_status: 'verified' })).toBe(expected);
  });
  it('401 → expired', () => expect(classifyCompanyError({ status: 401 })).toBe('expired'));
});

describe('login redirect_url (guide §7)', () => {
  it('follows in-app paths only', () => {
    expect(safeRedirect('/company/dashboard', '/x')).toBe('/company/dashboard');
    expect(safeRedirect('//evil.example', '/company/dashboard')).toBe('/company/dashboard');
    expect(safeRedirect('https://evil.example/company', '/company/dashboard')).toBe('/company/dashboard');
    expect(safeRedirect(undefined, '/company/dashboard')).toBe('/company/dashboard');
  });
});
