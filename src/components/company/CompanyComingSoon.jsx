import { Hammer, ArrowRight } from 'lucide-react';
import './workspace/companyWorkspace.css';
import { useCompanyI18n } from './useCompanyI18n';
import EmptyState from './dashboard/EmptyState';

// Placeholder for the sidebar items whose screens are later Sprint 4
// stories (Projects, Applicants, Notifications, Settings), so the
// navigation never lands on a blank page.
export default function CompanyComingSoon({ onNavigate }) {
  const { t } = useCompanyI18n();
  return (
    <div className="cw-dash cw-card" style={{ padding: '48px 24px' }}>
      <EmptyState
        icon={Hammer}
        title={t('company.ws.comingSoon')}
        body={t('company.ws.comingSoonBody')}
        action={(
          <button type="button" className="cw-btn ghost" onClick={() => onNavigate?.('/company/dashboard')}>
            {t('company.ws.backToDashboard')} <ArrowRight className="cw-flip" size={15} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      />
    </div>
  );
}
