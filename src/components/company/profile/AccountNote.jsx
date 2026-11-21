import { UserCog, ArrowRight } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

// BR-11: representative account details are not edited in the organization profile.
export default function AccountNote({ onNavigate }) {
  const { t } = useCompanyI18n();
  return (
    <section className="cw-card cw-pf-acc" aria-labelledby="cw-pf-acc-t">
      <span className="cw-pf-sec-ic"><UserCog size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      <div>
        <h2 id="cw-pf-acc-t">{t('company.pf.acc.title')}</h2>
        <p className="cw-pf-muted">{t('company.pf.acc.body')}</p>
        <button type="button" className="cw-link" onClick={() => onNavigate?.('/company/settings')}>
          {t('company.pf.acc.link')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
