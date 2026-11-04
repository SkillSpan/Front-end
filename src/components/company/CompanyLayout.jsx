import { useState } from 'react';
import '../dashboard/Dashboard.css';
import './company.css';
import LogoutModal from '../dashboard/LogoutModal';
import { logoutUser, logoutAllDevices } from '../../api';
import { useI18n } from '../../i18n/useI18n';

const Icon = {
  grid: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  talent: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 20v-1.5a4.5 4.5 0 0 0-9 0V20" />
      <circle cx="11.5" cy="8" r="3.5" />
      <path d="M17 7a3 3 0 0 1 0 6M19 20v-1.5a4.5 4.5 0 0 0-2.5-4" />
    </svg>
  ),
  building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h3a1 1 0 0 1 1 1v11M8 7h4M8 11h4M8 15h4M2 21h20" />
    </svg>
  ),
};

// Company-facing navigation. The keys double as route segments so the shell
// can hand `onNavigate` a full path without a lookup table.
const NAV_ITEMS = [
  { key: 'dashboard', route: '/company/dashboard', labelKey: 'company.nav.dashboard', icon: Icon.grid },
  { key: 'talent', route: '/company/talent', labelKey: 'company.nav.talent', icon: Icon.talent },
  { key: 'profile', route: '/company/profile', labelKey: 'company.nav.profile', icon: Icon.building },
];

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/**
 * The authenticated shell for company accounts: a sidebar, a top bar with the
 * organization identity, and the page body.
 *
 * It deliberately reuses the `.app-*` classes from Dashboard.css so the
 * company area looks like the learner workspace instead of introducing a
 * second visual language. The learner sidebar is not reused directly because
 * its 12 items are all learner-only and every one of them would 403 here.
 */
export default function CompanyLayout({
  active,
  onNavigate,
  user,
  organization,
  onLogout,
  children,
}) {
  const { t } = useI18n();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const orgName = organization?.name || user?.organizations?.[0]?.name || '';
  const displayName = user?.name || user?.full_name || orgName || 'Company';

  const handleConfirmLogout = async () => {
    setLogoutError('');
    try {
      await logoutUser();
    } catch (err) {
      // A 401 means the token was already dead — same end state, so it is not
      // surfaced. Mirrors the learner shell.
      if (err?.status && err.status !== 401) {
        setLogoutError(err.message || 'Something went wrong while logging out. Please try again.');
        return;
      }
    }
    setLogoutOpen(false);
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
    onLogout?.();
  };

  return (
    <div className="app-shell company-shell">
      <aside className="app-sidebar">
        <button
          type="button"
          className="app-sidebar-brand"
          onClick={() => onNavigate?.('/company/dashboard')}
          aria-label={t('company.nav.dashboard')}
        >
          <img className="brand-icon" src="/image/logo.png" alt="SkillSpan logo" />
          <span>
            <span className="white">Skill</span>
            <span className="blue">Span</span>
          </span>
        </button>

        <nav className="app-nav" aria-label={t('company.nav.label')}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`app-nav-item${active === item.key ? ' active' : ''}`}
              onClick={() => onNavigate?.(item.route)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{t(item.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer company-sidebar-org">
          <div className="footer-label">{t('company.sidebar.organization')}</div>
          <div className="footer-score company-org-name">{orgName || '—'}</div>
          <div className="footer-role">
            {organization?.verification_status
              ? t(`company.status.${organization.verification_status}`)
              : t('company.sidebar.companyAccount')}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="company-topbar-title">
            <span className="company-topbar-eyebrow">{t('company.topbar.workspace')}</span>
            <strong>{orgName || displayName}</strong>
          </div>
          <div className="app-topbar-right">
            <div className="app-user">
              <span className="app-user-avatar">{initials(displayName)}</span>
              <span className="app-user-name">{displayName}</span>
            </div>
            <button type="button" className="app-logout" onClick={() => setLogoutOpen(true)}>
              {t('company.logout')}
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
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
