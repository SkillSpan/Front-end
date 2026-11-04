import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import './workspace/companyWorkspace.css';
import { useCompanyI18n } from './useCompanyI18n';
import { expireSession } from '../../api';
import OrgStatusCard from './dashboard/OrgStatusCard';
import QuickLinks from './dashboard/QuickLinks.jsx';
import TasksCard from './dashboard/TasksCard';
import NotificationsCard from './dashboard/NotificationsCard';
import ProjectsByState from './dashboard/ProjectsByState';
import ApplicationFunnel from './dashboard/ApplicationFunnel';
import { SectionError, SectionSkeleton } from './dashboard/SectionState';
import CompanyAccessDenied from './CompanyAccessDenied';
import {
  DASHBOARD_SECTIONS,
  classifyCompanyError,
  createDashboardSections,
  markAllNotificationsRead,
  markNotificationRead,
  sampleDashboard,
} from './dashboard/companyDashboardApi';
import { useDashboardSection } from './dashboard/useDashboardSection';
import { unreadStore } from './dashboard/unreadStore';

/**
 * Company Dashboard (Sprint 4, US-COMP-03) — six sections:
 * organization status, current tasks, projects by state, application
 * funnel, notifications, quick links.
 *
 * Every section loads on its own and has its own skeleton and its own error
 * card with Retry, so a failure in one never blanks the others (Scenario 6).
 *
 * `demo="full" | "empty"` renders the sample data (Nova Tech) for the
 * design preview; `previewState="loading" | "error" | "denied"` shows that
 * state (preview builds: /company/dashboard?state=loading …). Without `demo`
 * the dashboard loads the real organization (dashboard/companyDashboardApi.js).
 */

const TITLES = {
  org: 'company.ws.orgStatus',
  tasks: 'company.ws.tasks',
  projects: 'company.ws.byState',
  funnel: 'company.ws.funnel',
  notifications: 'company.ws.notifs',
  quickLinks: 'company.ws.quickLinks',
};
const SKELETONS = { org: 'org', tasks: 'tasks', projects: 'projects', funnel: 'funnel', notifications: 'list', quickLinks: 'links' };

function Section({ name, state, children }) {
  const { t } = useCompanyI18n();
  if (state.status === 'loading') return <SectionSkeleton variant={SKELETONS[name]} title={t(TITLES[name])} className={`cw-sec-${name}`} />;
  if (state.status === 'error') {
    return <SectionError title={t(TITLES[name])} variant={SKELETONS[name]} error={state.error} onRetry={state.retry} className={`cw-sec-${name}`} />;
  }
  return children(state.data);
}

const totalOf = (states) => Object.values(states || {}).reduce((a, b) => a + (b || 0), 0);

export default function CompanyDashboard({ user, onNavigate, demo, previewState, onData }) {
  const { t } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const previewSection = demo ? new URLSearchParams(location.search).get('section') : null;
  const loginOrg = user?.organizations?.[0];

  const specs = useMemo(
    () => createDashboardSections({ demo, previewState, previewSection, organization: loginOrg }),
    [demo, previewState, previewSection, loginOrg],
  );

  const sections = {
    org: useDashboardSection(specs.org),
    tasks: useDashboardSection(specs.tasks),
    projects: useDashboardSection(specs.projects),
    funnel: useDashboardSection(specs.funnel),
    notifications: useDashboardSection(specs.notifications),
    quickLinks: useDashboardSection(specs.quickLinks),
  };
  const { org, tasks, projects, funnel, notifications, quickLinks } = sections;
  const [notifError, setNotifError] = useState('');

  // 401 / 403 from any section (Scenario 5).
  const authFailure = DASHBOARD_SECTIONS
    .map((k) => sections[k])
    .filter((s) => s.status === 'error')
    .map((s) => classifyCompanyError(s.error, org.data || loginOrg))
    .find(Boolean) || (previewState === 'denied' ? 'denied' : null);

  useEffect(() => {
    if (authFailure === 'expired') expireSession();
    if (authFailure === 'pending' && !demo) navigate('/company/pending', { replace: true, state: { organization: org.data || loginOrg } });
  }, [authFailure, demo, navigate, org.data, loginOrg]);

  // Keep the bell + sidebar badge in step with this panel.
  const unreadCount = notifications.status === 'ready' ? notifications.data.unreadCount : null;
  useEffect(() => {
    if (unreadCount != null) unreadStore.set(unreadCount);
  }, [unreadCount]);

  // Sidebar badges (projects, applications); sample builds pass the sample
  // counts, live builds the server's counts from GET /api/v1/company/dashboard.
  const liveCounts = !demo && tasks.status === 'ready' ? tasks.data.counts : null;
  useEffect(() => {
    if (demo) onData?.(sampleDashboard(demo));
    else if (liveCounts) onData?.({ counts: liveCounts, canPublish: tasks.data.canPublish !== false });
  }, [demo, onData, liveCounts, tasks.data]);
  // Server unread total seeds the bell until the notifications panel answers.
  useEffect(() => {
    if (liveCounts?.unreadNotifications != null && unreadStore.get() == null) unreadStore.set(liveCounts.unreadNotifications);
  }, [liveCounts]);

  // permissions.can_publish_projects (US-COMP-03 dashboard payload) hides every
  // "Publish project" action when false. Until the summary answers, the
  // button stays hidden in live builds so it never flashes for a user who
  // cannot publish.
  const canPublish = demo ? true : (tasks.status === 'ready' ? tasks.data.canPublish !== false : false);

  const setRead = (ids, unread) => {
    notifications.update((d) => ({
      ...d,
      items: d.items.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, unread } : n)),
    }));
  };

  // Scenario 4: open the item and mark it read. Optimistic, rolled back on failure.
  const openNotification = async (n) => {
    if (n.link) onNavigate?.(n.link);
    if (!n.unread) return;
    setNotifError('');
    setRead([n.id], false);
    notifications.update((d) => ({ ...d, unreadCount: Math.max(0, d.unreadCount - 1) }));
    try {
      await markNotificationRead(n.id, { preview: demo });
    } catch (err) {
      if (classifyCompanyError(err)) return; // session / access handled globally
      setRead([n.id], true);
      notifications.update((d) => ({ ...d, unreadCount: d.unreadCount + 1 }));
      setNotifError(t('company.notif.markError'));
    }
  };

  const markAll = async () => {
    if (notifications.status !== 'ready') return;
    const before = notifications.data;
    setNotifError('');
    notifications.update((d) => ({ ...d, items: d.items.map((n) => ({ ...n, unread: false })), unreadCount: 0 }));
    try {
      await markAllNotificationsRead({ preview: demo });
    } catch (err) {
      if (classifyCompanyError(err)) return;
      notifications.update(() => before);
      setNotifError(t('company.notif.markAllError'));
    }
  };

  if (authFailure === 'denied') return <CompanyAccessDenied onNavigate={onNavigate} />;
  if (authFailure) {
    return (
      <div className="cw-dash" style={{ display: 'contents' }}>
        <SectionSkeleton variant="org" />
      </div>
    );
  }

  const orgData = org.data || {
    name: (demo ? sampleDashboard(demo).organization.name : loginOrg?.name) || '',
    profile: null,
    verification_status: loginOrg?.verification_status,
  };
  const isNew = projects.status === 'ready' && totalOf(projects.data.projectStates) === 0;
  const userName = demo ? 'Lina Haddad' : (user?.name || user?.full_name);
  const firstName = (userName || '').split(' ')[0] || orgData.name;
  const sample = Boolean(demo);

  return (
    <div className="cw-dash" style={{ display: 'contents' }}>
      <div className="cw-ph">
        <div>
          <h1>{isNew ? t('company.ws.welcomeNew', { name: firstName }) : t('company.ws.welcomeBack', { name: firstName })}</h1>
          <p>
            {orgData.name
              ? (isNew ? t('company.ws.welcomeNewSub', { org: orgData.name }) : t('company.ws.welcomeSub', { org: orgData.name }))
              : '\u00a0'}
          </p>
        </div>
        {!isNew && (
          <div className="cw-ph-actions">
            <button type="button" className="cw-btn sec" onClick={() => onNavigate?.('/company/projects')}>
              <FolderKanban size={16} strokeWidth={1.8} aria-hidden="true" /> {t('company.ws.myProjects')}
            </button>
            {canPublish && (
              <button type="button" className="cw-btn pri" onClick={() => onNavigate?.('/company/projects/new')}>
                <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {t('company.ws.publishProject')}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="cw-grid st2">
        <Section name="org" state={org}>
          {(o) => <OrgStatusCard organization={o} onNavigate={onNavigate} />}
        </Section>
        <Section name="quickLinks" state={quickLinks}>
          {(q) => <QuickLinks links={q.links} drafts={q.drafts} onNavigate={onNavigate} />}
        </Section>
      </div>

      <div className={`cw-grid${isNew ? ' st2' : ''}`}>
        <Section name="tasks" state={tasks}>
          {(d) => <TasksCard tasks={d.tasks} organization={orgData} isNew={d.isNew} onNavigate={onNavigate} canPublish={d.canPublish !== false} />}
        </Section>
        <Section name="notifications" state={notifications}>
          {(d) => (
            <NotificationsCard
              notifications={d.items}
              unreadCount={d.unreadCount}
              orgName={orgData.name}
              onNavigate={onNavigate}
              onOpen={openNotification}
              onMarkAllRead={markAll}
              error={notifError}
            />
          )}
        </Section>
      </div>

      <div className="cw-grid st2">
        <Section name="projects" state={projects}>
          {(d) => <ProjectsByState projectStates={d.projectStates} recentProjects={d.recentProjects} onNavigate={onNavigate} canPublish={d.canPublish !== false} />}
        </Section>
        <Section name="funnel" state={funnel}>
          {(f) => <ApplicationFunnel funnel={f} />}
        </Section>
      </div>

      {sample && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
    </div>
  );
}
