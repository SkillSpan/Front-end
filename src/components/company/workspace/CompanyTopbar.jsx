import { Building2, Bell, Menu, X, BadgeCheck, Hourglass, ShieldX, RefreshCw, ShieldAlert, Settings, LogOut } from 'lucide-react';
import UserMenu from '../../common/UserMenu';
import { useCompanyI18n } from '../useCompanyI18n';
import SkillSpanMark from './SkillSpanMark';

export default function CompanyTopbar({
  orgName, status, pageTitle, displayName, unread = 0,
  menuOpen, onToggleMenu, onNavigate, onLogout, menuId,
}) {
  const { t, lang } = useCompanyI18n();
  const StatusIcon = { verified: BadgeCheck, rejected: ShieldX, reverification_pending: RefreshCw, reverification_required: ShieldAlert }[status] || Hourglass;

  return (
    <header className="cw-top">
      <button
        type="button"
        className="cw-iconbtn cw-menu-btn"
        aria-label={menuOpen ? t('company.nav.closeMenu') : t('company.nav.openMenu')}
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onClick={onToggleMenu}
      >
        {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      <button type="button" className="cw-brand" onClick={() => onNavigate?.('/company/dashboard')} aria-label="SkillSpan">
        <SkillSpanMark />
      </button>

      <div className="cw-crumb">
        <Building2 size={15} strokeWidth={1.8} aria-hidden="true" />
        <span>{orgName}</span>
        {status && (
          <span className={`cw-crumb-status is-${status}`}>
            <StatusIcon size={12} strokeWidth={2} aria-hidden="true" />
            {t(`company.status.${status}`)}
          </span>
        )}
        <span className="cw-crumb-sep">/</span>
        <strong>{pageTitle}</strong>
      </div>

      <div className="cw-sp" />


      <button type="button" className="cw-iconbtn" aria-label={t('company.ws.notifications')} onClick={() => onNavigate?.('/company/notifications')}>
        <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
        {unread > 0 && <span className="cw-dot">{unread}</span>}
      </button>

      <UserMenu
        className="cw-um"
        name={displayName}
        role={t('company.ws.representative')}
        closeKey={pageTitle}
        menuLabel={lang === 'ar' ? 'قائمة الحساب' : 'Account menu'}
        items={[
          { key: 'profile', label: t('company.nav.profile'), Icon: Building2, onSelect: () => onNavigate?.('/company/profile') },
          { key: 'settings', label: t('company.nav.settings'), Icon: Settings, onSelect: () => onNavigate?.('/company/settings') },
          { key: 'logout', label: t('company.logout'), Icon: LogOut, danger: true, onSelect: () => onLogout?.() },
        ]}
      />
    </header>
  );
}
