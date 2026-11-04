import { ShieldAlert, ArrowRight, Mail } from 'lucide-react';
import './workspace/companyWorkspace.css';
import { useCompanyI18n } from './useCompanyI18n';
import EmptyState from './dashboard/EmptyState';

// 403 from a company endpoint for an organization that is not pending
// (US-COMP-03 Scenario 5): nothing of the company's data is shown, only what
// happened and where to go. A pending organization is sent to /company/pending
// instead (see classifyCompanyError in dashboard/companyDashboardApi.js).
export default function CompanyAccessDenied({ onNavigate, supportEmail = 'support@skillspan.com' }) {
  const { t } = useCompanyI18n();
  return (
    <div className="cw-dash cw-card cw-denied" role="alert">
      <EmptyState
        icon={ShieldAlert}
        title={t('company.denied.title')}
        body={t('company.denied.body')}
        action={(
          <div className="cw-denied-actions">
            <button type="button" className="cw-btn pri" onClick={() => onNavigate?.('/company/login')}>
              {t('company.denied.signIn')} <ArrowRight className="cw-flip" size={15} strokeWidth={2} aria-hidden="true" />
            </button>
            <a className="cw-btn sec" href={`mailto:${supportEmail}`}>
              <Mail size={15} strokeWidth={1.8} aria-hidden="true" /> {t('company.denied.support')}
            </a>
          </div>
        )}
      />
    </div>
  );
}
