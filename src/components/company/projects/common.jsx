import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, SearchX, X } from 'lucide-react';
import { SectionError } from '../dashboard/SectionState';
import CompanyAccessDenied from '../CompanyAccessDenied';
import { useCompanyI18n } from '../useCompanyI18n';
import { STATE_TONE } from './lifecycle';

/*
 * Shared pieces of the Sprint 4 company screens (US-PRJ-01, US-PRJ-02,
 * US-MATCH-03, US-MATCH-04): page failure, status pills, page header, confirm dialog, notices. Same design language as
 * the dashboard and the Organization Profile (cw- tokens, Inter, navy/white).
 */

const TONE_CLASS = { gray: 'p-gray', violet: 'p-violet', amber: 'p-amber', green: 'p-green', blue: 'p-blue', red: 'p-red' };


/** Whole-page failure (denied / not found / error with Retry). Returns null when there is none. */
export function PageFailure({ page, title, onNavigate, backTo, variant = 'list', notFound }) {
  const { t } = useCompanyI18n();
  if (page.failure === 'denied') return <CompanyAccessDenied onNavigate={onNavigate} />;
  if (page.failure === 'notfound') {
    return (
      <section className="cw-card cw-pj-notfound" role="alert">
        <div className="cw-empty">
          <div className="cw-ill"><SearchX size={28} strokeWidth={1.7} aria-hidden="true" /></div>
          <h4>{notFound?.title || t('prj.notFound.title')}</h4>
          <p>{notFound?.body || t('prj.notFound.body')}</p>
          {backTo && <button type="button" className="cw-btn ghost" onClick={() => onNavigate?.(backTo.route)}>{backTo.label}</button>}
        </div>
      </section>
    );
  }
  if (page.status === 'error') return <SectionError title={title} variant={variant} error={page.error} onRetry={page.retry} />;
  return null;
}

/** Project state pill — text + dot, never colour alone. */
export function StatePill({ state, label }) {
  const { t } = useCompanyI18n();
  const tone = STATE_TONE[state] || 'gray';
  return <span className={`cw-pill ${TONE_CLASS[tone]}`}><span className="cw-d" />{label || t(`company.ws.state.${state}`)}</span>;
}

export function TonePill({ tone = 'gray', children, className = '' }) {
  return <span className={`cw-pill ${TONE_CLASS[tone] || 'p-gray'} ${className}`}><span className="cw-d" />{children}</span>;
}

export function PageHeader({ back, title, sub, actions, children }) {
  return (
    <div className="cw-ph cw-pj-ph">
      <div className="cw-pj-ph-main">
        {back && (
          <button type="button" className="cw-pf-back" onClick={back.onClick}>
            <ArrowLeft className="cw-flip" size={15} strokeWidth={2} aria-hidden="true" /> {back.label}
          </button>
        )}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {children}
      </div>
      {actions && <div className="cw-ph-actions cw-pj-actions">{actions}</div>}
    </div>
  );
}

/** Server refusal shown inline: the backend's own words + its code (Scenario 8 — "a clear error"). */
export function InlineAlert({ error, title, tone = 'red', onClose, children }) {
  const { t } = useCompanyI18n();
  if (!error && !children) return null;
  return (
    <div className={`cw-pj-alert is-${tone}`} role="alert">
      <span className="cw-pj-alert-ic"><AlertTriangle size={17} strokeWidth={2} aria-hidden="true" /></span>
      <div>
        {title && <h3>{title}</h3>}
        {error && <p>{error.message || t('prj.err.generic')}{error.code ? <code className="cw-pj-code">{error.code}</code> : null}</p>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="cw-iconbtn cw-pj-alert-x" aria-label={t('prj.close')} onClick={onClose}><X size={16} aria-hidden="true" /></button>
      )}
    </div>
  );
}

export function Notice({ title, body, onClose }) {
  const { t } = useCompanyI18n();
  return (
    <div className="cw-pf-toast" role="status">
      <span className="cw-pf-toast-ic"><CheckCircle2 size={20} strokeWidth={2} aria-hidden="true" /></span>
      <div>
        <h3>{title}</h3>
        {body && <p>{body}</p>}
      </div>
      {onClose && <button type="button" className="cw-iconbtn cw-pf-toast-x" aria-label={t('prj.close')} onClick={onClose}><X size={16} aria-hidden="true" /></button>}
    </div>
  );
}

/**
 * Confirmation dialog for every lifecycle / decision / team action.
 * reason: 'required' (Cancel, BR-10) | 'optional' (decisions, BR-03) | null.
 */
export function ConfirmDialog({
  icon: Icon = AlertTriangle, tone = 'pri', title, body, confirmLabel, cancelLabel,
  reason = null, reasonLabel, reasonHint, onConfirm, onClose, busy = false, error, children, initialReason = '',
}) {
  const { t } = useCompanyI18n();
  const [text, setText] = useState(initialReason);
  const [touched, setTouched] = useState(false);
  const firstRef = useRef(null);
  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);
  const missing = reason === 'required' && !text.trim();
  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (missing || busy) return;
    onConfirm?.(text.trim());
  };
  return (
    <div className="cw-pf-modal" role="presentation" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}>
      <form className={`cw-pf-dialog cw-pj-dialog is-${tone}`} role="dialog" aria-modal="true" aria-labelledby="cw-pj-dlg-t" onSubmit={submit} noValidate>
        <span className={`cw-pf-dialog-ic cw-pj-dlg-ic is-${tone}`}><Icon size={20} strokeWidth={1.9} aria-hidden="true" /></span>
        <h2 id="cw-pj-dlg-t">{title}</h2>
        {body && <p>{body}</p>}
        {children}
        {reason && (
          <div className="cw-pf-field cw-pj-reason">
            <label htmlFor="cw-pj-reason">
              {reasonLabel || t('prj.reason')}
              {reason === 'required' ? <span className="cw-pf-req" aria-hidden="true">*</span> : <span className="cw-pf-opt">{t('prj.optional')}</span>}
            </label>
            <textarea
              id="cw-pj-reason"
              ref={reason ? firstRef : undefined}
              rows={3}
              value={text}
              aria-invalid={touched && missing ? 'true' : undefined}
              aria-describedby={touched && missing ? 'cw-pj-reason-err' : (reasonHint ? 'cw-pj-reason-hint' : undefined)}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
            />
            {reasonHint && !(touched && missing) && <span id="cw-pj-reason-hint" className="cw-pf-muted">{reasonHint}</span>}
            {touched && missing && <span id="cw-pj-reason-err" className="cw-pj-ferr">{t('prj.err.reasonRequired')}</span>}
          </div>
        )}
        {error && <InlineAlert error={error} />}
        <div className="cw-pf-dialog-act">
          <button type="button" className="cw-btn sec" ref={reason ? undefined : firstRef} onClick={onClose} disabled={busy}>{cancelLabel || t('prj.keep')}</button>
          <button type="submit" className={`cw-btn ${tone === 'danger' ? 'danger' : 'pri'}`} disabled={busy} aria-busy={busy || undefined}>
            {busy ? t('prj.working') : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/** Capacity bar "3 / 5" (filled capacity; BR-08 of PRJ-02). */
export function CapacityBar({ filled = 0, total = 0, label }) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  const full = total > 0 && filled >= total;
  return (
    <div className="cw-cap" aria-label={label}>
      <div className="cw-bar"><i style={{ width: `${pct}%`, background: full ? 'var(--cw-green)' : undefined }} /></div>
      <span>{filled}/{total}</span>
    </div>
  );
}
