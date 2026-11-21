import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getOrganizationProfile: vi.fn().mockResolvedValue({ data: { id: 3, name: 'Acme Labs', verification_status: 'verified' } }),
  // US-COMP-03 guide §3: a brand-new company (all 12 states at zero).
  getCompanyDashboard: vi.fn().mockResolvedValue({ data: { counts: { projects: 0, applicationsPending: 0, unreadNotifications: 0 }, permissions: { can_publish_projects: true, can_view_projects: true, can_review_applications: true, can_manage_profile: true }, tasks: [], projectStates: { draft: 0, submitted: 0, changes_requested: 0, approved: 0, open: 0, selection: 0, active: 0, under_review: 0, completed: 0, rejected: 0, cancelled: 0, archived: 0 }, recentProjects: [], funnel: { total: 0, stages: {}, byProject: [] } } }),
  unwrapApiData: (res) => res?.data ?? null,
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import CompanyDashboard from '../CompanyDashboard';
import PendingApproval from '../PendingApproval';

function mount(ui) {
  return render(
    <PreferencesProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </PreferencesProvider>,
  );
}

afterEach(() => window.localStorage.clear());

describe('company dashboard (US-COMP-03)', () => {
  it('shows the six sections with the sample data', () => {
    mount(<CompanyDashboard demo="full" />);
    expect(screen.getByText('Organization status')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Current tasks' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Projects by state' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Application funnel' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Quick links' })).toBeTruthy();
    expect(screen.getByText('12 applications awaiting a decision')).toBeTruthy();
    // Status pills carry text, not colour only (BR-13).
    expect(screen.getAllByText('Changes requested').length).toBeGreaterThan(0);
  });

  it('guides a new company to its first project (empty state)', () => {
    mount(<CompanyDashboard demo="empty" />);
    expect(screen.getByText('Publish your first project')).toBeTruthy();
    expect(screen.getByText('No projects yet')).toBeTruthy();
    expect(screen.getByText('No applications yet')).toBeTruthy();
    expect(screen.getByText('Complete your organization profile')).toBeTruthy();
  });

  it('a real company never sees the sample numbers', async () => {
    mount(<CompanyDashboard user={{ name: 'Rana Saleh', organizations: [{ id: 3, name: 'Acme Labs' }] }} />);
    expect(await screen.findByText('Welcome to SkillSpan, Rana')).toBeTruthy();
    expect(screen.queryByText('Nova Tech')).toBeNull();
    expect(screen.queryByText(/Sample data/)).toBeNull();
  });

  it('renders in Arabic from the shared language preference', () => {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang: 'ar' }));
    mount(<CompanyDashboard demo="full" />);
    expect(screen.getByRole('heading', { name: 'المهام الحالية' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'روابط سريعة' })).toBeTruthy();
  });
});

describe('pending organization screen (Sprint 1, BR-01)', () => {
  it('explains the review and links back to sign in', () => {
    mount(<PendingApproval demo />);
    expect(screen.getByRole('heading', { name: 'Nova Tech is under review' })).toBeTruthy();
    expect(screen.getByText('lina@novatech.example')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Back to sign in/ })).toBeTruthy();
  });
});
