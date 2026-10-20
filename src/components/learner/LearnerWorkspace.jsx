import { useCallback, useEffect, useMemo, useState } from 'react';
import CareerJourneyView from './CareerJourneyView';
import CareerRolesView from './CareerRolesView';
import ProjectsView from './ProjectsView';
import ProjectDetailsView from './ProjectDetailsView';
import AssistantView from './AssistantView';
import MentorView from './MentorView';
import SupportView from './SupportView';
import ProfileView from './ProfileView';
import SettingsView from './SettingsView';
import SupportFab from './SupportFab';
import SupportWaitingToast, { SUPPORT_CREATED_EVENT } from './SupportWaitingToast';
import TalentDiscoveryView from './TalentDiscoveryView';
import { getApplications, getCareerRoles, getLatestReadiness, getLatestIntelligence, getNotifications, getProfile, getProjects, getRecommendations, getUnreadNotificationCount, getCareerRoleById, fetchProfileAvatarUrl, unwrapApiData } from '../../api';
import { useAuth } from '../auth/AuthContext';
import AppLayout from '../dashboard/AppLayout';
import './learner-workspace.css';

function collection(payload) {
  const raw = unwrapApiData(payload);
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

export default function LearnerWorkspace({ initialView='career-journey', onNavigate, onLogout }) {
  const { authUser } = useAuth();
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [roles, setRoles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [activeCareerRole, setActiveCareerRole] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [projectDetails, setProjectDetails] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  // `{ id, name }` while the "someone is waiting for you" banner is up.
  const [supportToast, setSupportToast] = useState(null);

  const loadWorkspace = async (aliveRef) => {
    const results = await Promise.allSettled([
      getProfile(), getCareerRoles({ page: 1, perPage: 15 }), getProjects(), getRecommendations({ page: 1, perPage: 15 }),
      getLatestReadiness(), getLatestIntelligence(), getUnreadNotificationCount(), getApplications({ page: 1, perPage: 20 }), getNotifications({ page: 1, perPage: 10 })
    ]);
    if (aliveRef && !aliveRef.current) return;
    const [pr, rr, pj, rec, rd, intel, un, , notifs] = results;
    if (pr.status === 'fulfilled') {
      const row = unwrapApiData(pr.value);
      setProfile(row);
      if (row?.has_avatar) {
        fetchProfileAvatarUrl().then((url) =>
          setAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          }),
        );
      }
    }
    if (rr.status === 'fulfilled') setRoles(collection(rr.value));
    if (pj.status === 'fulfilled') setProjects(collection(pj.value));
    if (rec.status === 'fulfilled') setRecommendations(collection(rec.value));
    if (rd.status === 'fulfilled') {
      const readinessData = unwrapApiData(rd.value);
      setReadiness(readinessData);
      const roleId = readinessData?.career_role_id ?? readinessData?.careerRoleId;
      if (roleId != null && roleId !== '') {
        try { setActiveCareerRole(unwrapApiData(await getCareerRoleById(roleId))); }
        catch { setActiveCareerRole(null); }
      }
    }
    if (intel.status === 'fulfilled') setIntelligence(unwrapApiData(intel.value));
    if (un.status === 'fulfilled') {
      const value = unwrapApiData(un.value); setUnread(Number(value?.count ?? value?.unread_count ?? value ?? 0) || 0);
    }
    // The bell popover used to be rendered empty because these rows were
    // fetched and then dropped: the count arrived, the list did not. A support
    // reply is delivered through exactly this list, so it has to be bound.
    if (notifs && notifs.status === 'fulfilled') setNotifications(collection(notifs.value));
    const rejected = results.filter(x => x.status === 'rejected');
    if (rejected.length) setApiError('Some workspace data could not be loaded from the server. Demo data will not be shown as a fallback.');
    return rejected.length;
  };

  useEffect(() => {
    const aliveRef = { current: true };
    (async () => {
      setLoading(true); setApiError('');
      try { await loadWorkspace(aliveRef); }
      finally { if (aliveRef.current) setLoading(false); }
    })();
    return () => { aliveRef.current = false; };
  }, []);

  const user = profile || authUser || {};
  const readinessScore = Number(readiness?.score ?? readiness?.readiness_score ?? 0) || 0;
  const rolePayload = activeCareerRole?.career_role ?? activeCareerRole?.role ?? activeCareerRole;
  const roleLabel = rolePayload?.title || readiness?.role_title || readiness?.roleTitle || '';
  const title = useMemo(() => user?.name || user?.full_name || 'Learner', [user]);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const go = (key) => {
    setProjectDetails(false);
    if (onNavigate) {
      return onNavigate(key);
    }
    if (key === 'roles') return setView('career-roles');
    setView(key);
  };

  const refreshNotifications = useCallback(async () => {
    try {
      const [countPayload, listPayload] = await Promise.all([
        getUnreadNotificationCount(),
        getNotifications({ page: 1, perPage: 10 }),
      ]);
      const value = unwrapApiData(countPayload);
      setUnread(Number(value?.count ?? value?.unread_count ?? value ?? 0) || 0);
      setNotifications(collection(listPayload));
    } catch {
      // A failed refresh leaves the previous list on screen — better than blanking it.
    }
  }, []);

  // A support reply lands while the learner is elsewhere in the app. Polling the
  // bell means it shows up without a reload; a minute is plenty for a badge and
  // two cheap requests.
  useEffect(() => {
    const timer = setInterval(() => { refreshNotifications(); }, 60000);
    return () => clearInterval(timer);
  }, [refreshNotifications]);

  // SupportView owns the composer, this shell owns the screen. The view
  // announces a created request and the banner is rendered here, so it keeps
  // sitting on top even if the learner navigates away from Support.
  useEffect(() => {
    const onCreated = (event) => {
      const detail = event?.detail || {};
      setSupportToast({ id: detail.id ?? Date.now(), name: detail.name || '' });
    };
    window.addEventListener(SUPPORT_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(SUPPORT_CREATED_EVENT, onCreated);
  }, []);

  const dismissSupportToast = useCallback(() => setSupportToast(null), []);

  // Revoke the avatar blob URL when the workspace unmounts.
  useEffect(() => {
    return () => {
      setAvatarUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  // A support reply arrives as an unread notification whose link is
  // `support/requests/<id>`. Unread is the whole signal: somebody wrote and is
  // now waiting for the learner to answer.
  const supportWaiting = useMemo(
    () =>
      notifications.some(
        (row) => !row.is_read && /^\/?support\/requests\/\d+/.test(String(row.link || '')),
      ),
    [notifications],
  );

  // `/readiness` and `/intelligence` carry no role title, so the header label
  // comes from the role payload the workspace already resolved.
  const journey = <CareerJourneyView readiness={readiness} intelligence={intelligence} roleTitle={roleLabel} />;

  const content = () => {
    if (view === 'dashboard' || view === 'career-journey' || view === 'evidence' || view === 'record') return journey;
    if (view === 'career-roles') return <CareerRolesView initialRoles={roles} />;
    if (view === 'projects') return projectDetails ? <ProjectDetailsView projectId={selectedProjectId} onBack={() => setProjectDetails(false)} /> : <ProjectsView roleLabel={roleLabel} initialProjects={projects} onOpenDetails={(id) => { setSelectedProjectId(id); setProjectDetails(true); }} />;
    if (view === 'assistant') return <AssistantView onNavigate={go} />;
    if (view === 'support') return <SupportView />;
    if (view === 'profile') return <ProfileView readinessScore={readinessScore} roleLabel={roleLabel} />;
    if (view === 'settings') return <SettingsView onLogout={() => onLogout?.()} />;
    if (view === 'mentor') return <div role="alert" className="m-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Mentor access is restricted to authorized Mentor accounts. Your learner workspace cannot access the student list. Sign in with an authorized Mentor account.</div>;
    if (view === 'talent') return <TalentDiscoveryView />;
    return journey;
  };

  return (
    <>
    <AppLayout
      active={view === 'career-roles' ? 'roles' : view}
      onNavigate={go}
      user={user}
      avatarUrl={avatarUrl}
      readinessScore={readinessScore}
      roleLabel={roleLabel}
      notificationCount={unread}
      notifications={notifications}
      supportWaiting={supportWaiting}
      onRefreshNotifications={refreshNotifications}
      onLogout={async () => { onLogout?.(); }}
      flushContent
      contentClassName={view === 'assistant' ? 'workspace-assistant-content' : 'workspace-content'}
    >
      {loading && <div className="learner-loading">Loading your workspace…</div>}
      {apiError && <div className="learner-api-note">{apiError}</div>}
      <div className="learner-content">{content()}</div>
    </AppLayout>
    {/* Straight to a human, from any screen — asking the assistant a question
        only to be handed off is a detour nobody should have to take. */}
    {view !== 'support' && (
      <SupportFab onClick={() => go('support')} waiting={supportWaiting} />
    )}
    <SupportWaitingToast
      toast={supportToast}
      onOpen={() => { setSupportToast(null); go('support'); }}
      onClose={dismissSupportToast}
    />
    </>
  );
}
