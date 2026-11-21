import { useEffect, useEffectEvent, useState } from 'react';
import AppLayout from './AppLayout';
import { useI18n } from '../../i18n/useI18n';
import { skillText } from '../../i18n/useUiText';
import { countAssessedSkills } from '../../utils/skillCount';
import {
  getLatestReadiness,
  getLatestIntelligence,
  getRecommendations,
  getProjects,
  getMyEvidence,
  getApplications,
  getSkillsMatrix,
  getCareerRoleById,
  getUnreadNotificationCount,
  getNotifications,
  unwrapApiData,
} from '../../api';
import { isLearnerEvidence } from '../evidence/lib/evidenceApi';
import './Dashboard.css';
import { useProjectsText } from '../../i18n/useProjectsText';

// Roadmap actions carry the phase as a number or as the phase key the
// backend uses ("foundations", "core_skills", …); either way the dashboard
// needs its 1-based position.
const PHASE_ORDER = ['foundations', 'core_skills', 'applied_practice', 'career_readiness'];
function phaseNumber(phase) {
  if (phase == null || phase === '') return null;
  const n = Number(phase);
  if (Number.isFinite(n) && n > 0) return n;
  const key = String(phase).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const i = PHASE_ORDER.findIndex((name) => key === name || key.startsWith(name));
  return i >= 0 ? i + 1 : null;
}

function ReadinessRing({ value = 0, emptyLabel = "" }) {
  const empty = !(Number(value) > 0);
  const size = 130;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * c;

  return (
    <div className="readiness-ring" aria-label={`Readiness score: ${value} out of 100`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        {!empty && <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1667e0"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${c - filled}`}
          strokeLinecap="round"
        />}
      </svg>
      <div className="readiness-ring-value">
        {empty ? (
          <span className="den">{emptyLabel}</span>
        ) : (
          <bdi dir="ltr"><span className="num">{value}</span><span className="den"> / 100</span></bdi>
        )}
      </div>
    </div>
  );
}


export default function Dashboard({ user, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [d, setD] = useState({
    readinessScore: 0,
    roleLabel: '',
    activeProjects: 0,
    activeProjectsNote: { key: 'activeApps', n: 0 },
    skillsAssessed: 0,
    skillsAssessedTotal: null,
    roadmapPhase: null,
    roadmapPhaseNote: null,
    recordItems: 0,
    verifiedCount: 0,
    nextAction: {
      title: 'Complete Baseline Assessment',
      description: 'Take the assessment to evaluate your skills, generate your roadmap, and calculate readiness.',
      tags: ['Skill Evaluation', 'Roadmap'],
      target: 'skill-assessment',
      buttonLabel: 'Start Assessment',
    },
    skillGaps: [],
    recommendedProjects: [],
    notificationCount: 0,
    notifications: [],
  });

  const loadDashboardData = async () => {
    setLoading(true);
    setLoadError('');

    const extractList = (payload) => {
      const val = unwrapApiData(payload);
      if (Array.isArray(val)) return val;
      if (Array.isArray(val?.data)) return val.data;
      if (Array.isArray(val?.items)) return val.items;
      return [];
    };

    try {
      const results = await Promise.allSettled([
        getLatestReadiness(),
        getLatestIntelligence(),
        getRecommendations({ page: 1, perPage: 6 }),
        getProjects(),
        getMyEvidence(),
        getApplications({ page: 1, perPage: 100 }),
        getSkillsMatrix(),
        getUnreadNotificationCount(),
        getNotifications({ page: 1, perPage: 6 }),
      ]);

      const [
        readinessRes,
        intelRes,
        recsRes,
        projectsRes,
        evidenceRes,
        appsRes,
        skillsRes,
        unreadRes,
        notifsRes,
      ] = results;

      const readiness = readinessRes.status === 'fulfilled' ? unwrapApiData(readinessRes.value) : null;
      const intelligence = intelRes.status === 'fulfilled' ? unwrapApiData(intelRes.value) : null;
      const recs = recsRes.status === 'fulfilled' ? extractList(recsRes.value) : [];
      const projects = projectsRes.status === 'fulfilled' ? extractList(projectsRes.value) : [];
      // Assessment results come back from the evidence endpoint too; only what
      // the learner submitted counts as a record item.
      const evidence = evidenceRes.status === 'fulfilled' ? extractList(evidenceRes.value).filter(isLearnerEvidence) : [];
      const apps = appsRes.status === 'fulfilled' ? extractList(appsRes.value) : [];
      const skillsMatrix = skillsRes.status === 'fulfilled' ? extractList(skillsRes.value) : [];
      const unreadVal = unreadRes.status === 'fulfilled' ? unwrapApiData(unreadRes.value) : null;
      const notifications = notifsRes.status === 'fulfilled' ? extractList(notifsRes.value) : [];

      // 1. Readiness Score & Career Role Title
      const rawScore = Number(readiness?.score ?? intelligence?.readiness?.score ?? user?.readiness_score ?? 0);
      const score = Math.max(0, Math.min(100, Math.round(rawScore)));

      let roleTitle = readiness?.role_title || user?.career_role?.title || user?.career_role_title || '';
      const careerRoleId = readiness?.career_role_id ?? readiness?.careerRoleId ?? intelligence?.role_id;
      if (careerRoleId != null && careerRoleId !== '') {
        try {
          const roleData = unwrapApiData(await getCareerRoleById(careerRoleId));
          const resolved = roleData?.career_role ?? roleData?.role ?? roleData;
          if (resolved?.title) roleTitle = resolved.title;
        } catch {
          // Keep current roleTitle
        }
      }
      // No invented role: show "not set" when the server has none.

      // 2. Active Projects / Applications
      const activeApps = apps.filter((item) => {
        if (item.is_active !== undefined) return Boolean(item.is_active);
        const status = String(item.status ?? '').toLowerCase();
        return !['completed', 'closed', 'withdrawn', 'rejected', 'cancelled'].includes(status);
      });
      const activeProjectsCount = activeApps.length;
      const activeProjectsNote = { key: 'activeApps', n: activeProjectsCount };

      // 3. Skills Assessed
      const totalRequiredSkills = Number(readiness?.total_skills) || null;
      // Distinct skills, never more than the role requires (no "12/10").
      const skillsAssessedCount = skillsMatrix.length > 0
        ? countAssessedSkills(skillsMatrix, totalRequiredSkills)
        : Math.min(Number(readiness?.met_skills ?? 0) || 0, totalRequiredSkills ?? Infinity);


      // 4. Evidence / Record Items
      const totalEvidence = evidence.length;
      const verifiedCount = evidence.filter((item) =>
        String(item.verification_status ?? item.status ?? '').toLowerCase() === 'verified'
      ).length;


      // 5. Intelligence / Roadmap / Next Best Action
      const roadmap = intelligence?.roadmap ?? null;
      const actions = Array.isArray(roadmap?.actions) ? roadmap.actions : [];
      const nextActionId = roadmap?.next_best_action_id;

      let nextActionItem = null;
      if (nextActionId) {
        nextActionItem = actions.find((a) => a.id === nextActionId);
      }
      if (!nextActionItem) {
        nextActionItem = actions.find((a) => a.status !== 'completed') || actions[0] || null;
      }

      let nextAction = {
        title: 'Complete Baseline Assessment',
        description: 'Take the assessment to evaluate your skills, generate your personalized roadmap, and calculate readiness.',
        tags: ['Skill Evaluation', 'Roadmap'],
        target: 'skill-assessment',
        buttonLabel: 'Start Assessment',
      };

      if (nextActionItem) {
        let target = 'career-journey';
        let buttonLabel = 'View Roadmap';
        // RoadmapAction::TYPES: assessment | resource | practice |
        // simulated_project | real_project.
        const actType = String(nextActionItem.type ?? '').toLowerCase();
        if (actType === 'assessment') {
          target = 'skill-assessment';
          buttonLabel = 'Start Assessment';
        } else if (actType === 'practice' || actType === 'simulated_project' || actType === 'real_project') {
          target = 'projects';
          buttonLabel = 'Explore Projects';
        }

        let tags = [];
        if (Array.isArray(nextActionItem.completion_criteria) && nextActionItem.completion_criteria.length > 0) {
          tags = nextActionItem.completion_criteria.slice(0, 3);
        } else {
          if (nextActionItem.type) tags.push(nextActionItem.type.replace(/_/g, ' '));
          if (phaseNumber(nextActionItem.phase)) tags.push(`Phase ${phaseNumber(nextActionItem.phase)}`);
          if (nextActionItem.estimated_hours) tags.push(`${nextActionItem.estimated_hours}h estimated`);
        }

        nextAction = {
          title: nextActionItem.title || 'Next Milestone Action',
          description: nextActionItem.description || nextActionItem.objective || 'Complete this task to advance your roadmap progress.',
          tags: tags.length > 0 ? tags : ['Skill Growth', 'Roadmap Milestone'],
          target,
          buttonLabel,
        };
      }

      // Roadmap phase & progress
      // Only real roadmap data; nothing is shown as progress without it.
      let roadmapPhaseDisplay = null;
      let roadmapPhaseNote = null;
      if (actions.length > 0) {
        const completedActions = actions.filter((a) => a.status === 'completed').length;
        const pct = Math.round((completedActions / actions.length) * 100);
        const curPhase = phaseNumber(nextActionItem?.phase) || (completedActions > 0 ? phaseNumber(actions[Math.min(completedActions, actions.length - 1)]?.phase) : 1) || 1;
        const maxPhase = Math.max(...actions.map((a) => phaseNumber(a.phase) || 1), 4);
        roadmapPhaseDisplay = `${pct}%`;
        roadmapPhaseNote = { n: curPhase, m: maxPhase };
      }

      // 6. Skill Gaps (from Intelligence)
      const rawGaps = Array.isArray(intelligence?.skill_gaps) ? intelligence.skill_gaps : [];
      let mappedGaps = [];
      if (rawGaps.length > 0) {
        mappedGaps = rawGaps.slice(0, 4).map((gap) => {
          const cur = Number(gap.current_level ?? 0);
          const req = Number(gap.required_level ?? 0);
          const pct = gap.match_score !== null && gap.match_score !== undefined
            ? Math.min(100, Math.max(0, Math.round(Number(gap.match_score))))
            : req > 0 ? Math.min(100, Math.max(0, Math.round((cur / req) * 100))) : 0;
          return {
            name: gap.skill_name || gap.skill?.name || gap.name || 'Skill',
            nameAr: gap.skill_name_ar ?? gap.skill?.name_ar ?? gap.name_ar ?? null,
            level: `${cur}/${req}`,
            pct,
            isCritical: Boolean(gap.is_critical),
          };
        });
      }
      // No demo skills: an empty list shows the empty state.

      // 7. Recommended Projects (stored recommendations first, then the catalog).
      // Only server values are shown: no default match %, partner name or duration.
      const toRow = (p, score) => ({
        id: p.id,
        code: (p.title || 'PR').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PR',
        title: p.title || 'Project',
        company: p.organization?.title || p.organization?.name || null,
        type: p.type || null,
        weeks: p.duration_days ? Math.max(1, Math.round(p.duration_days / 7)) : null,
        match: score === null || score === undefined || score === '' ? null : Math.round(Number(score)),
      });
      let mappedProjects = [];
      if (recs.length > 0) {
        mappedProjects = recs
          .filter((r) => r.project && !r.access_revoked)
          .slice(0, 3)
          .map((r) => toRow(r.project, r.score));
      }
      if (mappedProjects.length === 0 && projects.length > 0) {
        mappedProjects = projects.slice(0, 3).map((p) => toRow(p, p.match_score));
      }

      // 8. Notifications
      const unreadCount = Number(unreadVal?.unread_count ?? unreadVal?.count ?? unreadVal ?? 0) || 0;

      setD({
        readinessScore: score,
        roleLabel: roleTitle,
        activeProjects: activeProjectsCount,
        activeProjectsNote,
        skillsAssessed: skillsAssessedCount,
        skillsAssessedTotal: totalRequiredSkills,
        verifiedCount,
        roadmapPhase: roadmapPhaseDisplay,
        roadmapPhaseNote,
        recordItems: totalEvidence,
        nextAction,
        skillGaps: mappedGaps,
        recommendedProjects: mappedProjects,
        notificationCount: unreadCount,
        notifications,
      });
    } catch (err) {
      setLoadError(err?.message || 'Could not load dashboard data from server.');
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount with the current loader (an effect event, so the effect
  // does not re-run when the loader is recreated on every render).
  const loadOnMount = useEffectEvent(() => {
    loadDashboardData();
  });
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; the loader's loading/error reset is the intended sync
    loadOnMount();
  }, []);

  const { t, lang } = useI18n();
  const { L } = useProjectsText();

  const firstName = user?.name ? user.name.split(' ')[0] : (user?.full_name ? user.full_name.split(' ')[0] : '');

  // A support reply that is still unread is the "someone is waiting for you"
  // signal. Computed here so the mark lives only on the dashboard, not the nav.
  const supportWaiting = d.notifications.some(
    (row) => !row.is_read && /^\/?support\/requests\/\d+/.test(String(row.link || '')),
  );

  const handleNavigate = (key) => {
    if (onNavigate) onNavigate(key);
  };

  return (
    <AppLayout
      active="dashboard"
      onNavigate={handleNavigate}
      user={user}
      onLogout={onLogout}
      readinessScore={d.readinessScore}
      roleLabel={d.roleLabel}
      notificationCount={d.notificationCount}
      notifications={d.notifications}
      onRefreshNotifications={loadDashboardData}
    >
      <div className="dash-header">
        <h1 className="dash-title motion-enter">{firstName ? L("Welcome back, {name}", { name: firstName }) : L("Welcome back")}</h1>
        <p className="dash-subtitle">{L("Here's your career readiness overview for today.")}</p>
      </div>

      {loadError && (
        <div role="alert" className="dash-notice dash-notice--error">
          <span>{L(loadError)}</span>
          <button type="button" onClick={loadDashboardData} className="dash-notice-action">
            {L("Retry")}
          </button>
        </div>
      )}

      {loading && (
        <div className="dash-loading">
          <span>{L("Loading your career dashboard…")}</span>
        </div>
      )}

      {/* Support mark — appears only on the dashboard. */}
      <div className={`dash-support-banner${supportWaiting ? ' is-waiting' : ''}`} role="region" aria-label={t('dashboard.supportTitle')}>
        <div className="dash-support-text">
          <strong>{supportWaiting ? t('dashboard.supportWaiting') : t('dashboard.supportTitle')}</strong>
          <span>{supportWaiting ? t('dashboard.supportWaitingHint') : t('dashboard.supportHint')}</span>
        </div>
        <button type="button" className="btn-pill" onClick={() => handleNavigate('support')}>
          {t('dashboard.supportCta')}
        </button>
      </div>

      {/* Top Row: Readiness Ring + Next Best Action */}
      <div className="dash-top-row motion-stagger">
        <div
          className="dash-card dash-readiness-card motion-scale-in"
          onClick={() => handleNavigate('career-journey')}
        >
          <ReadinessRing value={d.readinessScore} emptyLabel={L("Not calculated yet")} />
          <div className="r-label">{L("Readiness Score")}</div>
          <div className="r-sub">{d.roleLabel || L("Career role not set")}</div>
          <button
            type="button"
            className="btn-pill"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('career-journey');
            }}
          >
            {L("View Roadmap")}
          </button>
        </div>

        <div className="dash-card dash-action-card motion-scale-in">
          <span className="dash-action-tag">{L("Next Best Action")}</span>
          <h3 dir="auto">{L(d.nextAction.title)}</h3>
          <p dir="auto">{L(d.nextAction.description)}</p>
          <div className="dash-chip-row">
            {d.nextAction.tags.map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="dash-chip">
                {L(tag)}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="btn-pill"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => handleNavigate(d.nextAction.target)}
          >
            {L(d.nextAction.buttonLabel)}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="dash-stats-row motion-stagger">
        <div className="dash-stat-card" onClick={() => handleNavigate('projects')}>
          <div className="dash-stat-top">
            <span className="dash-stat-label">{L("Active Projects")}</span>
            <span className="dash-stat-pill pill-blue">{L("{n} active applications", { n: d.activeProjectsNote?.n ?? d.activeProjects })}</span>
          </div>
          <div className="dash-stat-num"><bdi dir="ltr">{d.activeProjects}</bdi></div>
        </div>

        <div className="dash-stat-card" onClick={() => handleNavigate('skill-matrix')}>
          <div className="dash-stat-top">
            <span className="dash-stat-label">{L("Skills Assessed")}</span>
            {d.skillsAssessedTotal ? <span className="dash-stat-pill pill-blue">{L("of {n} required", { n: d.skillsAssessedTotal })}</span> : null}
          </div>
          <div className="dash-stat-num">
            {d.skillsAssessedTotal ? <bdi dir="ltr">{d.skillsAssessed}/{d.skillsAssessedTotal}</bdi> : <bdi dir="ltr">{d.skillsAssessed}</bdi>}
          </div>
        </div>

        <div className="dash-stat-card" onClick={() => handleNavigate('career-journey')}>
          <div className="dash-stat-top">
            <span className="dash-stat-label">{L("Roadmap Progress")}</span>
            <span className="dash-stat-pill pill-green">{d.roadmapPhaseNote ? L("Phase {n} of {m}", d.roadmapPhaseNote) : L("No roadmap yet")}</span>
          </div>
          <div className="dash-stat-num">{d.roadmapPhase ? <bdi dir="ltr">{d.roadmapPhase}</bdi> : <span className="dash-stat-empty">{L("Not started")}</span>}</div>
        </div>

        <div className="dash-stat-card" onClick={() => handleNavigate('record')}>
          <div className="dash-stat-top">
            <span className="dash-stat-label">{L("Record Items")}</span>
            <span className="dash-stat-pill pill-orange">{L("{n} verified", { n: d.verifiedCount ?? 0 })}</span>
          </div>
          <div className="dash-stat-num"><bdi dir="ltr">{d.recordItems}</bdi></div>
        </div>
      </div>

      {/* Bottom Row: Top Skill Gaps + Recommended Projects */}
      <div className="dash-bottom-row motion-stagger">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>{L("Top Skill Gaps")}</h3>
            <a role="button" tabIndex={0} onClick={() => handleNavigate('skill-matrix')}>
              {L("View All")}
            </a>
          </div>

          {d.skillGaps.length > 0 ? (
            d.skillGaps.map((g) => (
              <div className="gap-row" key={g.name} onClick={() => handleNavigate('skill-matrix')}>
                <div className="gap-row-top">
                  <span className="name" dir="auto">
                    {skillText(lang, g.name, { skillNameAr: g.nameAr })}
                    {g.isCritical && <span className="gap-critical">{L("Critical")}</span>}
                  </span>
                  <span className="lv"><bdi dir="ltr">{L("Lv {n}", { n: g.level })}</bdi></span>
                </div>
                <div className="gap-bar-track">
                  <div
                    className="gap-bar-fill"
                    style={{
                      width: `${Math.max(4, g.pct)}%`,
                      backgroundColor: g.isCritical ? '#d13b3b' : g.pct >= 70 ? '#1667e0' : '#f2b544',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="dash-empty-state">
              <p>{L("No skill gaps recorded yet.")}</p>
              <button type="button" className="dash-empty-btn" onClick={() => handleNavigate('skill-matrix')}>
                {L("Update Skill Matrix")}
              </button>
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>{L("Recommended Projects")}</h3>
            <a role="button" tabIndex={0} onClick={() => handleNavigate('projects')}>
              {L("Browse All")}
            </a>
          </div>

          {d.recommendedProjects.length > 0 ? (
            d.recommendedProjects.map((p) => {
              const sub = [p.company || (p.type === 'simulation' ? L("Simulation project") : null), p.weeks ? L("{n} weeks", { n: p.weeks }) : null].filter(Boolean);
              return (
                <div className="proj-row" key={`${p.title}-${p.id}`} onClick={() => handleNavigate('projects')}>
                  <span className="proj-avatar">{p.code}</span>
                  <div className="proj-info">
                    <div className="p-title" dir="auto">{p.title}</div>
                    {sub.length > 0 && <div className="p-sub">{sub.map((part, i) => <span key={i}>{i > 0 ? ' · ' : ''}<bdi>{part}</bdi></span>)}</div>}
                  </div>
                  {p.match !== null && !Number.isNaN(p.match) && <span className="proj-match"><bdi dir="ltr">{p.match}%</bdi></span>}
                </div>
              );
            })
          ) : (
            <div className="dash-empty-state">
              <p>{L("No project recommendations yet.")}</p>
              <button type="button" className="dash-empty-btn" onClick={() => handleNavigate('projects')}>
                {L("Browse Projects")}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
