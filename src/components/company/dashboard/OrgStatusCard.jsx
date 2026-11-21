import { BadgeCheck, Hourglass, ArrowRight, ShieldCheck, Check, CircleHelp } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from './format';

// Section 1 — Organization Status (US-COMP-03): name, verification status,
// profile completeness + missing fields, link to the Organization Profile.
export default function OrgStatusCard({ organization: org, onNavigate }) {
  const { t, lang } = useCompanyI18n();
  const verified = org.verification_status === 'verified';
  const profile = org.profile;
  const missing = profile ? profile.fields.filter((f) => !f.done) : [];

  return (
    <section className="cw-hero" aria-labelledby="cw-org-title">
      <div className="cw-idrow">
        <div className="cw-orglogo" aria-hidden="true">{org.initials}</div>
        <div>
          <div className="cw-k">{t('company.ws.orgStatus')}</div>
          <h3 id="cw-org-title">
            {org.name}
            <span className={`cw-vchip${verified ? '' : ' pend'}`}>
              {verified ? <BadgeCheck size={14} strokeWidth={2} aria-hidden="true" /> : <Hourglass size={14} strokeWidth={2} aria-hidden="true" />}
              {t(`company.status.${org.verification_status}`)}
            </span>
          </h3>
          <div className="cw-meta">
            {org.industry && <span>{org.industry}</span>}
            {org.industry && verified && org.verified_at && <i>•</i>}
            {verified && org.verified_at && <span>{t('company.ws.verifiedOn', { date: formatDate(org.verified_at, lang) })}</span>}
          </div>
        </div>
        <button type="button" className="cw-btn sm glass" onClick={() => onNavigate?.('/company/profile')}>
          {t('company.ws.viewProfile')} <ArrowRight className="cw-flip" size={15} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <div className="cw-stats">
        <div className="cw-stat">
          <div className="cw-l">{t('company.ws.verificationStatus')}</div>
          <div className={`cw-v${verified ? '' : ' pend'}`}>
            {verified ? <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" /> : <Hourglass size={18} strokeWidth={1.8} aria-hidden="true" />}
            {verified ? t('company.ws.approved') : t('company.ws.underReview')}
          </div>
          <div className="cw-steps">
            {org.verification_steps.map((step) => (
              <div key={step}>
                <span className="cw-ok"><Check size={11} strokeWidth={2.6} aria-hidden="true" /></span>
                {t(`company.ws.step.${step}`)}
              </div>
            ))}
          </div>
        </div>

        {profile && (
          <div className="cw-stat">
            <div className="cw-stat-head">
              <div className="cw-l">{t('company.ws.completeness')}</div>
              <b>{profile.completeness}%</b>
            </div>
            <div className="cw-pbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profile.completeness} aria-label={t('company.ws.completeness')}>
              <i style={{ width: `${profile.completeness}%` }} />
            </div>
            <div className="cw-fchips">
              {profile.fields.map((f) => (
                <span key={f.key} className={`cw-fchip${f.done ? '' : ' miss'}`}>
                  {f.done ? <Check size={12} strokeWidth={2.4} aria-hidden="true" /> : <CircleHelp size={12} strokeWidth={2} aria-hidden="true" />}
                  {t(`company.ws.field.${f.key}`)}
                </span>
              ))}
            </div>
            <div className="cw-stat-foot">
              <span>
                {missing.length === 0
                  ? t('company.ws.profileComplete')
                  : missing.length === 1
                    ? t('company.ws.fieldMissing')
                    : t('company.ws.fieldsMissing', { n: missing.length })}
              </span>
              {missing.length > 0 && (
                <button type="button" className="cw-link" onClick={() => onNavigate?.('/company/profile')}>
                  {t('company.ws.completeProfile')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
