import { useState } from 'react';
import './Dashboard.css';
import { markAllNotificationsRead, markNotificationRead } from '../../api';

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
  notifications = [],
  onRefreshNotifications,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const [searchTerm, setSearchTerm] = useState('');

  // Keep in sync with incoming props
  if (notifications !== localNotifications && notifications.length > 0 && localNotifications.length === 0) {
    setLocalNotifications(notifications);
  }
  if (notificationCount !== unreadCount && notificationCount > 0 && unreadCount === 0) {
    setUnreadCount(notificationCount);
  }

  const go = (key) => onNavigate?.(key);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      go(`projects?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setLocalNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      onRefreshNotifications?.();
    } catch {
      // Swallowed safely
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await markNotificationRead(notif.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setLocalNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));
      }
    } catch {
      // Ignore network error on read mark
    }
    setNotificationsOpen(false);
    if (notif.link) {
      if (notif.link.startsWith('/')) {
        const cleanKey = notif.link.replace(/^\//, '').split('?')[0];
        go(cleanKey);
      } else {
        window.location.href = notif.link;
      }
    } else {
      go('record');
    }
  };

  const isItemActive = (itemKey) => {
    if (active === itemKey) return true;
    if ((active === 'career-roles' || active === 'roles') && (itemKey === 'roles' || itemKey === 'career-roles')) return true;
    if (active === 'evidence' && itemKey === 'evidence') return true;
    if (active === 'record' && itemKey === 'record') return true;
    return false;
  };

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
              className={`app-nav-item${isItemActive(item.key) ? ' active' : ''}`}
              onClick={() => go(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer" onClick={() => go('career-journey')} style={{ cursor: 'pointer' }}>
          <div className="footer-label">Readiness Score</div>
          <div className="footer-score">{readinessScore}/100</div>
          <div className="footer-role">{roleLabel || 'Career profile'}</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-search">
            {Icon.search}
            <input
              aria-label="Search"
              placeholder="Search skills, projects, resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </div>
          <div className="app-topbar-right">
            <div className="app-notification-wrap">
              <button
                type="button"
                className="app-bell"
                aria-label="Notifications"
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                {Icon.bell}
                {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="app-notification-popover" role="dialog" aria-label="Notifications list">
                  <div className="notif-header">
                    <strong>Notifications ({unreadCount})</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {localNotifications && localNotifications.length > 0 ? (
                    <div className="notif-list" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {localNotifications.slice(0, 6).map((n) => (
                        <div
                          key={n.id}
                          className={`notif-item${!n.is_read ? ' unread' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="notif-title">{n.title || 'Notification'}</div>
                          <div className="notif-body">{n.body || ''}</div>
                          {n.created_at && (
                            <div className="notif-time">{new Date(n.created_at).toLocaleDateString()}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.8rem' }}>No new notifications to review.</p>
                  )}
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f2f9', display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => { setNotificationsOpen(false); go('record'); }}>
                      Open My Record →
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button type="button" className="app-assistant-top" onClick={() => go('assistant')}>
              {Icon.bolt}<span>Assistant</span>
            </button>
            <div className="app-user" onClick={() => go('career-journey')} title="View profile & journey">
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
