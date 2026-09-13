import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../AppLayout';
import './CareerRoles.css';
import {
  categoryStyle,
  COMPARE_ACCENTS,
  readinessColor,
  skillMatch,
  skillStatusColor,
  skillMet,
  skillsMetCount,
  criticalSkills,
  criticalMetCount,
  gapToCloseLabel,
} from './rolesData';
import { loadCareerRolesCatalog, loadCareerRoleDetail } from './careerRolesApi';

const Icon = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  bookmark: (filled) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  ),
  clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9L5.7 21l1.7-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  cross: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  back: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  compare: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" />
    </svg>
  ),
};

// Simple in-app nav map, same convention as Dashboard.jsx / SkillMatrix.jsx.
const NAV_ROUTES = { dashboard: '/dashboard', 'skill-matrix': '/skill-matrix', roles: '/career-roles' };

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function pct(value) {
  return value == null ? '—' : `${value}%`;
}

/* ---------------------------- shared bits ---------------------------- */

function DashedRing({ value, color, size = 140, label, sublabel }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c / 40} ${c / 40 - 2}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value" style={{ color }}>{value ?? '—'}</span>
        <span className="ring-unit">/100</span>
      </div>
      {label && <div className="ring-label">{label}</div>}
      {sublabel && <div className="ring-sublabel">{sublabel}</div>}
    </div>
  );
}

function LoadingCard({ text = 'Loading…' }) {
  return <div className="cr-empty">{text}</div>;
}

function ErrorCard({ message, onRetry }) {
  return (
    <div className="cr-empty cr-error">
      <p style={{ margin: '0 0 12px' }}>{message || 'Something went wrong loading career roles.'}</p>
      {onRetry && (
        <button type="button" className="rc-details-btn" style={{ width: 'auto', padding: '9px 20px' }} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

/* ------------------------------ Browse ------------------------------- */

function RoleCard({ role, saved, onToggleSave, onViewDetails, style }) {
  const catStyle = categoryStyle(role.categoryKey);
  const crit = criticalSkills(role);
  return (
    <div className="rc-card" style={style}>
      <div className="rc-card-top">
        <div className="rc-badges">
          <span className="rc-badge" style={{ background: catStyle.bg, color: catStyle.fg }}>
            {role.categoryLabel}
          </span>
          {role.version && <span className="rc-version">{Icon.clock} {role.version}</span>}
        </div>
        <button
          type="button"
          className={`rc-bookmark${saved ? ' active' : ''}`}
          aria-label={saved ? 'Remove from saved roles' : 'Save role'}
          onClick={() => onToggleSave(role.id)}
        >
          {Icon.bookmark(saved)}
        </button>
      </div>

      <h3 className="rc-title">{role.title}</h3>

      <div className="rc-readiness-row">
        <span className="rc-readiness-label">Your Readiness</span>
        <span className="rc-readiness-value" style={{ color: readinessColor(role.readiness) }}>
          {pct(role.readiness)}
        </span>
      </div>
      <div className="rc-bar-track">
        <div className="rc-bar-fill" style={{ width: `${role.readiness ?? 0}%` }} />
      </div>

      <div className="rc-stats-row">
        <div>
          <div className="rc-stat-label">Skills required</div>
          <div className="rc-stat-value">{role.skills.length || '—'}</div>
        </div>
        <div>
          <div className="rc-stat-label">Critical skills</div>
          <div className="rc-stat-value critical">{criticalMetCount(role)}/{crit.length}</div>
        </div>
      </div>

      <button type="button" className="rc-details-btn" onClick={() => onViewDetails(role.id)}>
        View Role Details →
      </button>
    </div>
  );
}

function SuggestedPanel({ roles, onViewDetails }) {
  const suggestions = useMemo(
    () => roles
      .filter((r) => r.readiness != null && r.skills.length > 0)
      .sort((a, b) => b.readiness - a.readiness)
      .slice(0, 3),
    [roles]
  );

  if (!suggestions.length) return null;

  return (
    <div className="cr-suggested">
      <div className="cr-suggested-head">
        <span className="cr-suggested-star">{Icon.star}</span>
        <div>
          <h3>Suggested for You</h3>
          <p>Based on your current skill matrix — you choose, we explain</p>
        </div>
      </div>

      {suggestions.map((r) => (
        <div className="cr-suggested-row" key={r.id}>
          <span className="cr-suggested-avatar" style={{ background: categoryStyle(r.categoryKey).fg }}>
            {r.title.slice(0, 2)}
          </span>
          <div className="cr-suggested-info">
            <div className="cr-suggested-title-row">
              <span className="cr-suggested-title">{r.title}</span>
            </div>
            <p>{skillsMetCount(r)} of {r.skills.length} required skills currently met.</p>
          </div>
          <div className="cr-suggested-right">
            <span className="cr-suggested-pct" style={{ color: readinessColor(r.readiness) }}>
              {pct(r.readiness)}
            </span>
            <span className="cr-suggested-pct-label">Readiness</span>
            <button type="button" className="cr-explore-btn" onClick={() => onViewDetails(r.id)}>
              Explore →
            </button>
          </div>
        </div>
      ))}

      <p className="cr-suggested-footnote">
        Suggestions are generated from your skill matrix. They are explanations, not decisions — you remain in
        control of your career path.
      </p>
    </div>
  );
}

/* ---------------------------- Saved Roles ----------------------------- */

function SavedRoleRow({ role, onViewDetails, onRemove }) {
  const catStyle = categoryStyle(role.categoryKey);
  return (
    <div className="sr-row">
      <div className="sr-main">
        <div className="rc-badges">
          <span className="rc-badge" style={{ background: catStyle.bg, color: catStyle.fg }}>
            {role.categoryLabel}
          </span>
          {role.version && <span className="rc-version">{Icon.clock} {role.version}</span>}
        </div>
        <h3 className="rc-title" style={{ margin: '10px 0 14px' }}>{role.title}</h3>

        <div className="sr-stats">
          <div className="sr-stat">
            <div className="rc-stat-label">Readiness Score</div>
            <div className="sr-bar-row">
              <div className="rc-bar-track" style={{ width: 140, marginBottom: 0 }}>
                <div className="rc-bar-fill" style={{ width: `${role.readiness ?? 0}%` }} />
              </div>
              <span style={{ color: readinessColor(role.readiness), fontWeight: 800 }}>{pct(role.readiness)}</span>
            </div>
          </div>
          <div className="sr-stat">
            <div className="rc-stat-label">Skills Met</div>
            <div className="rc-stat-value">{skillsMetCount(role)}/{role.skills.length}</div>
          </div>
        </div>
      </div>

      <div className="sr-actions">
        <button type="button" className="rc-details-btn" onClick={() => onViewDetails(role.id)}>
          View Details
        </button>
        <button type="button" className="sr-remove-btn" onClick={() => onRemove(role.id)}>
          Remove
        </button>
      </div>
    </div>
  );
}

/* --------------------------- Role Details ------------------------------ */

function SkillRow({ skill, expanded, onToggle }) {
  const color = skillStatusColor(skill);
  const met = skillMet(skill);
  return (
    <div className="skill-row">
      <div className="skill-row-main" onClick={onToggle}>
        <div className="skill-name-col">
          {skill.critical && <span className="skill-dot" />}
          <span className="skill-name">{skill.name}</span>
        </div>
        <div className="skill-cat-col">{skill.category}</div>
        <div className="skill-bar-col">
          <div className="rc-bar-track" style={{ marginBottom: 0 }}>
            <div className="rc-bar-fill" style={{ width: `${skillMatch(skill)}%`, background: color }} />
          </div>
        </div>
        <div className="skill-ratio-col" style={{ color }}>{skill.current}/{skill.required}</div>
        <div className="skill-wt-col">{skill.weight}%</div>
        <div className="skill-status-col" style={{ color, borderColor: color }}>
          {met ? Icon.check : Icon.cross}
        </div>
        <button type="button" className={`skill-chevron${expanded ? ' open' : ''}`} aria-label="Toggle skill detail">
          {Icon.chevron}
        </button>
      </div>

      {expanded && (
        <div className="skill-expand">
          <div>
            <div className="skill-expand-label">Importance Weight</div>
            <div className="skill-expand-value">{skill.weight}% of role score</div>
          </div>
          <div>
            <div className="skill-expand-label">Critical Skill</div>
            <div className="skill-expand-value" style={{ color: skill.critical ? '#dc2626' : '#6a7093' }}>
              {skill.critical ? 'Yes — required for role approval' : 'No'}
            </div>
          </div>
          <div>
            <div className="skill-expand-label">Prerequisites</div>
            <div className="skill-expand-value">
              {skill.prerequisites.length
                ? skill.prerequisites.map((p) => <span key={p} className="prereq-chip">{p}</span>)
                : <span style={{ color: '#97a0bd' }}>None</span>}
            </div>
          </div>
          <div>
            <div className="skill-expand-label">Gap to Close</div>
            <div className="skill-expand-value" style={{ color: met ? '#16a34a' : '#d97706' }}>
              {gapToCloseLabel(skill)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleDetailsPage({ role, loading, error, saved, onToggleSave, onBack, onRetry }) {
  const [expandedSkills, setExpandedSkills] = useState(() => new Set());

  const toggleSkill = (name) => {
    setExpandedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <button type="button" className="back-link" onClick={onBack}>
        {Icon.back} Back to Roles
      </button>

      {loading && <LoadingCard text="Loading role details…" />}
      {!loading && error && <ErrorCard message={error} onRetry={onRetry} />}

      {!loading && !error && role && (
        <>
          <div className="detail-card">
            <div className="detail-head">
              <div>
                <div className="rc-badges">
                  <span className="rc-badge" style={{ background: categoryStyle(role.categoryKey).bg, color: categoryStyle(role.categoryKey).fg }}>
                    {role.categoryLabel}
                  </span>
                  {role.version && <span className="rc-version">{Icon.clock} {role.version}</span>}
                  {role.status && <span className="approved-badge">{Icon.check} {role.status}</span>}
                  {role.effectiveDate && <span className="effective-date">Effective {role.effectiveDate}</span>}
                </div>
                <h2 className="detail-title">{role.title}</h2>
              </div>
              <button
                type="button"
                className={`save-role-btn${saved ? ' active' : ''}`}
                onClick={() => onToggleSave(role.id)}
              >
                {Icon.bookmark(saved)} {saved ? 'Saved' : 'Save Role'}
              </button>
            </div>

            <div className="detail-stats-row">
              <div className="detail-stat-box ring-box">
                <DashedRing
                  value={role.readiness}
                  color={readinessColor(role.readiness)}
                  size={120}
                  label="Role Readiness"
                  sublabel="Based on current evidence snapshot"
                />
              </div>
              <div className="detail-stat-box">
                <div className="rc-stat-label">Skills Met</div>
                <div className="detail-big-num">{skillsMetCount(role)}<span>/{role.skills.length}</span></div>
              </div>
              <div className="detail-stat-box">
                <div className="rc-stat-label">Critical Skills Met</div>
                <div className="detail-big-num critical">{criticalMetCount(role)}<span>/{criticalSkills(role).length}</span></div>
              </div>
            </div>

            <div className="detail-progress-row">
              <span>Overall progress toward role readiness</span>
              <span style={{ fontWeight: 800 }}>{pct(role.readiness)}</span>
            </div>
            <div className="rc-bar-track wide">
              <div className="rc-bar-fill" style={{ width: `${role.readiness ?? 0}%` }} />
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-section-title">Labor-Market Demand</h3>
            <p className="demand-unavailable">
              Labor-market demand data isn't connected yet for this role — check back once that data source is
              available.
            </p>
          </div>

          <div className="detail-card">
            <h3 className="detail-section-title">Skill Requirements</h3>
            <p className="skill-req-note"><span className="skill-dot" /> Critical skills must be met for role approval</p>

            {role.skills.length === 0 ? (
              <p style={{ color: '#97a0bd', fontSize: '0.88rem' }}>No skill requirements found for this role yet.</p>
            ) : (
              <>
                <div className="skill-table-head">
                  <div className="skill-name-col">Skill</div>
                  <div className="skill-cat-col">Category</div>
                  <div className="skill-bar-col" />
                  <div className="skill-ratio-col">Gap / Required</div>
                  <div className="skill-wt-col">Wt.</div>
                  <div className="skill-status-col" />
                  <div style={{ width: 24 }} />
                </div>

                {role.skills.map((s) => (
                  <SkillRow
                    key={s.skillId ?? s.name}
                    skill={s}
                    expanded={expandedSkills.has(s.name)}
                    onToggle={() => toggleSkill(s.name)}
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

/* -------------------------- Compare Readiness --------------------------- */

function ComparePanel({ roles }) {
  const skillNames = useMemo(() => {
    const seen = new Set();
    const names = [];
    roles.forEach((r) => r.skills.forEach((s) => {
      if (!seen.has(s.name)) { seen.add(s.name); names.push(s.name); }
    }));
    return names;
  }, [roles]);

  return (
    <>
      <div className="detail-card">
        <div className="compare-head-row">
          <h3 className="detail-section-title" style={{ margin: 0 }}>
            <span className="compare-dot" /> Readiness Comparison
          </h3>
          <span className="compare-snapshot">Same evidence snapshot — {todayLabel()}</span>
        </div>

        <div className="compare-ring-grid" style={{ '--n': roles.length }}>
          {roles.map((r, i) => {
            const accent = COMPARE_ACCENTS[i % COMPARE_ACCENTS.length];
            const catStyle = categoryStyle(r.categoryKey);
            return (
              <div className="compare-ring-box" key={r.id}>
                <DashedRing value={r.readiness} color={accent} size={110} />
                <div className="compare-role-title">{r.title}</div>
                <div className="compare-role-meta">
                  {r.version && <span style={{ color: '#3b5fe0', fontWeight: 700 }}>{r.version}</span>} · <span style={{ color: catStyle.fg }}>{r.categoryLabel}</span>
                </div>
                <div className="rc-bar-track" style={{ marginTop: 10 }}>
                  <div className="rc-bar-fill" style={{ width: `${r.readiness ?? 0}%`, background: accent }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-card">
        <h3 className="detail-section-title">Skill Gap Breakdown</h3>
        {skillNames.length === 0 ? (
          <p style={{ color: '#97a0bd', fontSize: '0.88rem' }}>No skill data available for these roles yet.</p>
        ) : (
          <div className="gap-table" style={{ '--cols': roles.length }}>
            <div className="gap-row gap-head">
              <div className="gap-label">Skill</div>
              {roles.map((r) => <div className="gap-col-head" key={r.id}>{r.title}</div>)}
            </div>
            {skillNames.map((name) => (
              <div className="gap-row" key={name}>
                <div className="gap-label">{name}</div>
                {roles.map((r) => {
                  const s = r.skills.find((x) => x.name === name);
                  if (!s) return <div className="gap-col" key={r.id}>—</div>;
                  return (
                    <div className="gap-col" key={r.id}>
                      <div style={{ color: skillStatusColor(s), fontWeight: 700 }}>{s.current}/{s.required}</div>
                      {s.critical && <div className="gap-critical-tag">Critical</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* --------------------------------- Page --------------------------------- */

export default function CareerRoles({ user, onLogout, onNavigate }) {
  const [tab, setTab] = useState('browse'); // 'browse' | 'saved' | 'compare'
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [compareIds, setCompareIds] = useState([]);

  const [roles, setRoles] = useState([]);
  const [levelsBySkillId, setLevelsBySkillId] = useState({});
  const [status, setStatus] = useState('loading'); // 'loading' | 'error' | 'ready'
  const [loadError, setLoadError] = useState(null);

  const [detailsId, setDetailsId] = useState(null);
  const [detailsRole, setDetailsRole] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const loadCatalog = () => {
    setStatus('loading');
    setLoadError(null);
    loadCareerRolesCatalog()
      .then(({ roles: loaded, levelsBySkillId: levels }) => {
        setRoles(loaded);
        setLevelsBySkillId(levels);
        setStatus('ready');
      })
      .catch((err) => {
        setLoadError(err?.message || 'Could not load career roles.');
        setStatus('error');
      });
  };

  useEffect(() => {
    loadCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSave = (id) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Unsaving a role also drops it from any active comparison.
        setCompareIds((c) => c.filter((x) => x !== id));
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = useMemo(() => {
    const seen = new Map();
    roles.forEach((r) => {
      if (!seen.has(r.categoryKey)) seen.set(r.categoryKey, r.categoryLabel);
    });
    return [{ key: 'all', label: 'All' }, ...[...seen.entries()].map(([key, label]) => ({ key, label }))];
  }, [roles]);

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return roles.filter((r) => {
      const matchesCategory = category === 'all' || r.categoryKey === category;
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [roles, search, category]);

  const savedRoles = useMemo(() => roles.filter((r) => savedIds.has(r.id)), [roles, savedIds]);

  const compareRoles = useMemo(
    () => savedRoles.filter((r) => compareIds.includes(r.id)).slice(0, 3),
    [savedRoles, compareIds]
  );

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const openDetails = (id) => {
    setDetailsId(id);
    setDetailsRole(null);
    setDetailsError(null);
    setDetailsLoading(true);
    loadCareerRoleDetail(id, levelsBySkillId)
      .then((detail) => {
        setDetailsRole(detail);
        setDetailsLoading(false);
      })
      .catch((err) => {
        setDetailsError(err?.message || 'Could not load this role.');
        setDetailsLoading(false);
      });
  };

  const retryDetails = () => { if (detailsId) openDetails(detailsId); };

  return (
    <AppLayout
      active="roles"
      onNavigate={(key) => (NAV_ROUTES[key] ? onNavigate(key) : null)}
      user={user}
      onLogout={onLogout}
      readinessScore={67}
      roleLabel="Software Engineer"
    >
      <h1 className="cr-title">Career Roles</h1>
      <p className="cr-subtitle">Explore roles, understand requirements, and track your readiness.</p>

      {detailsId ? (
        <div className="cr-fade-in">
          <RoleDetailsPage
            role={detailsRole}
            loading={detailsLoading}
            error={detailsError}
            saved={savedIds.has(detailsId)}
            onToggleSave={toggleSave}
            onBack={() => setDetailsId(null)}
            onRetry={retryDetails}
          />
        </div>
      ) : (
        <>
          <div className="cr-tabs">
            <button type="button" className={`cr-tab${tab === 'browse' ? ' active' : ''}`} onClick={() => setTab('browse')}>
              Browse Roles
            </button>
            <button type="button" className={`cr-tab${tab === 'saved' ? ' active' : ''}`} onClick={() => setTab('saved')}>
              Saved Roles <span className="cr-tab-badge">{savedRoles.length}</span>
            </button>
            <button type="button" className={`cr-tab${tab === 'compare' ? ' active' : ''}`} onClick={() => setTab('compare')}>
              Compare Readiness
            </button>
          </div>

          {status === 'loading' && <LoadingCard text="Loading career roles…" />}
          {status === 'error' && <ErrorCard message={loadError} onRetry={loadCatalog} />}

          {status === 'ready' && tab === 'browse' && (
            <div className="cr-fade-in" key="browse">
              <div className="cr-filters-row">
                <div className="cr-search">
                  {Icon.search}
                  <input
                    placeholder="Search career roles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="cr-chip-row">
                  {categories.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className={`cr-chip${category === c.key ? ' active' : ''}`}
                      onClick={() => setCategory(c.key)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cr-grid">
                {filteredRoles.map((r, i) => (
                  <RoleCard
                    key={r.id}
                    role={r}
                    saved={savedIds.has(r.id)}
                    onToggleSave={toggleSave}
                    onViewDetails={openDetails}
                    style={{ animationDelay: `${Math.min(i, 10) * 60}ms` }}
                  />
                ))}
                {filteredRoles.length === 0 && (
                  <div className="cr-empty">No career roles match that search or filter.</div>
                )}
              </div>

              <SuggestedPanel roles={roles} onViewDetails={openDetails} />
            </div>
          )}

          {status === 'ready' && tab === 'saved' && (
            <div className="cr-fade-in" key="saved" style={{ marginTop: 20 }}>
              {savedRoles.length > 0 && (
                <div className="sr-head-row">
                  <span>{savedRoles.length} saved role{savedRoles.length === 1 ? '' : 's'}</span>
                  <button type="button" className="compare-cta-btn" onClick={() => setTab('compare')}>
                    {Icon.compare} Compare Readiness
                  </button>
                </div>
              )}
              <div className="sr-list">
                {savedRoles.map((r) => (
                  <SavedRoleRow key={r.id} role={r} onViewDetails={openDetails} onRemove={toggleSave} />
                ))}
                {savedRoles.length === 0 && (
                  <div className="cr-empty">
                    No saved roles yet. Bookmark a career role from Browse Roles to track and compare it here.
                  </div>
                )}
              </div>
            </div>
          )}

          {status === 'ready' && tab === 'compare' && (
            <div className="cr-fade-in" key="compare" style={{ marginTop: 20 }}>
              {savedRoles.length < 2 ? (
                <div className="cr-empty">
                  Save at least two career roles to compare your readiness side by side.
                </div>
              ) : (
                <>
                  <p className="cr-compare-hint">Select up to 3 saved roles to compare</p>
                  <div className="cr-chip-row" style={{ marginBottom: 20 }}>
                    {savedRoles.map((r) => {
                      const selected = compareIds.includes(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`cr-chip${selected ? ' active' : ''}`}
                          onClick={() => toggleCompare(r.id)}
                        >
                          {selected && <span style={{ marginRight: 6 }}>✓</span>}{r.title}
                        </button>
                      );
                    })}
                  </div>

                  {compareRoles.length < 2 ? (
                    <div className="cr-empty">Select at least 2 roles above to compare readiness scores.</div>
                  ) : (
                    <ComparePanel roles={compareRoles} />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
}
