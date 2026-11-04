import { RefreshCw, ShieldAlert } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

/*
 * Re-verification notice (US-COMP-04 BR-09 / Scenario 5 / AC-10).
 *  variant 'fields' — before save: a verification-relevant field was changed
 *  variant 'document' — before replacing the trade license
 *  variant 'after'  — after save, the status moved to Pending re-verification
 * The policy is the backend's (reverification.policy, default "flag": the
 * Verified badge stays while the review runs). `message` = the server's
 * reverification.message, shown as sent when present.
 */
export default function ReverificationNotice({ variant = 'fields', fields = [], className = '', message = null }) {
  const { t, lang } = useCompanyI18n();
  const after = variant === 'after';
  const Icon = after ? RefreshCw : ShieldAlert;
  const list = fields.map((k) => t(`company.pf.f.${k}`)).join(lang === 'ar' ? '، ' : ', ');
  let body;
  if (after) body = message || t('company.pf.rv.afterBody');
  else if (variant === 'document') body = t('company.pf.rv.docBody');
  else body = t('company.pf.rv.body', { fields: list });
  return (
    <div className={`cw-pf-rv${after ? ' is-after' : ''} ${className}`} role="status" aria-live="polite">
      <span className="cw-pf-rv-ic"><Icon size={18} strokeWidth={1.9} aria-hidden="true" /></span>
      <div>
        <h3>{t(after ? 'company.pf.rv.afterTitle' : 'company.pf.rv.title')}</h3>
        <p>{body}</p>
      </div>
    </div>
  );
}
