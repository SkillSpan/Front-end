import { useEffect, useMemo, useState } from 'react';
import CareerJourneyView from './CareerJourneyView';
import CareerRolesView from './CareerRolesView';
import ProjectsView from './ProjectsView';
import ProjectDetailsView from './ProjectDetailsView';
import AssistantView from './AssistantView';
import MentorView from './MentorView';
import TalentDiscoveryView from './TalentDiscoveryView';
import { getApplications, getCareerRoles, getLatestReadiness, getLatestIntelligence, getNotifications, getProfile, getProjects, getRecommendations, getUnreadNotificationCount, getCareerRoleById, unwrapApiData } from '../../api';
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
  const [unread, setUnread] = useState(0);
  const [projectDetails, setProjectDetails] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setApiError('');
      const results = await Promise.allSettled([
        getProfile(), getCareerRoles({ page: 1, perPage: 15 }), getProjects(), getRecommendations({ page: 1, perPage: 15 }),
        getLatestReadiness(), getLatestIntelligence(), getUnreadNotificationCount(), getApplications({ page: 1, perPage: 20 }), getNotifications({ page: 1, perPage: 10 })
      ]);
      if (!alive) return;
      const [pr, rr, pj, rec, rd, intel, un] = results;
      if (pr.status === 'fulfilled') setProfile(unwrapApiData(pr.value));
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
      const rejected = results.filter(x => x.status === 'rejected');
      if (rejected.length) setApiError('Some workspace data could not be loaded from the server. Demo data will not be shown as a fallback.');
      setLoading(false);
    })();
    return () => { alive = false; };
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

  const content = () => {
    if (view === 'dashboard') return <CareerJourneyView readiness={readiness} intelligence={intelligence} />;
    if (view === 'career-journey') return <CareerJourneyView readiness={readiness} intelligence={intelligence} />;
    if (view === 'career-roles') return <CareerRolesView initialRoles={roles} />;
    if (view === 'projects') return projectDetails ? <ProjectDetailsView projectId={selectedProjectId} onBack={() => setProjectDetails(false)} /> : <ProjectsView roleLabel={roleLabel} initialProjects={projects} onOpenDetails={(id) => { setSelectedProjectId(id); setProjectDetails(true); }} />;
    if (view === 'assistant') return <AssistantView />;
    if (view === 'mentor') return <div role="alert" className="m-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Mentor access is restricted to authorized Mentor accounts. Your learner workspace cannot access the student list. Sign in with an authorized Mentor account.</div>;
    if (view === 'talent') return <TalentDiscoveryView />;
    if (view === 'evidence') return <CareerJourneyView readiness={readiness} intelligence={intelligence} />;
    if (view === 'record') return <CareerJourneyView readiness={readiness} intelligence={intelligence} />;
    return <CareerJourneyView readiness={readiness} intelligence={intelligence} />;
  };

  return (
    <AppLayout
      active={view === 'career-roles' ? 'roles' : view}
      onNavigate={go}
      user={user}
      readinessScore={readinessScore}
      roleLabel={roleLabel}
      notificationCount={unread}
      onLogout={async () => { onLogout?.(); }}
      flushContent
      contentClassName={view === 'assistant' ? 'workspace-assistant-content' : 'workspace-content'}
    >
      {loading && <div className="learner-loading">Loading your workspace…</div>}
      {apiError && <div className="learner-api-note">{apiError}</div>}
      <div className="learner-content">{content()}</div>
    </AppLayout>
  );
}
