import { useState } from 'react';
import './Dashboard.css';

// A fresh `[]` default would give the prop a new identity on every render and
// make the sync below look like a change every time.
const EMPTY_NOTIFICATIONS = [];
import { markAllNotificationsRead, markNotificationRead, logoutUser, logoutAllDevices } from '../../api';
import LogoutModal from './LogoutModal';
import { useI18n } from '../../i18n/useI18n';

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
  support: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a8 8 0 1 1-3.2-6.4"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>,
  user: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
};

const NAV_ITEMS = [
  { key: 'dashboard', labelKey: 'nav.dashboard', icon: Icon.grid },
  { key: 'career-journey', labelKey: 'nav.careerJourney', icon: Icon.journey },
  { key: 'roles', labelKey: 'nav.roles', icon: Icon.briefcase },
  { key: 'skill-matrix', labelKey: 'nav.skillMatrix', icon: Icon.matrix },
  { key: 'evidence', labelKey: 'nav.evidence', icon: Icon.plus },
  { key: 'projects', labelKey: 'nav.projects', icon: Icon.folder },
  { key: 'record', labelKey: 'nav.record', icon: Icon.record },
  { key: 'assistant', labelKey: 'nav.assistant', icon: Icon.bolt },
  { key: 'support', labelKey: 'nav.support', icon: Icon.support },
  { key: 'profile', labelKey: 'nav.profile', icon: Icon.user },
  { key: 'mentor', labelKey: 'nav.mentor', icon: Icon.mentor },
  { key: 'talent', labelKey: 'nav.talent', icon: Icon.talent },
];

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

export default function AppLayout({
  active,
  onNavigate,
  user,
  avatarUrl = null,
  onLogout,
  readinessScore = 0,
  roleLabel = '',
  children,
  contentClassName = '',
  flushContent = false,
  notificationCount = 0,
  notifications = EMPTY_NOTIFICATIONS,
  supportWaiting = false,
  onRefreshNotifications,
}) {
  const { t } = useI18n();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [unreadCount, setUnreadCount] = useState(notificationCount);
  const [searchTerm, setSearchTerm] = useState('');

  // Logging out is destructive enough to deserve a confirmation: the button
  // sits right next to the user avatar in the top bar, and one stray click used
  // to end the session with no way back.
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  // Adopt a refreshed list from the shell. The old condition only copied the
  // very first payload (`localNotifications.length === 0`), so a second refresh
  // — a support reply, for instance — never reached the popover even though the
  // badge moved. Compared by signature, because the parent may hand over a new
  // array on every render.
  const incomingSignature = notifications.map((n) => `${n.id}:${n.is_read ? 1 : 0}`).join('|');
  const [appliedSignature, setAppliedSignature] = useState(incomingSignature);
  if (incomingSignature !== appliedSignature) {
    setAppliedSignature(incomingSignature);
    setLocalNotifications(notifications);
    setUnreadCount(notificationCount);
  }

  // A support reply is announced with the link `/support/requests/<id>`. The
  // Support view is one screen with the thread list inside it, so the id
  // collapses onto the nav key instead of becoming a dead route.
  const go = (key) => {
    const raw = String(key ?? '');
    const supportReply = /^support\/requests\/\d+$/.exec(raw);
    onNavigate?.(supportReply ? 'support' : raw);
  };

  // Revoke the token server-side, then let the shell clear the local session
  // and navigate. A 401 means the token was already dead — same end state, so
  // it is not surfaced. Mirrors the flow already used on the landing page.
  const handleConfirmLogout = async () => {
    setLogoutError('');
    try {
      await logoutUser();
    } catch (err) {
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    setLogoutOpen(false);
    onLogout?.();
  };

  const handleConfirmLogoutAllDevices = async () => {
    setLogoutError('');
    try {
      await logoutAllDevices();
    } catch (err) {
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    setLogoutOpen(false);
    onLogout?.();
  };

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
              <span className="nav-label">{t(item.labelKey)}</span>
              {/* Somebody replied in the support thread and is waiting for an
                  answer — visible without opening the bell. */}
              {item.key === 'support' && supportWaiting && (
                <span
                  className="ss-nav-waiting-dot"
                  role="img"
                  aria-label={t('topbar.supportWaiting')}
                />
              )}
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
              aria-label={t('topbar.search')}
              placeholder={t('topbar.search')}
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
                aria-label={t('topbar.notifications')}
                onClick={() => setNotificationsOpen((v) => !v)}
              >
                {Icon.bell}
                {unreadCount > 0 && <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <div className="app-notification-popover" role="dialog" aria-label="Notifications list">
                  <div className="notif-header">
                    <strong>{t('topbar.notifications')} ({unreadCount})</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ background: 'transparent', border: 'none', color: '#4f46e5', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
                      >
                        {t('topbar.markAllRead')}
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
                    <p style={{ margin: '8px 0', color: '#64748b', fontSize: '0.8rem' }}>{t('topbar.emptyNotifications')}</p>
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
              {Icon.bolt}<span>{t('topbar.assistant')}</span>
            </button>
            <button
              type="button"
              className="app-icon-btn"
              onClick={() => go('settings')}
              aria-label={t('topbar.settings')}
              title={t('topbar.settings')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <div className="app-user" onClick={() => go('profile')} title={t('topbar.viewProfile')}>
              {avatarUrl ? (
                <img className="app-user-avatar" src={avatarUrl} alt="" />
              ) : (
                <span className="app-user-avatar">{initials(user?.name || user?.full_name)}</span>
              )}
              <span className="app-user-name">{user?.name || user?.full_name || 'Learner'}</span>
            </div>
            <button type="button" className="app-logout" onClick={() => setLogoutOpen(true)}>{t('topbar.logout')}</button>
          </div>
        </header>

        <main className={`app-content ${flushContent ? 'app-content-flush' : ''} ${contentClassName}`.trim()}>
          {children}
        </main>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => { setLogoutOpen(false); setLogoutError(''); }}
        onConfirm={handleConfirmLogout}
        onConfirmAllDevices={handleConfirmLogoutAllDevices}
        error={logoutError}
      />
    </div>
  );
}
