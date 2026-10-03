import { useState } from 'react';
import './Dashboard.css';

const Icon = {
  grid: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  briefcase: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  matrix: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>,
  folder: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  record: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2h9l3 3v17H6z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>,
  journey: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 17c3-1 4-5 5-7s2-4 3-4"/></svg>,
  bolt: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m13 2-9 12h7l-1 8 9-12h-7z"/></svg>,
  mentor: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 5.8M18 15c1.8.7 3 2.1 3 5"/></svg>,
  talent: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 20v-1.5a4.5 4.5 0 0 0-9 0V20"/><circle cx="11.5" cy="8" r="3.5"/><path d="M17 7a3 3 0 0 1 0 6M19 20v-1.5a4.5 4.5 0 0 0-2.5-4"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  bell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M9.5 20a2.5 2.5 0 0 0 5 0"/></svg>,
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: Icon.grid },
  { key: 'career-journey', label: 'Career Journey', icon: Icon.journey },
  { key: 'roles', label: 'Career Roles', icon: Icon.briefcase },
  { key: 'skill-matrix', label: 'My Skill Matrix', icon: Icon.matrix },
  { key: 'evidence', label: 'Add Evidence', icon: Icon.plus },
  { key: 'projects', label: 'Projects', icon: Icon.folder },
  { key: 'record', label: 'My Record', icon: Icon.record },
  { key: 'assistant', label: 'AI Assistant', icon: Icon.bolt },
  { key: 'mentor', label: 'Mentoring', icon: Icon.mentor },
  { key: 'talent', label: 'Talent', icon: Icon.talent },
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function AppLayout({
  active,
  onNavigate,
  user,
  onLogout,
  readinessScore = 0,
  roleLabel = '',
  children,
  contentClassName = '',
  flushContent = false,
  notificationCount = 0,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const go = (key) => onNavigate?.(key);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <button type="button" className="app-sidebar-brand" onClick={() => go('dashboard')} aria-label="Go to dashboard">
          <img className="brand-icon" src="/image/logo.png" alt="SkillSpan logo" />
          <span><span className="white">Skill</span><span className="blue">Span</span></span>
        </button>

        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`app-nav-item${active === item.key ? ' active' : ''}`}
              onClick={() => go(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="footer-label">Readiness Score</div>
          <div className="footer-score">{readinessScore}/100</div>
          <div className="footer-role">{roleLabel || 'Career profile'}</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-search">
            {Icon.search}
            <input aria-label="Search" placeholder="Search skills, projects, resources..." />
          </div>
          <div className="app-topbar-right">
            <div className="app-notification-wrap">
              <button type="button" className="app-bell" aria-label="Notifications" onClick={() => setNotificationsOpen((v) => !v)}>
                {Icon.bell}
                {notificationCount > 0 && <span className="badge">{notificationCount > 9 ? '9+' : notificationCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="app-notification-popover">
                  <strong>Notifications</strong>
                  <p>No new notifications to review.</p>
                  <button type="button" onClick={() => { setNotificationsOpen(false); go('record'); }}>Open My Record</button>
                </div>
              )}
            </div>
            <button type="button" className="app-assistant-top" onClick={() => go('assistant')}>
              {Icon.bolt}<span>Assistant</span>
            </button>
            <div className="app-user">
              <span className="app-user-avatar">{initials(user?.name || user?.full_name)}</span>
              <span className="app-user-name">{user?.name || user?.full_name || 'Learner'}</span>
            </div>
            <button type="button" className="app-logout" onClick={onLogout}>Log out</button>
          </div>
        </header>

        <main className={`app-content ${flushContent ? 'app-content-flush' : ''} ${contentClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>
  );
}
