import { useEffect, useState } from 'react';
import AppLayout from './AppLayout';
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
import './Dashboard.css';

function ReadinessRing({ value = 0 }) {
  const size = 130;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * c;

  return (
    <div className="readiness-ring" aria-label={`Readiness score: ${value} out of 100`}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${filled} ${c - filled}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
        </defs>
      </svg>
      <div className="readiness-ring-value">
        <span className="num">{value}</span>
        <span className="den">/ 100</span>
      </div>
    </div>
  );
}

const StatIcon = {
  folder: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  ),
  map: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" /><path d="M9 3v15M15 6v15" />
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h9l3 3v17H6z" /><path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
};

export default function Dashboard({ user, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [d, setD] = useState({
    readinessScore: 0,
    roleLabel: '',
    activeProjects: 0,
    activeProjectsNote: '0 active applications',
    skillsAssessed: 0,
    skillsAssessedTotal: 24,
    roadmapPhase: 'Phase 1',
    roadmapPhaseNote: 'Phase 1 of 4',
    recordItems: 0,
    recordItemsNote: '0 verified',
    nextAction: {
      title: 'Complete Baseline Assessment',
      description: 'Take the assessment to evaluate your skills, generate your roadmap, and calculate readiness.',
      tags: ['Skill Evaluation', 'Roadmap', 'Score +8pts'],
      target: 'skill-assessment',
      buttonLabel: 'Start Assessment →',
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
      const evidence = evidenceRes.status === 'fulfilled' ? extractList(evidenceRes.value) : [];
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
      if (!roleTitle) roleTitle = 'Software Engineer';

      // 2. Active Projects / Applications
      const activeApps = apps.filter((item) => {
        if (item.is_active !== undefined) return Boolean(item.is_active);
        const status = String(item.status ?? '').toLowerCase();
        return !['completed', 'closed', 'withdrawn', 'rejected', 'cancelled'].includes(status);
      });
      const activeProjectsCount = activeApps.length;
      const activeProjectsNote = activeProjectsCount === 1
        ? '1 active application'
        : activeProjectsCount > 1
        ? `${activeProjectsCount} active applications`
        : '0 active applications';

      // 3. Skills Assessed
      const totalRequiredSkills = Number(readiness?.total_skills ?? 24) || 24;
      const skillsAssessedCount = skillsMatrix.length > 0
        ? skillsMatrix.length
        : Number(readiness?.met_skills ?? 0);
      const skillsAssessedNote = `of ${totalRequiredSkills} required`;

      // 4. Evidence / Record Items
      const totalEvidence = evidence.length;
      const verifiedCount = evidence.filter((item) =>
        String(item.verification_status ?? item.status ?? '').toLowerCase() === 'verified'
      ).length;
      const recordItemsNote = `${verifiedCount} verified`;

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
        tags: ['Skill Evaluation', 'Roadmap', 'Score +8pts'],
        target: 'skill-assessment',
        buttonLabel: 'Start Assessment →',
      };

      if (nextActionItem) {
        let target = 'career-journey';
        let buttonLabel = 'View Roadmap →';
        const actType = String(nextActionItem.type ?? '').toLowerCase();
        if (actType.includes('assessment') || nextActionItem.target_skill_id) {
          target = 'skill-assessment';
          buttonLabel = 'Start Assessment →';
        } else if (actType.includes('project') || actType.includes('simulation')) {
          target = 'projects';
          buttonLabel = 'Explore Projects →';
        }

        let tags = [];
        if (Array.isArray(nextActionItem.completion_criteria) && nextActionItem.completion_criteria.length > 0) {
          tags = nextActionItem.completion_criteria.slice(0, 3);
        } else {
          if (nextActionItem.type) tags.push(nextActionItem.type.replace(/_/g, ' '));
          if (nextActionItem.phase) tags.push(`Phase ${nextActionItem.phase}`);
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
      let roadmapPhaseDisplay = '35%';
      let roadmapPhaseNote = 'Phase 2 of 4';
      if (actions.length > 0) {
        const completedActions = actions.filter((a) => a.status === 'completed').length;
        const pct = Math.round((completedActions / actions.length) * 100);
        const curPhase = nextActionItem?.phase || (completedActions > 0 ? actions[Math.min(completedActions, actions.length - 1)]?.phase : 1) || 1;
        const maxPhase = Math.max(...actions.map((a) => a.phase || 1), 4);
        roadmapPhaseDisplay = `${pct}%`;
        roadmapPhaseNote = `Phase ${curPhase} of ${maxPhase}`;
      } else if (score > 0) {
        roadmapPhaseDisplay = `${Math.min(100, Math.round(score * 0.8))}%`;
        roadmapPhaseNote = 'Phase 2 of 4';
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
            level: `${cur}/${req}`,
            pct,
            isCritical: Boolean(gap.is_critical),
          };
        });
      } else {
        // Fallback default skills for visual display when no gaps returned
        mappedGaps = [
          { name: 'Python', level: '3/4', pct: 75, isCritical: true },
          { name: 'React', level: '2/3', pct: 66, isCritical: false },
          { name: 'SQL', level: '2/3', pct: 60, isCritical: false },
          { name: 'Git & CI/CD', level: '1/2', pct: 50, isCritical: false },
        ];
      }

      // 7. Recommended Projects (prefer stored recommendations, fallback to catalog)
      let mappedProjects = [];
      if (recs.length > 0) {
        mappedProjects = recs
          .filter((r) => r.project && !r.access_revoked)
          .slice(0, 3)
          .map((r, i) => {
            const p = r.project;
            const code = (p.title || 'PR').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PR';
            const colors = [
              'linear-gradient(135deg, rgb(59, 139, 255) 0%, rgb(124, 58, 237) 100%)',
              'linear-gradient(135deg, rgb(5, 150, 105) 0%, rgb(16, 185, 129) 100%)',
              'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(234, 88, 12) 100%)',
            ];
            return {
              id: p.id,
              code,
              title: p.title || 'Project',
              company: p.organization?.title || p.organization?.name || 'SkillSpan Partner',
              duration: p.duration_days ? `${Math.round(p.duration_days / 7)} weeks` : (p.schedule || '4 weeks'),
              match: Math.round(Number(r.score ?? 85)),
              color: colors[i % colors.length],
            };
          });
      }

      if (mappedProjects.length === 0 && projects.length > 0) {
        mappedProjects = projects.slice(0, 3).map((p, i) => {
          const code = (p.title || 'PR').replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PR';
          const colors = [
            'linear-gradient(135deg, rgb(59, 139, 255) 0%, rgb(124, 58, 237) 100%)',
            'linear-gradient(135deg, rgb(5, 150, 105) 0%, rgb(16, 185, 129) 100%)',
            'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(234, 88, 12) 100%)',
          ];
          return {
            id: p.id,
            code,
            title: p.title || 'Project',
            company: p.organization?.title || p.organization?.name || (p.type === 'simulation' ? 'SkillSpan Simulation' : 'Partner Project'),
            duration: p.duration_days ? `${Math.round(p.duration_days / 7)} weeks` : (p.schedule || '4 weeks'),
            match: Math.round(Number(p.match_score ?? (88 - i * 14))),
            color: colors[i % colors.length],
          };
        });
      }

      // Default presentation when catalog is empty
      if (mappedProjects.length === 0) {
        mappedProjects = [
          {
            id: 1,
            code: 'TE',
            title: 'Customer Analytics Dashboard',
            company: 'TechCorp · 4 weeks',
            duration: '4 weeks',
            match: 88,
            color: 'linear-gradient(135deg, rgb(59, 139, 255) 0%, rgb(124, 58, 237) 100%)',
          },
          {
            id: 2,
            code: 'SK',
            title: 'E-commerce REST API',
            company: 'SkillSpan · 3 weeks',
            duration: '3 weeks',
            match: 74,
            color: 'linear-gradient(135deg, rgb(5, 150, 105) 0%, rgb(16, 185, 129) 100%)',
          },
          {
            id: 3,
            code: 'DA',
            title: 'ML Sentiment Analysis',
            company: 'DataLabs · 6 weeks',
            duration: '6 weeks',
            match: 61,
            color: 'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(234, 88, 12) 100%)',
          },
        ];
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
        roadmapPhase: roadmapPhaseDisplay,
        roadmapPhaseNote,
        recordItems: totalEvidence,
        recordItemsNote,
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

  useEffect(() => {
    let alive = true;
    loadDashboardData();
    return () => {
      alive = false;
    };
  }, []);

  const firstName = user?.name ? user.name.split(' ')[0] : (user?.full_name ? user.full_name.split(' ')[0] : 'there');

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
        <h1 className="dash-title motion-enter">Welcome back, {firstName} 👋</h1>
        <p className="dash-subtitle">Here's your career readiness overview for today.</p>
      </div>

      {loadError && (
        <div role="alert" className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-center justify-between">
          <span>{loadError}</span>
          <button type="button" onClick={loadDashboardData} className="font-semibold underline ml-3">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="dash-loading">
          <span>Loading your career dashboard…</span>
        </div>
      )}

      {/* Top Row: Readiness Ring + Next Best Action */}
      <div className="dash-top-row motion-stagger">
        <div
          className="dash-card dash-readiness-card motion-scale-in"
          onClick={() => handleNavigate('career-journey')}
          title="Click to view detailed career roadmap"
        >
          <ReadinessRing value={d.readinessScore} />
          <div className="r-label">Readiness Score</div>
          <div className="r-sub">{d.roleLabel}</div>
          <button
            type="button"
            className="btn-pill"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate('career-journey');
            }}
          >
            View Roadmap →
          </button>
        </div>

        <div className="dash-card dash-action-card motion-scale-in">
          <span className="dash-action-tag">⚡ Next Best Action</span>
          <h3>{d.nextAction.title}</h3>
          <p>{d.nextAction.description}</p>
          <div className="dash-chip-row">
            {d.nextAction.tags.map((t, idx) => (
              <span key={`${t}-${idx}`} className="dash-chip">
                {t}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="btn-pill"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => handleNavigate(d.nextAction.target)}
          >
            {d.nextAction.buttonLabel}
          </button>
        </div>
      </div>

      {/* Stats Row: 4 Connected Cards */}
      <div className="dash-stats-row motion-stagger">
        <div
          className="dash-stat-card"
          onClick={() => handleNavigate('projects')}
          title="View active project applications"
        >
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.folder}</span>
            <span className="dash-stat-pill pill-blue">{d.activeProjectsNote}</span>
          </div>
          <div className="dash-stat-num">{d.activeProjects}</div>
          <div className="dash-stat-label">Active Projects</div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => handleNavigate('skill-matrix')}
          title="Open My Skill Matrix"
        >
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.star}</span>
            <span className="dash-stat-pill pill-blue">{d.skillsAssessedNote}</span>
          </div>
          <div className="dash-stat-num">{d.skillsAssessed}</div>
          <div className="dash-stat-label">Skills Assessed</div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => handleNavigate('career-journey')}
          title="View roadmap progress"
        >
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.map}</span>
            <span className="dash-stat-pill pill-green">{d.roadmapPhaseNote}</span>
          </div>
          <div className="dash-stat-num">{d.roadmapPhase}</div>
          <div className="dash-stat-label">Roadmap Progress</div>
        </div>

        <div
          className="dash-stat-card"
          onClick={() => handleNavigate('record')}
          title="View verified evidence and records"
        >
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.file}</span>
            <span className="dash-stat-pill pill-orange">{d.recordItemsNote}</span>
          </div>
          <div className="dash-stat-num">{d.recordItems}</div>
          <div className="dash-stat-label">Record Items</div>
        </div>
      </div>

      {/* Bottom Row: Top Skill Gaps + Recommended Projects */}
      <div className="dash-bottom-row motion-stagger">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Top Skill Gaps</h3>
            <a role="button" tabIndex={0} onClick={() => handleNavigate('skill-matrix')}>
              View All →
            </a>
          </div>

          {d.skillGaps.length > 0 ? (
            d.skillGaps.map((g) => (
              <div
                className="gap-row"
                key={g.name}
                onClick={() => handleNavigate('skill-matrix')}
                title={`Open ${g.name} in Skill Matrix`}
              >
                <div className="gap-row-top">
                  <span className="name">
                    {g.name}
                    {g.isCritical && (
                      <span style={{ color: '#ef4444', fontSize: '0.72rem', marginLeft: '6px', fontWeight: 'bold' }}>
                        *Critical
                      </span>
                    )}
                  </span>
                  <span className="lv">Lv {g.level}</span>
                </div>
                <div className="gap-bar-track">
                  <div
                    className="gap-bar-fill"
                    style={{
                      width: `${Math.max(5, g.pct)}%`,
                      backgroundColor: g.isCritical ? '#ef4444' : g.pct >= 70 ? '#3b8bff' : '#f59e0b',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="dash-empty-state">
              <p>No skill gaps recorded yet.</p>
              <button
                type="button"
                className="dash-empty-btn"
                onClick={() => handleNavigate('skill-matrix')}
              >
                Update Skill Matrix →
              </button>
            </div>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Recommended Projects</h3>
            <a role="button" tabIndex={0} onClick={() => handleNavigate('projects')}>
              Browse All →
            </a>
          </div>

          {d.recommendedProjects.length > 0 ? (
            d.recommendedProjects.map((p) => (
              <div
                className="proj-row"
                key={`${p.title}-${p.id}`}
                onClick={() => handleNavigate('projects')}
                title={`Explore project: ${p.title}`}
              >
                <span className="proj-avatar" style={{ background: p.color }}>
                  {p.code}
                </span>
                <div className="proj-info">
                  <div className="p-title">{p.title}</div>
                  <div className="p-sub">{p.company} · {p.duration}</div>
                </div>
                <span className="proj-match">{p.match}%</span>
              </div>
            ))
          ) : (
            <div className="dash-empty-state">
              <p>No project recommendations yet.</p>
              <button
                type="button"
                className="dash-empty-btn"
                onClick={() => handleNavigate('projects')}
              >
                Browse Projects →
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
