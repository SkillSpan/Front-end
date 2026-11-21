import { CircleAlert } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { OPTION_LISTS, errorText, useOptionLabel } from './profileOptions';

/** One labelled control with hint + inline error (aria-describedby / aria-invalid). */
export default function ProfileField({ field, value, error, onChange, onBlur, inputRef }) {
  const { t } = useCompanyI18n();
  const optionLabel = useOptionLabel();
  const id = `pf-${field.key}`;
  const hintKey = `company.pf.h.${field.key}`;
  const hint = t(hintKey);
  const hasHint = hint && hint !== hintKey;
  const describedBy = [hasHint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: field.key,
    value: value ?? '',
    onChange: (e) => onChange(field.key, e.target.value),
    onBlur: () => onBlur?.(field.key),
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    'aria-required': field.required ? 'true' : undefined,
    // Read-only on the server (type): shown, never editable or sent.
    disabled: field.readOnly ? true : undefined,
    ref: inputRef,
  };
  // Emails, URLs and phones are always left-to-right; free text follows what is typed.
  const ltr = field.format ? { dir: 'ltr' } : { dir: 'auto' };

  let control;
  if (field.control === 'select') {
    const base = OPTION_LISTS[field.options] || [];
    // A value the server stored that is not in our list (e.g. "51-200",
    // "Manufacturing") is kept as its own option so it is shown, not blanked.
    const list = value && !base.some((o) => o.value === value) ? [...base, { value, label: value }] : base;
    control = (
      <div className="cw-pf-select">
        <select {...common}>
          {!field.required || !value ? <option value="">{t('company.pf.select')}</option> : null}
          {list.map((o) => <option key={o.value} value={o.value}>{optionLabel(field, o.value)}</option>)}
        </select>
      </div>
    );
  } else if (field.control === 'textarea') {
    control = <textarea {...common} dir="auto" rows={4} maxLength={field.maxLength} />;
  } else {
    control = (
      <input
        {...common}
        {...ltr}
        type={field.type || 'text'}
        inputMode={field.inputMode}
        autoComplete={field.autoComplete}
        maxLength={field.maxLength ? field.maxLength + 20 : undefined}
      />
    );
  }

  return (
    <div className={`cw-pf-field${field.wide ? ' wide' : ''}${error ? ' has-err' : ''}`}>
      <label htmlFor={id}>
        {t(`company.pf.f.${field.key}`)}
        {field.readOnly
          ? <span className="cw-pf-opt">{t('company.pf.readOnly')}</span>
          : field.required
            ? <><span className="cw-pf-req" aria-hidden="true">*</span><span className="cw-vh"> ({t('company.pf.required')})</span></>
            : <span className="cw-pf-opt">{t('company.pf.optional')}</span>}
        {field.verification && <span className="cw-pf-vtag">{t('company.pf.verificationTag')}</span>}
      </label>
      {control}
      {field.control === 'textarea' && field.maxLength && (
        <span className="cw-pf-count" aria-hidden="true">{String(value || '').length}/{field.maxLength}</span>
      )}
      {hasHint && !error && <p className="cw-pf-hint" id={`${id}-hint`}>{hint}</p>}
      {hasHint && error && <p className="cw-vh" id={`${id}-hint`}>{hint}</p>}
      {error && (
        <p className="cw-pf-err" id={`${id}-err`}>
          <CircleAlert size={14} strokeWidth={2} aria-hidden="true" />
          {errorText(t, error)}
        </p>
      )}
    </div>
  );
}
