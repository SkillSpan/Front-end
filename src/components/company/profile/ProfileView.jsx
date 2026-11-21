import { Building2, MapPin, Phone, Pencil, CircleCheck, X, RotateCcw } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { PROFILE_FIELDS, PROFILE_SECTIONS } from './profileFields';
import { useOptionLabel } from './profileOptions';
import { formatDay } from './profileFormat';
import VerificationStatus from './VerificationStatus';
import CompletenessCard from './CompletenessCard';
import ReverificationNotice from './ReverificationNotice';
import AccountNote from './AccountNote';
import { logoUrl } from './companyProfileApi';

const SECTION_ICONS = { info: Building2, location: MapPin, contact: Phone };

function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '—';
}

function Value({ field, value }) {
  const { t } = useCompanyI18n();
  const optionLabel = useOptionLabel();
  if (!value) return <span className="cw-pf-empty">{t('company.pf.notProvided')}</span>;
  if (field.control === 'select') return optionLabel(field, value);
  if (field.format === 'url') {
    return <a href={value} target="_blank" rel="noopener noreferrer" dir="ltr">{value.replace(/^https?:\/\//, '')}</a>;
  }
  if (field.format === 'email') return <a href={`mailto:${value}`} dir="ltr">{value}</a>;
  if (field.format === 'phone') return <a href={`tel:${value.replace(/[^\d+]/g, '')}`} dir="ltr">{value}</a>;
  return <span dir="auto">{value}</span>;
}

/**
 * Organization Profile view (US-COMP-04 Scenario 1, AC-01/02/09).
 */
export default function ProfileView({
  profile, preview, previewState: _previewState, flash, onDismissFlash, onEdit, onPick, onProfileChange: _onProfileChange, onNavigate, onReset,
}) {
  const { t, lang } = useCompanyI18n();
  const optionLabel = useOptionLabel();
  const v = profile.values;
  // A missing GROUP marks its empty fields with "Add" (m.fields); a field-level item marks itself.
  const missingKeys = new Set(profile.completeness.missing.flatMap((m) => m.fields || [m.key]));
  const logo = logoUrl(profile.logo);
  // US-COMP-04 guide: a new review is the `reverification` object (the badge stays Verified).
  const reverification = profile.reverification?.required ? profile.reverification : null;
  const typeField = PROFILE_FIELDS.find((f) => f.key === 'organizationType');
  const industryField = PROFILE_FIELDS.find((f) => f.key === 'industry');
  const meta = [optionLabel(typeField, v.organizationType), optionLabel(industryField, v.industry), [v.city, v.country].filter(Boolean).join(lang === 'ar' ? '، ' : ', ')].filter(Boolean);

  return (
    <div className="cw-pf" style={{ display: 'contents' }}>
      {preview && (
        <div className="cw-pf-samplebar">
          <span className="cw-sample">{t('company.ws.sampleBanner')}</span>
          <button type="button" className="cw-pf-reset" onClick={onReset}>
            <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />{t('company.pf.reset')}
          </button>
        </div>
      )}

      {flash?.saved && (
        <div className="cw-pf-toast" role="status">
          <span className="cw-pf-toast-ic"><CircleCheck size={18} strokeWidth={2} aria-hidden="true" /></span>
          <div>
            <h3>{t('company.pf.saved')}</h3>
            <p>{t('company.pf.savedBody', { n: profile.completeness.percent })}</p>
          </div>
          <button type="button" className="cw-iconbtn cw-pf-toast-x" aria-label={t('company.pf.dismiss')} onClick={onDismissFlash}>
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
      {(reverification || (flash?.reverification && profile.verificationStatus === 'reverification_pending')) && (
        <ReverificationNotice variant="after" message={reverification?.message} />
      )}

      <div className="cw-ph">
        <div>
          <h1>{t('company.pf.title')}</h1>
          <p>{t('company.pf.sub')}</p>
        </div>
        <div className="cw-ph-actions">
          <button type="button" className="cw-btn pri" onClick={() => onEdit?.()}>
            <Pencil size={15} strokeWidth={2} aria-hidden="true" />{t('company.pf.edit')}
          </button>
        </div>
      </div>

      <section className="cw-card cw-pf-id" aria-labelledby="cw-pf-name">
        <div className="cw-pf-id-main">
          {/* "logo" is part of GET /profile/me (null today). TODO(api): no logo
              upload endpoint is listed in the US-COMP-04 guide — the UI only
              shows a logo the server sends; initials otherwise. */}
          <div className="cw-pf-logo" aria-hidden="true">
            {logo ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : initials(v.companyName)}
          </div>
          <div className="cw-pf-id-txt">
            <h2 id="cw-pf-name" dir="auto">{v.companyName || t('company.pf.notProvided')}</h2>
            {meta.length > 0 && (
              <div className="cw-pf-id-meta">
                {meta.map((m, i) => (<span key={m}>{i > 0 && <i aria-hidden="true">•</i>}{m}</span>))}
              </div>
            )}
            <div className="cw-pf-id-dates">
              {profile.verificationStatus === 'verified' && profile.verifiedAt && <span>{t('company.pf.verifiedOn', { date: formatDay(profile.verifiedAt, lang) })}</span>}
              {profile.updatedAt && <span>{t('company.pf.updatedOn', { date: formatDay(profile.updatedAt, lang) })}</span>}
            </div>
          </div>
        </div>
        <VerificationStatus status={profile.verificationStatus} note={profile.verificationNote} />
      </section>

      <div className="cw-grid cw-pf-grid">
        <div className="cw-pf-col">
          {PROFILE_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section];
            const fields = PROFILE_FIELDS.filter((f) => f.section === section);
            return (
              <section key={section} className="cw-card cw-pf-sec" aria-labelledby={`cw-pf-sec-${section}`}>
                <div className="cw-pf-sec-h">
                  <span className="cw-pf-sec-ic"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                  <div>
                    <h2 id={`cw-pf-sec-${section}`}>{t(`company.pf.sec.${section}`)}</h2>
                    <p className="cw-pf-muted">{t(`company.pf.sec.${section}Sub`)}</p>
                  </div>
                  <button type="button" className="cw-link cw-pf-sec-edit" onClick={() => onPick?.(fields[0].key)}>
                    <Pencil size={13} strokeWidth={2} aria-hidden="true" />{t('company.pf.editShort')}
                    <span className="cw-vh"> — {t(`company.pf.sec.${section}`)}</span>
                  </button>
                </div>
                <dl className="cw-pf-dl">
                  {fields.map((f) => (
                    <div key={f.key} className={f.wide ? 'wide' : undefined}>
                      <dt>{t(`company.pf.f.${f.key}`)}</dt>
                      <dd>
                        <Value field={f} value={v[f.key]} />
                        {!v[f.key] && missingKeys.has(f.key) && (
                          <button type="button" className="cw-pf-add" onClick={() => onPick?.(f.key)}>
                            {t('company.pf.cmp.add')}<span className="cw-vh"> — {t(`company.pf.f.${f.key}`)}</span>
                          </button>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
        <aside className="cw-pf-col cw-pf-side">
          <CompletenessCard completeness={profile.completeness} onPick={onPick} />
          <AccountNote onNavigate={onNavigate} />
        </aside>
      </div>
    </div>
  );
}
