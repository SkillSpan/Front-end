import AppLayout from './AppLayout';
import './Dashboard.css';

// NOTE: there is no backend endpoint yet for readiness score / skill gaps /
// recommended projects (see api.js - only auth + profile + readiness/latest
// exist so far, and readiness/latest doesn't return this shape). This data
// is placeholder/mock so the screen matches the design; swap it for real
// data once those endpoints exist (e.g. wire `readiness` to
// getLatestReadiness()).
const MOCK = {
  readinessScore: 67,
  roleLabel: 'Software Engineer',
  activeProjects: 2,
  activeProjectsNote: '1 submission due',
  skillsAssessed: 18,
  skillsAssessedTotal: 24,
  roadmapPhase: '35%',
  roadmapPhaseNote: 'Phase 2 of 4',
  recordItems: 9,
  recordItemsNote: '4 verified',
  nextAction: {
    title: 'Complete Python Intermediate Assessment',
    description: 'Completing this assessment closes your largest skill gap and unlocks Phase 2 of your roadmap.',
    tags: ['Closes Python gap', 'Unlocks Phase 2', 'Improves score +8pts'],
  },
  skillGaps: [
    { name: 'Python', level: '3/4', pct: 75 },
    { name: 'React', level: '2/3', pct: 66 },
    { name: 'Tableau', level: '0/2', pct: 4 },
    { name: 'Pandas', level: '2/3', pct: 66 },
  ],
  recommendedProjects: [
    { code: 'TE', color: '#6366f1', title: 'Customer Analytics Dashboard', company: 'TechCorp', duration: '4 weeks', match: 88 },
    { code: 'SK', color: '#10b981', title: 'E-commerce REST API', company: 'SkillSpan', duration: '3 weeks', match: 74 },
    { code: 'DA', color: '#8b5cf6', title: 'ML Sentiment Analysis', company: 'DataLabs', duration: '6 weeks', match: 61 },
  ],
};

function ReadinessRing({ value }) {
  const size = 130;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <div className="readiness-ring">
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
  const d = MOCK;
  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  return (
    <AppLayout
      active="dashboard"
      onNavigate={onNavigate}
      user={user}
      onLogout={onLogout}
      readinessScore={d.readinessScore}
      roleLabel={d.roleLabel}
    >
      <h1 className="dash-title">Welcome back, {firstName} 👋</h1>
      <p className="dash-subtitle">Here's your career readiness overview for today.</p>

      <div className="dash-top-row">
        <div className="dash-card dash-readiness-card">
          <ReadinessRing value={d.readinessScore} />
          <div className="r-label">Readiness Score</div>
          <div className="r-sub">{d.roleLabel}</div>
          <button type="button" className="btn-pill" onClick={() => onNavigate && onNavigate('roles')}>
            View Roadmap →
          </button>
        </div>

        <div className="dash-card dash-action-card">
          <span className="dash-action-tag">⚡ Next Best Action</span>
          <h3>{d.nextAction.title}</h3>
          <p>{d.nextAction.description}</p>
          <div className="dash-chip-row">
            {d.nextAction.tags.map((t) => (
              <span key={t} className="dash-chip">{t}</span>
            ))}
          </div>
          <button type="button" className="btn-pill" style={{ alignSelf: 'flex-start' }}>
            Start Assessment →
          </button>
        </div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.folder}</span>
            <span className="dash-stat-pill pill-blue">{d.activeProjectsNote}</span>
          </div>
          <div className="dash-stat-num">{d.activeProjects}</div>
          <div className="dash-stat-label">Active Projects</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.star}</span>
            <span className="dash-stat-pill pill-blue">of {d.skillsAssessedTotal} required</span>
          </div>
          <div className="dash-stat-num">{d.skillsAssessed}</div>
          <div className="dash-stat-label">Skills Assessed</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.map}</span>
            <span className="dash-stat-pill pill-green">{d.roadmapPhaseNote}</span>
          </div>
          <div className="dash-stat-num">{d.roadmapPhase}</div>
          <div className="dash-stat-label">Roadmap Progress</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-icon">{StatIcon.file}</span>
            <span className="dash-stat-pill pill-orange">{d.recordItemsNote}</span>
          </div>
          <div className="dash-stat-num">{d.recordItems}</div>
          <div className="dash-stat-label">Record Items</div>
        </div>
      </div>

      <div className="dash-bottom-row">
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Top Skill Gaps</h3>
            <a onClick={() => onNavigate && onNavigate('skill-matrix')}>View All →</a>
          </div>
          {d.skillGaps.map((g) => (
            <div className="gap-row" key={g.name}>
              <div className="gap-row-top">
                <span className="name">{g.name}</span>
                <span className="lv">Lv {g.level}</span>
              </div>
              <div className="gap-bar-track">
                <div className="gap-bar-fill" style={{ width: `${g.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3>Recommended Projects</h3>
            <a onClick={() => onNavigate && onNavigate('projects')}>Browse All →</a>
          </div>
          {d.recommendedProjects.map((p) => (
            <div className="proj-row" key={p.title}>
              <span className="proj-avatar" style={{ background: p.color }}>{p.code}</span>
              <div className="proj-info">
                <div className="p-title">{p.title}</div>
                <div className="p-sub">{p.company} · {p.duration}</div>
              </div>
              <span className="proj-match">{p.match}%</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
