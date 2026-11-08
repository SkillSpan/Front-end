/*
 * Company Settings (/company/settings) — representative account, security,
 * notification preferences, language, danger zone.
 *
 * SRS: Sprint 4 lists "Account & Security Settings" (MFA AUTH-06, log out from
 * all devices AUTH-13, notification preferences NOT-02) as out of Sprint 4 scope,
 * and BR-11 keeps the representative's name / email / password out of the
 * Organization Profile form — so they live here.
 *
 * TODO(api) — endpoints this screen still needs (see settingsApi.js):
 *   PATCH /api/v1/auth/me                       { name, phone }         Account form
 *   POST  /api/v1/auth/change-password          { current_password, password, password_confirmation }
 *   POST  /api/v1/organizations/{id}/deactivate { reason }              Danger zone
 * Wired today: POST /api/v1/auth/logout-all, GET/PUT /api/v1/notifications/preferences.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UserRound, ShieldCheck, Bell, Languages, TriangleAlert, Eye, EyeOff, LogOut,
  CircleCheck, Info, CircleAlert, X, Loader2, ArrowRight, Lock, Mail,
} from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import './settings.css';
import { SETTINGS_MESSAGES } from './settingsMessages';
import { useCompanyI18n } from '../useCompanyI18n';
import { usePreferences } from '../../../preferences/PreferencesContext';
import { isValidPhone } from '../../../utils/companyValidation';
import {
  DEFAULT_PREFS, NOTIFICATION_KEYS, changePassword, deactivateAccount, loadPrefs,
  savePrefs, saveAccount, signOutEverywhere, validatePassword,
} from './settingsApi';

const SECTIONS = [
  { id: 'account', icon: UserRound, key: 'set.acc.title' },
  { id: 'security', icon: ShieldCheck, key: 'set.sec.title' },
  { id: 'notifications', icon: Bell, key: 'set.not.title' },
  { id: 'language', icon: Languages, key: 'set.lang.title' },
  { id: 'danger', icon: TriangleAlert, key: 'set.dz.title' },
];

const NOTIF_LABELS = {
  new_applicant: ['set.not.applicants', 'set.not.applicantsBody'],
  project_status: ['set.not.projects', 'set.not.projectsBody'],
  messages: ['set.not.messages', 'set.not.messagesBody'],
};

function Spin() {
  return <Loader2 className="cw-pf-spin" size={15} strokeWidth={2} aria-hidden="true" style={{ animation: 'cw-set-spin 0.8s linear infinite' }} />;
}

function SectionHead({ icon: Icon, title, sub, id, tone }) {
  return (
    <div className="cw-set-head">
      <span className={`cw-set-head-ic${tone ? ` is-${tone}` : ''}`}><Icon size={18} strokeWidth={1.9} aria-hidden="true" /></span>
      <div>
        <h2 id={id}>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <span className="cw-pf-err" role="alert"><CircleAlert size={14} strokeWidth={2} aria-hidden="true" />{msg}</span>;
}

function PasswordField({ id, label, value, onChange, error, hint, autoComplete, t, disabled }) {
  const [shown, setShown] = useState(false);
  return (
    <div className={`cw-pf-field${error ? ' has-err' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <div className="cw-set-pw">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? `${id}-d` : undefined}
          disabled={disabled}
          dir="ltr"
        />
        <button type="button" className="cw-set-eye" onClick={() => setShown((s) => !s)} aria-label={t(shown ? 'set.sec.hide' : 'set.sec.show')} aria-pressed={shown}>
          {shown ? <EyeOff size={16} strokeWidth={1.9} aria-hidden="true" /> : <Eye size={16} strokeWidth={1.9} aria-hidden="true" />}
        </button>
      </div>
      <span id={`${id}-d`}>{error ? <FieldError msg={error} /> : hint ? <span className="cw-pf-hint">{hint}</span> : null}</span>
    </div>
  );
}

function Toggle({ id, checked, onChange, disabled, labelledBy, describedBy }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      className={`cw-set-switch${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="cw-set-knob" aria-hidden="true" />
    </button>
  );
}

function ConfirmDialog({ title, body, icon: Icon = TriangleAlert, tone = 'red', children, confirmLabel, busyLabel, busy, canConfirm = true, onConfirm, onCancel, t }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('textarea, input, button')?.focus();
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onCancel]);
  return (
    <div className="cw-pf-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="cw-pf-dialog cw-set-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cw-set-dlg-t" aria-describedby="cw-set-dlg-b" ref={ref}>
        <div className={`cw-pf-dialog-ic cw-set-dlg-ic is-${tone}`}><Icon size={20} strokeWidth={2} aria-hidden="true" /></div>
        <h2 id="cw-set-dlg-t">{title}</h2>
        <p id="cw-set-dlg-b">{body}</p>
        {children}
        <div className="cw-pf-dialog-act">
          <button type="button" className="cw-btn sec" onClick={onCancel} disabled={busy}>{t('set.cancel')}</button>
          <button type="button" className={`cw-btn ${tone === 'red' ? 'danger' : 'pri'}`} onClick={onConfirm} disabled={busy || !canConfirm}>
            {busy ? <><Spin />{busyLabel}</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanySettings({ user, organization, onNavigate, onLogout, demo = false }) {
  const { t, lang, dir } = useCompanyI18n();
  const { setLang } = usePreferences();
  const go = useCallback((to) => onNavigate?.(to), [onNavigate]);

  /* ---------- toast ---------- */
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const notify = useCallback((kind, title, body) => {
    clearTimeout(toastTimer.current);
    setToast({ kind, title, body, at: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), kind === 'success' ? 4000 : 6500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const failed = useCallback((err) => {
    if (err?.code === 'not_available') notify('info', t('set.notAvailable'), t('set.notAvailableBody'));
    else notify('error', t('set.genericErr'), err?.message && err.message !== 'not_available' ? err.message : '');
  }, [notify, t]);
  const ok = useCallback((title) => notify('success', title, demo ? t('set.previewSaved') : ''), [notify, t, demo]);

  /* ---------- account ---------- */
  const initial = useMemo(() => ({ name: user?.name || user?.full_name || '', phone: user?.phone || user?.phone_number || '' }), [user]);
  const [acc, setAcc] = useState(initial);
  const [accErr, setAccErr] = useState({});
  const [accBusy, setAccBusy] = useState(false);
  const [accBase, setAccBase] = useState(initial);
  const accDirty = acc.name !== accBase.name || acc.phone !== accBase.phone;
  const email = user?.email || '';
  const orgName = organization?.name || '';

  const submitAccount = async (e) => {
    e.preventDefault();
    const errs = {};
    const name = acc.name.trim();
    if (!name) errs.name = 'set.err.nameReq';
    else if (name.length < 2) errs.name = 'set.err.nameLen';
    if (acc.phone.trim() && !isValidPhone(acc.phone)) errs.phone = 'set.err.phone';
    setAccErr(errs);
    if (Object.keys(errs).length) return;
    setAccBusy(true);
    try {
      await saveAccount({ name, phone: acc.phone.trim() }, { demo });
      const saved = { name, phone: acc.phone.trim() };
      setAcc(saved); setAccBase(saved);
      ok(t('set.acc.saved'));
    } catch (err) { failed(err); } finally { setAccBusy(false); }
  };

  /* ---------- password ---------- */
  const emptyPw = { current: '', next: '', confirm: '' };
  const [pw, setPw] = useState(emptyPw);
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);
  const setPwField = (k) => (v) => { setPw((p) => ({ ...p, [k]: v })); if (pwErr[k]) setPwErr((x) => ({ ...x, [k]: undefined })); };
  const submitPw = async (e) => {
    e.preventDefault();
    const errs = validatePassword(pw);
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setPwBusy(true);
    try {
      await changePassword({ current_password: pw.current, password: pw.next, password_confirmation: pw.confirm }, { demo });
      setPw(emptyPw);
      ok(t('set.sec.updated'));
    } catch (err) {
      const fe = err?.errors || {};
      if (fe.current_password || fe.password) {
        setPwErr({ current: fe.current_password?.[0], next: fe.password?.[0] });
      } else failed(err);
    } finally { setPwBusy(false); }
  };

  /* ---------- sessions ---------- */
  const [sessDlg, setSessDlg] = useState(false);
  const [sessBusy, setSessBusy] = useState(false);
  const doSignOutAll = async () => {
    setSessBusy(true);
    try {
      const real = await signOutEverywhere({ demo });
      setSessDlg(false);
      if (real) onLogout?.();
      else notify('info', t('set.sec.sessions'), t('set.sec.sessionsPreview'));
    } catch (err) { setSessDlg(false); failed(err); } finally { setSessBusy(false); }
  };

  /* ---------- notifications ---------- */
  const [prefs, setPrefs] = useState({ status: 'loading', data: DEFAULT_PREFS, base: DEFAULT_PREFS });
  const [prefsBusy, setPrefsBusy] = useState(false);
  const [prefsTry, setPrefsTry] = useState(0);
  useEffect(() => {
    let live = true;
    loadPrefs({ demo }).then(
      (data) => { if (live) setPrefs({ status: 'ready', data, base: data }); },
      () => { if (live) setPrefs((p) => ({ ...p, status: 'error' })); },
    );
    return () => { live = false; };
  }, [demo, prefsTry]);
  const fetchPrefs = () => { setPrefs((p) => ({ ...p, status: 'loading' })); setPrefsTry((n) => n + 1); };
  const prefsDirty = NOTIFICATION_KEYS.some((k) => prefs.data[k] !== prefs.base[k]);
  const submitPrefs = async () => {
    setPrefsBusy(true);
    try {
      const saved = await savePrefs(prefs.data, { demo });
      setPrefs({ status: 'ready', data: saved, base: saved });
      ok(t('set.not.saved'));
    } catch (err) { failed(err); } finally { setPrefsBusy(false); }
  };

  /* ---------- language ---------- */
  const pickLang = (next) => {
    if (next === lang) return;
    setLang(next);
    notify('success', SETTINGS_MESSAGES[next]?.['set.lang.changed'] || '', '');
  };

  /* ---------- danger ---------- */
  const [dz, setDz] = useState(null); // null | { reason, ack }
  const [dzBusy, setDzBusy] = useState(false);
  const doDeactivate = async () => {
    setDzBusy(true);
    try {
      await deactivateAccount({ organizationId: organization?.id, reason: dz.reason.trim() }, { demo });
      setDz(null);
      ok(t('set.dz.done'));
    } catch (err) { setDz(null); failed(err); } finally { setDzBusy(false); }
  };

  /* ---------- in-page nav ---------- */
  // One section at a time (tabs), not one long scrolling page. The open tab
  // lives in ?tab= so a refresh or a shared link opens the same section.
  const readTab = () => {
    if (typeof window === 'undefined') return 'account';
    const q = new URLSearchParams(window.location.search).get('tab');
    return SECTIONS.some((s) => s.id === q) ? q : 'account';
  };
  const [active, setActive] = useState(readTab);
  const jump = (id) => {
    setActive(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id === 'account') url.searchParams.delete('tab'); else url.searchParams.set('tab', id);
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
      window.scrollTo({ top: 0 });
    }
  };

  const ToastIcon = toast?.kind === 'success' ? CircleCheck : toast?.kind === 'error' ? CircleAlert : Info;

  return (
    <div className="cw-set" dir={dir}>
      <div className="cw-ph">
        <div>
          <h1>{t('set.title')}</h1>
          <p>{t('set.sub')}</p>
        </div>
      </div>
      {demo && <div className="cw-sample">{t('set.preview')}</div>}

      <div className="cw-set-layout">
        <nav className="cw-set-nav" aria-label={t('set.nav')}>
          {SECTIONS.map(({ id, icon: Icon, key }) => (
            <button key={id} type="button" role="tab" aria-selected={active === id} aria-controls={`cw-set-${id}`} className={`cw-set-navi${active === id ? ' on' : ''}${id === 'danger' ? ' is-danger' : ''}`} aria-current={active === id ? 'true' : undefined} onClick={() => jump(id)}>
              <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
              <span>{t(key)}</span>
            </button>
          ))}
        </nav>

        <div className="cw-set-col">
          {/* Account */}
          <section id="cw-set-account" hidden={active !== 'account'} className="cw-card cw-set-card" aria-labelledby="cw-set-account-h">
            <SectionHead icon={UserRound} id="cw-set-account-h" title={t('set.acc.title')} sub={t('set.acc.sub')} />
            <form className="cw-set-body" onSubmit={submitAccount} noValidate>
              <div className="cw-pf-fields">
                <div className={`cw-pf-field${accErr.name ? ' has-err' : ''}`}>
                  <label htmlFor="cw-set-name">{t('set.acc.name')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
                  <input id="cw-set-name" value={acc.name} onChange={(e) => { setAcc((a) => ({ ...a, name: e.target.value })); setAccErr((x) => ({ ...x, name: undefined })); }} autoComplete="name" maxLength={100} aria-invalid={accErr.name ? 'true' : undefined} disabled={accBusy} dir="auto" />
                  <FieldError msg={accErr.name && t(accErr.name)} />
                </div>
                <div className={`cw-pf-field${accErr.phone ? ' has-err' : ''}`}>
                  <label htmlFor="cw-set-phone">{t('set.acc.phone')}<span className="cw-pf-opt">{t('set.optional')}</span></label>
                  <input id="cw-set-phone" type="tel" inputMode="tel" value={acc.phone} onChange={(e) => { setAcc((a) => ({ ...a, phone: e.target.value })); setAccErr((x) => ({ ...x, phone: undefined })); }} autoComplete="tel" maxLength={20} aria-invalid={accErr.phone ? 'true' : undefined} disabled={accBusy} dir="ltr" />
                  {accErr.phone ? <FieldError msg={t(accErr.phone)} /> : <span className="cw-pf-hint">{t('set.acc.phoneHint')}</span>}
                </div>
                <div className="cw-pf-field wide">
                  <label htmlFor="cw-set-email">{t('set.acc.email')}</label>
                  <div className="cw-set-ro">
                    <Mail size={16} strokeWidth={1.9} aria-hidden="true" />
                    <input id="cw-set-email" value={email} readOnly aria-readonly="true" dir="ltr" />
                    <Lock size={14} strokeWidth={2} aria-hidden="true" className="cw-set-ro-lock" />
                  </div>
                  <span className="cw-pf-hint">{t('set.acc.emailHint')}</span>
                </div>
              </div>
              {orgName && (
                <div className="cw-set-orgrow">
                  <div>
                    <span className="cw-set-k">{t('set.acc.org')}</span>
                    <b dir="auto">{orgName}</b>
                    <span className="cw-pf-hint">{t('set.acc.orgHint')}</span>
                  </div>
                  <button type="button" className="cw-btn ghost sm" onClick={() => go('/company/profile')}>
                    {t('set.acc.toProfile')}<ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              )}
              <div className="cw-set-foot">
                {accDirty && <button type="button" className="cw-btn sec" onClick={() => { setAcc(accBase); setAccErr({}); }} disabled={accBusy}>{t('set.acc.cancel')}</button>}
                <button type="submit" className="cw-btn pri" disabled={accBusy || !accDirty}>
                  {accBusy ? <><Spin />{t('set.acc.saving')}</> : t('set.acc.save')}
                </button>
              </div>
            </form>
          </section>

          {/* Security */}
          <section id="cw-set-security" hidden={active !== 'security'} className="cw-card cw-set-card" aria-labelledby="cw-set-security-h">
            <SectionHead icon={ShieldCheck} id="cw-set-security-h" title={t('set.sec.title')} sub={t('set.sec.sub')} />
            <form className="cw-set-body" onSubmit={submitPw} noValidate>
              <h3 className="cw-set-h3">{t('set.sec.pwTitle')}</h3>
              {/* hidden username so password managers pair the change with the right account */}
              <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
              <div className="cw-pf-fields">
                <div className="cw-set-wide">
                  <PasswordField t={t} id="cw-set-pw-cur" label={t('set.sec.current')} value={pw.current} onChange={setPwField('current')} error={pwErr.current && (pwErr.current.startsWith('set.') ? t(pwErr.current) : pwErr.current)} autoComplete="current-password" disabled={pwBusy} />
                </div>
                <PasswordField t={t} id="cw-set-pw-new" label={t('set.sec.new')} value={pw.next} onChange={setPwField('next')} error={pwErr.next && (pwErr.next.startsWith('set.') ? t(pwErr.next) : pwErr.next)} hint={t('set.sec.rule')} autoComplete="new-password" disabled={pwBusy} />
                <PasswordField t={t} id="cw-set-pw-conf" label={t('set.sec.confirm')} value={pw.confirm} onChange={setPwField('confirm')} error={pwErr.confirm && t(pwErr.confirm)} autoComplete="new-password" disabled={pwBusy} />
              </div>
              <div className="cw-set-foot">
                <button type="submit" className="cw-btn pri" disabled={pwBusy || !(pw.current || pw.next || pw.confirm)}>
                  {pwBusy ? <><Spin />{t('set.sec.updating')}</> : t('set.sec.update')}
                </button>
              </div>
            </form>
            <div className="cw-set-row cw-set-sep">
              <div className="cw-set-row-txt">
                <h3 className="cw-set-h3">{t('set.sec.sessions')}</h3>
                <p>{t('set.sec.sessionsBody')}</p>
              </div>
              <button type="button" className="cw-btn sec" onClick={() => setSessDlg(true)}>
                <LogOut className="cw-flip" size={15} strokeWidth={2} aria-hidden="true" />{t('set.sec.sessionsBtn')}
              </button>
            </div>
          </section>

          {/* Notifications */}
          <section id="cw-set-notifications" hidden={active !== 'notifications'} className="cw-card cw-set-card" aria-labelledby="cw-set-notifications-h" aria-busy={prefs.status === 'loading'}>
            <SectionHead icon={Bell} id="cw-set-notifications-h" title={t('set.not.title')} sub={t('set.not.sub')} />
            {prefs.status === 'error' ? (
              <div className="cw-set-err" role="alert">
                <CircleAlert size={18} strokeWidth={2} aria-hidden="true" />
                <span>{t('set.not.loadErr')}</span>
                <button type="button" className="cw-btn sec sm" onClick={fetchPrefs}>{t('set.not.retry')}</button>
              </div>
            ) : (
              <>
                <ul className="cw-set-list">
                  {NOTIFICATION_KEYS.map((k) => (
                    <li key={k} className="cw-set-row">
                      <div className="cw-set-row-txt">
                        <span className="cw-set-row-t" id={`cw-set-n-${k}`}>{t(NOTIF_LABELS[k][0])}</span>
                        <p id={`cw-set-n-${k}-d`}>{t(NOTIF_LABELS[k][1])}</p>
                      </div>
                      {prefs.status === 'loading' ? <span className="cw-sk cw-set-sk" aria-hidden="true" /> : (
                        <Toggle id={`cw-set-t-${k}`} checked={!!prefs.data[k]} disabled={prefsBusy} labelledBy={`cw-set-n-${k}`} describedBy={`cw-set-n-${k}-d`} onChange={(v) => setPrefs((p) => ({ ...p, data: { ...p.data, [k]: v } }))} />
                      )}
                    </li>
                  ))}
                </ul>
                <div className="cw-set-foot">
                  {prefsDirty && <button type="button" className="cw-btn sec" onClick={() => setPrefs((p) => ({ ...p, data: p.base }))} disabled={prefsBusy}>{t('set.cancel')}</button>}
                  <button type="button" className="cw-btn pri" onClick={submitPrefs} disabled={prefsBusy || !prefsDirty || prefs.status !== 'ready'}>
                    {prefsBusy ? <><Spin />{t('set.acc.saving')}</> : t('set.not.save')}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Language */}
          <section id="cw-set-language" hidden={active !== 'language'} className="cw-card cw-set-card" aria-labelledby="cw-set-language-h">
            <div className="cw-set-row cw-set-row-head">
              <SectionHead icon={Languages} id="cw-set-language-h" title={t('set.lang.title')} sub={t('set.lang.sub')} />
              <div className="cw-seg cw-set-seg" role="radiogroup" aria-labelledby="cw-set-language-h">
                <button type="button" role="radio" aria-checked={lang === 'en'} className={lang === 'en' ? 'on' : ''} lang="en" dir="ltr" onClick={() => pickLang('en')}>{t('set.lang.en')}</button>
                <button type="button" role="radio" aria-checked={lang === 'ar'} className={lang === 'ar' ? 'on' : ''} lang="ar" dir="rtl" onClick={() => pickLang('ar')}>{t('set.lang.ar')}</button>
              </div>
            </div>
          </section>

          {/* Danger zone */}
          <section id="cw-set-danger" hidden={active !== 'danger'} className="cw-card cw-set-card cw-set-danger" aria-labelledby="cw-set-danger-h">
            <SectionHead icon={TriangleAlert} tone="red" id="cw-set-danger-h" title={t('set.dz.title')} sub={t('set.dz.sub')} />
            <div className="cw-set-row cw-set-dzrow">
              <div className="cw-set-row-txt">
                <h3 className="cw-set-h3">{t('set.dz.deact')}</h3>
                <p>{t('set.dz.deactBody')}</p>
              </div>
              <button type="button" className="cw-btn cw-set-dzbtn" onClick={() => setDz({ reason: '', ack: false })}>{t('set.dz.deact')}</button>
            </div>
          </section>
        </div>
      </div>

      {sessDlg && (
        <ConfirmDialog
          t={t}
          tone="blue"
          icon={LogOut}
          title={t('set.sec.sessionsConfirmTitle')}
          body={t('set.sec.sessionsConfirmBody', { email: email || '—' })}
          confirmLabel={t('set.sec.sessionsBtn')}
          busyLabel={t('set.sec.signingOut')}
          busy={sessBusy}
          onConfirm={doSignOutAll}
          onCancel={() => setSessDlg(false)}
        />
      )}
      {dz && (
        <ConfirmDialog
          t={t}
          title={t('set.dz.confirmTitle', { org: orgName || t('set.dz.thisOrg') })}
          body={t('set.dz.confirmBody')}
          confirmLabel={t('set.dz.confirmBtn')}
          busyLabel={t('set.dz.working')}
          busy={dzBusy}
          canConfirm={dz.ack}
          onConfirm={doDeactivate}
          onCancel={() => setDz(null)}
        >
          <div className="cw-pf-field cw-set-dlg-field">
            <label htmlFor="cw-set-dz-reason">{t('set.dz.reason')}<span className="cw-pf-opt">{t('set.optional')}</span></label>
            <textarea id="cw-set-dz-reason" rows={3} maxLength={500} value={dz.reason} placeholder={t('set.dz.reasonPh')} onChange={(e) => setDz((x) => ({ ...x, reason: e.target.value }))} disabled={dzBusy} dir="auto" />
          </div>
          <label className="cw-set-ack">
            <input type="checkbox" checked={dz.ack} onChange={(e) => setDz((x) => ({ ...x, ack: e.target.checked }))} disabled={dzBusy} />
            <span>{t('set.dz.ack')}</span>
          </label>
        </ConfirmDialog>
      )}

      {toast && (
        <div key={toast.at} className={`cw-set-toast is-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'} aria-live="polite">
          <span className="cw-set-toast-ic"><ToastIcon size={18} strokeWidth={2} aria-hidden="true" /></span>
          <div>
            <b>{toast.title}</b>
            {toast.body && <p>{toast.body}</p>}
          </div>
          <button type="button" className="cw-set-toast-x" aria-label={t('set.dismiss')} onClick={() => setToast(null)}><X size={15} strokeWidth={2} aria-hidden="true" /></button>
        </div>
      )}
    </div>
  );
}
