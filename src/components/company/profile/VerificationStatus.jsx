import { BadgeCheck, Hourglass, ShieldX, ShieldAlert, RefreshCw, Lock } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

// Verification status indicator (US-COMP-04 BR-03 / AC-02). Text + icon,
// never colour alone; read-only — there is no control that changes it.
const META = {
  verified: { Icon: BadgeCheck, tone: 'green' },
  pending: { Icon: Hourglass, tone: 'amber' },
  rejected: { Icon: ShieldX, tone: 'red' },
  reverification_required: { Icon: ShieldAlert, tone: 'amber' },
  reverification_pending: { Icon: RefreshCw, tone: 'blue' },
};

function statusMeta(status) {
  return META[status] || META.pending;
}

export function StatusPill({ status, size = 'md' }) {
  const { t } = useCompanyI18n();
  const { Icon, tone } = statusMeta(status);
  return (
    <span className={`cw-pf-status is-${tone}${size === 'sm' ? ' sm' : ''}`} data-status={status}>
      <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2} aria-hidden="true" />
      {t(`company.pf.st.${status}`)}
    </span>
  );
}

export function ManagedHint({ id }) {
  const { t } = useCompanyI18n();
  return (
    <span className="cw-pf-managed" id={id}>
      <Lock size={12} strokeWidth={2} aria-hidden="true" />
      {t('company.pf.managedBy')}
    </span>
  );
}

/** Pill + "managed by SkillSpan" + what the status means. */
export default function VerificationStatus({ status, note, compact = false }) {
  const { t } = useCompanyI18n();
  const { tone } = statusMeta(status);
  return (
    <div className={`cw-pf-vs is-${tone}${compact ? ' compact' : ''}`} aria-label={t('company.pf.statusLabel')} role="group">
      <div className="cw-pf-vs-top">
        <span className="cw-pf-vs-l">{t('company.pf.statusLabel')}</span>
        <StatusPill status={status} />
        <ManagedHint />
      </div>
      {!compact && <p className="cw-pf-vs-d">{t(`company.pf.stDesc.${status}`)}</p>}
      {!compact && note && <p className="cw-pf-vs-note">{t(`company.pf.note.${note}`)}</p>}
    </div>
  );
}
