import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, CircleAlert, LoaderCircle, Save } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import {
  FIELD_BY_KEY,
  PROFILE_FIELDS,
  PROFILE_SECTIONS,
  changedFields,
  changedVerificationFields,
  computeCompleteness,
  validateProfile,
} from './profileFields';
import { isValidationError, mapServerErrors, updateProfile } from './companyProfileApi';
import { SAMPLE_422, SAMPLE_INVALID_VALUES } from './companyProfileMock';
import ProfileField from './ProfileFields.jsx';
import { errorText } from './profileOptions';
import CompletenessCard from './CompletenessCard';
import ReverificationNotice from './ReverificationNotice';
import VerificationStatus from './VerificationStatus';
import AccountNote from './AccountNote';
import DiscardDialog from './DiscardDialog';

const SECTION_ICONS = { info: Building2, location: MapPin, contact: Phone };

function initialValues(profile, previewState) {
  if (previewState === 'errors') return { ...SAMPLE_INVALID_VALUES };
  if (previewState === 'reverify') return { ...profile.values, companyName: 'Nova Tech Solutions' };
  return { ...profile.values };
}

function initialErrors(previewState) {
  if (previewState === 'errors') return mapServerErrors(SAMPLE_422).fieldErrors;
  return {};
}

/**
 * Organization Profile edit form (US-COMP-04 Scenario 2/3/5).
 *  - client validation of required fields + email/website/phone formats (AC-04)
 *  - 422 field errors from the server shown inline; nothing typed is lost (AC-05)
 *  - error summary on submit, each entry focuses its field
 *  - re-verification notice as soon as a verification-relevant field changes (AC-10)
 *  - Save disabled while saving; Cancel asks first when there are changes
 *  - verification status is shown read-only, never part of the payload (BR-03)
 *  - representative account details are not here (BR-11)
 */
export default function ProfileEditForm({ profile, preview, previewState, onSaved, onCancel, onProfileChange, onNavigate }) {
  const { t } = useCompanyI18n();
  const [params] = useSearchParams();
  const focusKey = params.get('focus');
  const [values, setValues] = useState(() => initialValues(profile, previewState));
  const [errors, setErrors] = useState(() => initialErrors(previewState));
  const [submitted, setSubmitted] = useState(previewState === 'errors');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const refs = useRef({});
  const summaryRef = useRef(null);

  const saved = profile.values;
  const dirty = changedFields(values, saved).length > 0;
  const relevant = changedVerificationFields(values, saved);
  // Server value until something is edited; then an estimate over the
  // server's own groups (profile_fields), recalculated by the server on save.
  const liveCompleteness = useMemo(
    () => (dirty || !profile.completeness?.server
      ? computeCompleteness(values, profile.documents, profile.completeness?.groups)
      : profile.completeness),
    [dirty, values, profile.documents, profile.completeness],
  );
  const errorKeys = PROFILE_FIELDS.map((f) => f.key).filter((k) => errors[k]);

  const focusField = (key) => {
    if (key.startsWith('doc:')) {
      document.getElementById(`pf-doc-${key.slice(4)}`)?.focus();
      return;
    }
    const el = refs.current[key];
    if (el) {
      el.focus();
      if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (focusKey && !focusKey.startsWith('doc:')) {
      const id = setTimeout(() => focusField(focusKey), 60);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [focusKey]);

  const onChange = (key, v) => {
    setValues((s) => ({ ...s, [key]: v }));
    setFormError('');
    if (errors[key] || submitted) {
      const all = validateProfile({ ...values, [key]: v });
      // Email/phone share one rule (PROFILE_CONTACT_REQUIRED): refresh both.
      const keys = key === 'contactEmail' || key === 'contactPhone' ? ['contactEmail', 'contactPhone'] : [key];
      setErrors((e) => {
        const copy = { ...e };
        keys.forEach((k) => { if (all[k]) copy[k] = all[k]; else delete copy[k]; });
        return copy;
      });
    }
  };

  const onBlur = (key) => {
    // Format problems show when leaving a field; "required" waits for submit.
    const next = validateProfile(values)[key];
    if (next && next.code !== 'required') setErrors((e) => ({ ...e, [key]: next }));
  };

  const showSummary = () => {
    setTimeout(() => summaryRef.current?.focus(), 0);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSubmitted(true);
    setFormError('');
    const clientErrors = validateProfile(values);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      showSummary();
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const before = profile.verificationStatus;
      const next = await updateProfile(values, { preview, saved: profile });
      setSaving(false);
      // PATCH answers reverification_triggered (guide §2): show "under review
      // again" without changing the Verified badge (flag policy).
      onSaved?.(next, {
        reverification: Boolean(next.reverificationTriggered)
          || (next.verificationStatus === 'reverification_pending' && before !== 'reverification_pending'),
      });
    } catch (err) {
      setSaving(false);
      if (err?.status === 401) return; // session-expired screen takes over
      if (isValidationError(err)) {
        const { fieldErrors, other } = mapServerErrors(err);
        setErrors(fieldErrors);
        if (other.length) setFormError(other.join(' '));
        showSummary();
        return;
      }
      if (err?.status === 403) { onProfileChange?.(null, err); return; }
      setFormError(err?.status === 0 ? t('company.pf.err.offline') : t('company.pf.err.generic'));
    }
  };

  const cancel = () => {
    if (dirty) setConfirmLeave(true);
    else onCancel?.();
  };

  return (
    <div className="cw-pf" style={{ display: 'contents' }}>
      <div className="cw-ph cw-pf-ph">
        <div>
          <button type="button" className="cw-pf-back" onClick={cancel}>
            <ArrowLeft className="cw-flip" size={15} strokeWidth={2} aria-hidden="true" />{t('company.pf.back')}
          </button>
          <h1>{t('company.pf.editTitle')}</h1>
          <p>{t('company.pf.editSub')}</p>
        </div>
        <div className="cw-ph-actions">
          <button type="button" className="cw-btn sec" onClick={cancel} disabled={saving}>{t('company.pf.cancel')}</button>
          <button type="submit" form="cw-pf-form" className="cw-btn pri" disabled={saving}>
            {saving ? t('company.pf.saving') : t('company.pf.save')}
          </button>
        </div>
      </div>

      <form id="cw-pf-form" className="cw-grid cw-pf-grid" onSubmit={submit} noValidate aria-label={t('company.pf.editTitle')}>
        <div className="cw-pf-col">
          {submitted && errorKeys.length > 0 && (
            <div className="cw-pf-summary" role="alert" tabIndex={-1} ref={summaryRef} aria-labelledby="cw-pf-summary-t">
              <span className="cw-pf-summary-ic"><CircleAlert size={18} strokeWidth={2} aria-hidden="true" /></span>
              <div>
                <h2 id="cw-pf-summary-t">
                  {errorKeys.length === 1 ? t('company.pf.sumOne') : t('company.pf.sumMany', { n: errorKeys.length })}
                </h2>
                <p>{t('company.pf.sumBody')}</p>
                <ul>
                  {errorKeys.map((k) => (
                    <li key={k}>
                      <a href={`#pf-${k}`} onClick={(ev) => { ev.preventDefault(); focusField(k); }}>
                        <b>{t(`company.pf.f.${k}`)}</b> — {errorText(t, errors[k])}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {formError && (
            <div className="cw-pf-summary is-plain" role="alert">
              <span className="cw-pf-summary-ic"><CircleAlert size={18} strokeWidth={2} aria-hidden="true" /></span>
              <div><h2>{formError}</h2><p>{t('company.pf.sumBody')}</p></div>
            </div>
          )}
          {relevant.length > 0 && <ReverificationNotice variant="fields" fields={relevant} />}

          {PROFILE_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section];
            const fields = PROFILE_FIELDS.filter((f) => f.section === section);
            return (
              <fieldset key={section} className="cw-card cw-pf-sec cw-pf-fs" id={`pf-section-${section}`}>
                <legend className="cw-vh">{t(`company.pf.sec.${section}`)}</legend>
                <div className="cw-pf-sec-h" aria-hidden="true">
                  <span className="cw-pf-sec-ic"><Icon size={18} strokeWidth={1.8} /></span>
                  <div>
                    <h2>{t(`company.pf.sec.${section}`)}</h2>
                    <p className="cw-pf-muted">{t(`company.pf.sec.${section}Sub`)}</p>
                  </div>
                </div>
                <div className="cw-pf-fields">
                  {fields.map((f) => (
                    <ProfileField
                      key={f.key}
                      field={FIELD_BY_KEY[f.key]}
                      value={values[f.key]}
                      error={errors[f.key]}
                      onChange={onChange}
                      onBlur={onBlur}
                      inputRef={(el) => { refs.current[f.key] = el; }}
                    />
                  ))}
                </div>
              </fieldset>
            );
          })}

          <div className="cw-pf-actions">
            <p className="cw-pf-muted">{dirty ? t('company.pf.unsaved') : t('company.pf.noChanges')}</p>
            <button type="button" className="cw-btn sec" onClick={cancel} disabled={saving}>{t('company.pf.cancel')}</button>
            <button type="submit" className="cw-btn pri" disabled={saving} aria-disabled={saving}>
              {saving
                ? <><LoaderCircle className="cw-pf-spin" size={16} strokeWidth={2} aria-hidden="true" />{t('company.pf.saving')}</>
                : <><Save size={16} strokeWidth={1.9} aria-hidden="true" />{t('company.pf.save')}</>}
            </button>
          </div>
        </div>

        <aside className="cw-pf-col cw-pf-side">
          <CompletenessCard completeness={liveCompleteness} onPick={focusField} live />
          <section className="cw-card cw-pf-statuscard" aria-label={t('company.pf.statusLabel')}>
            <VerificationStatus status={profile.verificationStatus} compact />
            <p className="cw-pf-muted">{t('company.pf.statusReadonly')}</p>
          </section>
          <AccountNote onNavigate={onNavigate} />
        </aside>
      </form>

      {confirmLeave && (
        <DiscardDialog
          onKeep={() => setConfirmLeave(false)}
          onDiscard={() => { setConfirmLeave(false); onCancel?.(); }}
        />
      )}
    </div>
  );
}
