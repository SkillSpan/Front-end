import './Dashboard.css';

// Small inline icon set so we don't need an icon-font dependency.
const Icon = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  briefcase: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  matrix: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  ),
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" />
    </svg>
  ),
  folder: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  record: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 2h9l3 3v17H6z" /><path d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M9.5 20a2.5 2.5 0 0 0 5 0" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: Icon.grid },
  { key: 'roles', label: 'Career Roles', icon: Icon.briefcase },
  { key: 'skill-matrix', label: 'My Skill Matrix', icon: Icon.matrix },
  { key: 'evidence', label: 'Add Evidence', icon: Icon.plus },
  { key: 'projects', label: 'Projects', icon: Icon.folder },
  { key: 'record', label: 'My Record', icon: Icon.record },
];

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/**
 * Shared shell for the authenticated app: dark left nav + top bar.
 * `active` should be one of NAV_ITEMS[].key. `onNavigate(key)` is called
 * when a nav item is clicked - the parent (App.jsx routes) decides what
 * that means (there's no backend-driven page data yet for most of these,
 * so several are placeholders until their APIs exist).
 */
export default function AppLayout({ active, onNavigate, user, onLogout, readinessScore = 0, roleLabel = '', children }) {
  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <img className="brand-icon" src="/image/logo.png" alt="SkillSpan logo" />
          <span><span className="white">Skill</span><span className="blue">Span</span></span>
        </div>

        <ul className="app-nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                className={`app-nav-item${active === item.key ? ' active' : ''}`}
                onClick={() => onNavigate && onNavigate(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="app-sidebar-footer">
          <div className="footer-label">Readiness Score</div>
          <div className="footer-score">{readinessScore}/100</div>
          <div className="footer-role">{roleLabel}</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-search">
            {Icon.search}
            <input placeholder="Search skills, projects, resources..." />
          </div>
          <div className="app-topbar-right">
            <button type="button" className="app-bell" aria-label="Notifications">
              {Icon.bell}
              <span className="badge">2</span>
            </button>
            <div className="app-user">
              <span className="app-user-avatar">{initials(user?.name)}</span>
              <span className="app-user-name">{user?.name || 'Guest'}</span>
            </div>
            <button type="button" className="app-logout" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
