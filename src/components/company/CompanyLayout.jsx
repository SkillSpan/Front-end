import { useEffect, useState } from 'react';
import '../dashboard/Dashboard.css';
import './company.css';
import './workspace/companyWorkspace.css';
import LogoutModal from '../dashboard/LogoutModal';
import { logoutUser, logoutAllDevices } from '../../api';
import { useCompanyI18n } from './useCompanyI18n';
import CompanySidebar from './workspace/CompanySidebar';
import CompanyTopbar from './workspace/CompanyTopbar';
import { unreadStore, useUnreadCount } from './dashboard/unreadStore';
import { DASHBOARD_KEYS, fetchUnreadCount } from './dashboard/companyDashboardApi';
import { fetchQuery } from '../../cache/queryCache';

/**
 * The authenticated shell for company accounts — navy top bar + navy
 * sidebar, as in the approved company-dashboard design. Same props as
 * before, so App.jsx and the existing pages (Talent, Profile) keep working.
 *
 * `counts` (optional): { projects, applicationsPending, unreadNotifications }
 * for the sidebar badges and the bell — data.counts of
 * GET /api/v1/company/dashboard (US-COMP-03), passed up by the dashboard.
 * `live` (true outside preview builds): on pages that do not load the
 * notifications themselves (e.g. Organization Profile) the bell asks
 * GET /api/v1/notifications/unread-count once (cached, src/cache).
 */
export default function CompanyLayout({
  active,
  onNavigate,
  user,
  organization,
  onLogout,
  counts,
  live = false,
  canPublish = true,
  titleKey,
  children,
}) {
  const { t, dir } = useCompanyI18n();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const orgName = organization?.name || user?.organizations?.[0]?.name || '';
  const displayName = user?.name || user?.full_name || orgName || 'Company';
  const status = organization?.verification_status || null;
  // Bell + sidebar badge read the shared unread count (kept in step by the
  // dashboard panel and the Notification History page); `counts` is the fallback.
  const unread = useUnreadCount(counts?.unreadNotifications || 0);
  const navCounts = { ...(counts || {}), unreadNotifications: unread };
  const hasCounts = Boolean(counts);

  // Topbar bell outside the dashboard / notification pages (NOT-04).
  useEffect(() => {
    if (!live || unreadStore.get() != null) return;
    fetchQuery(DASHBOARD_KEYS.unreadCount, () => fetchUnreadCount())
      .then((n) => { if (unreadStore.get() == null) unreadStore.set(n); })
      .catch(() => {}); // 401 is handled by api.js; the bell just stays at the fallback
  }, [live]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const go = (route) => {
    setMenuOpen(false);
    onNavigate?.(route);
  };

  const handleConfirmLogout = async () => {
    setLogoutError('');
    try {
      await logoutUser();
    } catch (err) {
      // A 401 means the token was already dead — same end state.
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    setLogoutOpen(false);
    unreadStore.reset();
    onLogout?.();
  };

  const handleConfirmLogoutAll = async () => {
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
    unreadStore.reset();
    onLogout?.();
  };

  return (
    <div className="cw company-shell" dir={dir}>
      <div className={`cw-app${menuOpen ? ' is-menu-open' : ''}`}>
        <CompanyTopbar
          orgName={orgName || displayName}
          status={status}
          pageTitle={t(titleKey || `company.nav.${active}`)}
          displayName={displayName}
          unread={unread}
          menuOpen={menuOpen}
          menuId="company-sidebar"
          onToggleMenu={() => setMenuOpen((v) => !v)}
          onNavigate={go}
          onLogout={() => { setMenuOpen(false); setLogoutOpen(true); }}
        />
        <CompanySidebar
          id="company-sidebar"
          active={active}
          counts={hasCounts ? navCounts : (unread ? { unreadNotifications: unread } : counts)}
          onNavigate={go}
          canPublish={canPublish}
          onLogout={() => { setMenuOpen(false); setLogoutOpen(true); }}
        />
        <div className="cw-scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" />
        <main className="cw-main">{children}</main>
      </div>

      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => {
          setLogoutOpen(false);
          setLogoutError('');
        }}
        onConfirm={handleConfirmLogout}
        onConfirmAllDevices={handleConfirmLogoutAll}
        error={logoutError}
      />
    </div>
  );
}
