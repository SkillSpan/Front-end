import { useEffect, useMemo, useState } from 'react';
import CareerJourneyView from './CareerJourneyView';
import CareerRolesView from './CareerRolesView';
import ProjectsView from './ProjectsView';
import ProjectDetailsView from './ProjectDetailsView';
import AssistantView from './AssistantView';
import MentorView from './MentorView';
import TalentDiscoveryView from './TalentDiscoveryView';
import { getApplications, getCareerRoles, getLatestReadiness, getNotifications, getProfile, getProjects, getRecommendations, getUnreadNotificationCount, unwrapApiData } from '../../api';
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
  const [profile, setProfile] = useState(null);
  const [unread, setUnread] = useState(0);
  const [projectDetails, setProjectDetails] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setApiError('');
      const results = await Promise.allSettled([
        getProfile(), getCareerRoles({ page: 1, perPage: 50 }), getProjects(), getRecommendations({ page: 1, perPage: 50 }),
        getLatestReadiness(), getUnreadNotificationCount(), getApplications({ page: 1, perPage: 20 }), getNotifications({ page: 1, perPage: 10 })
      ]);
      if (!alive) return;
      const [pr, rr, pj, rec, rd, un] = results;
      if (pr.status === 'fulfilled') setProfile(unwrapApiData(pr.value));
      if (rr.status === 'fulfilled') setRoles(collection(rr.value));
      if (pj.status === 'fulfilled') setProjects(collection(pj.value));
      if (rec.status === 'fulfilled') setRecommendations(collection(rec.value));
      if (rd.status === 'fulfilled') setReadiness(unwrapApiData(rd.value));
      if (un.status === 'fulfilled') {
        const value = unwrapApiData(un.value); setUnread(Number(value?.count ?? value?.unread_count ?? value ?? 0) || 0);
      }
      const rejected = results.filter(x => x.status === 'rejected');
      if (rejected.length) setApiError('بعض بيانات لوحة التحكم لم تتوفر من الخادم، لذلك تم الإبقاء على الواجهة الاحتياطية دون كسر الصفحة.');
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const user = profile || authUser || {};
  const readinessScore = Number(readiness?.score ?? readiness?.readiness_score ?? 0) || 0;
  const roleLabel = readiness?.roleTitle || readiness?.role_title || roles[0]?.title || '';
  const title = useMemo(() => user?.name || user?.full_name || 'Learner', [user]);

  const go = (key) => {
    setProjectDetails(false);
    if (key === 'dashboard') return onNavigate?.('dashboard');
    if (key === 'skill-matrix') return onNavigate?.('skill-matrix');
    if (key === 'evidence') return onNavigate?.('evidence');
    if (key === 'record') return onNavigate?.('record');
    if (key === 'roles') return setView('career-roles');
    setView(key);
  };

  const content = () => {
    if (view === 'dashboard') return <CareerJourneyView readiness={readiness} />;
    if (view === 'career-journey') return <CareerJourneyView readiness={readiness} />;
    if (view === 'career-roles') return <CareerRolesView initialRoles={roles} />;
    if (view === 'projects') return projectDetails ? <ProjectDetailsView onBack={() => setProjectDetails(false)} /> : <ProjectsView initialProjects={projects.length ? projects : recommendations} onOpenDetails={() => setProjectDetails(true)} />;
    if (view === 'assistant') return <AssistantView />;
    if (view === 'mentor') return <MentorView />;
    if (view === 'talent') return <TalentDiscoveryView />;
    if (view === 'evidence') return <CareerJourneyView readiness={readiness} />;
    if (view === 'record') return <CareerJourneyView readiness={readiness} />;
    return <CareerJourneyView readiness={readiness} />;
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
