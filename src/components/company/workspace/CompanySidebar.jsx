import { LayoutDashboard, FolderKanban, Users, UserSearch, Building2, Bell, FolderPlus, Plus, Settings, LogOut } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

// Company-facing navigation. Order and icons follow the approved design;
// "Talent Discovery" is kept because the app already ships that screen
// (Sprint 5 feature in the SRS, existing route /company/talent).
const COMPANY_NAV_ITEMS = [
  { key: 'dashboard', route: '/company/dashboard', labelKey: 'company.nav.dashboard', Icon: LayoutDashboard },
  { key: 'projects', route: '/company/projects', labelKey: 'company.nav.projects', Icon: FolderKanban, countKey: 'projects' },
  { key: 'applicants', route: '/company/applicants', labelKey: 'company.nav.applicants', Icon: Users, countKey: 'applicationsPending' },
  { key: 'talent', route: '/company/talent', labelKey: 'company.nav.talent', Icon: UserSearch },
  { key: 'profile', route: '/company/profile', labelKey: 'company.nav.profile', Icon: Building2 },
  { key: 'notifications', route: '/company/notifications', labelKey: 'company.nav.notifications', Icon: Bell, countKey: 'unreadNotifications' },
];

export default function CompanySidebar({ active, counts, onNavigate, onLogout, id, canPublish = true }) {
  const { t } = useCompanyI18n();
  return (
    <aside className="cw-side" id={id}>
      <div className="cw-side-inner">
        <div className="cw-side-lbl">{t('company.nav.section')}</div>
        <nav className="app-nav" aria-label={t('company.nav.label')}>
          {COMPANY_NAV_ITEMS.map(({ key, route, labelKey, Icon, countKey }) => {
            const count = countKey ? counts?.[countKey] : 0;
            const label = t(labelKey);
            return (
              <button
                key={key}
                type="button"
                title={label}
                className={`app-nav-item${active === key ? ' active' : ''}`}
                aria-current={active === key ? 'page' : undefined}
                onClick={() => onNavigate?.(route)}
              >
                <Icon className="cw-ic" size={19} strokeWidth={1.8} aria-hidden="true" />
                <span className="cw-nav-label">{label}</span>
                {count > 0 && <span className="cw-cnt">{count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="cw-grow" />

        {/* Hidden for a company with no projects yet: the dashboard's
            "Publish your first project" card is the call to action then. */}
        {/* hidden when permissions.can_publish_projects is false (US-COMP-03) */}
        {canPublish && !(counts && counts.projects === 0) && (
        <div className="cw-helpcard">
          <div className="cw-ib"><FolderPlus size={18} strokeWidth={1.8} aria-hidden="true" /></div>
          <div className="cw-t">{t('company.ws.newProjectTitle')}</div>
          <p>{t('company.ws.newProjectBody')}</p>
          {/* TODO(route, Sprint 4 US-PRJ-01): create-project screen. */}
          <button type="button" className="cw-bt" title={t('company.ws.publishProject')} onClick={() => onNavigate?.('/company/projects/new')}>
            <Plus size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>{t('company.ws.publishProject')}</span>
          </button>
        </div>
        )}

        <button type="button" className="cw-nav" title={t('company.nav.settings')} onClick={() => onNavigate?.('/company/settings')}>
          <Settings className="cw-ic" size={19} strokeWidth={1.8} aria-hidden="true" />
          <span className="cw-nav-label">{t('company.nav.settings')}</span>
        </button>
        <button type="button" className="cw-nav" title={t('company.logout')} onClick={onLogout}>
          <LogOut className="cw-ic cw-flip" size={19} strokeWidth={1.8} aria-hidden="true" />
          <span className="cw-nav-label">{t('company.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
