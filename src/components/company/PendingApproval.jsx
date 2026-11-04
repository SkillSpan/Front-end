import { Hourglass, Check, Clock, Lock, Mail, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import './workspace/companyWorkspace.css';
import { usePreferences } from '../../preferences/PreferencesContext';
import { useCompanyI18n } from './useCompanyI18n';
import SkillSpanMark from './workspace/SkillSpanMark';
import { formatDate } from './dashboard/format';
import { SAMPLE_PENDING } from './dashboard/companyDashboardMock';

/**
 * Organization under review (Sprint 1, BR-01: a pending company cannot sign
 * in, so this is a signed-out page, not a banner on the dashboard).
 *
 * Data: pass `organization` as a prop or as router state
 * (navigate('/company/pending', { state: { organization } })) — e.g. from
 * the login screen when the API refuses a pending organization.
 * `demo` shows the Nova Tech sample.
 */
export default function PendingApproval({ organization: orgProp, demo = false }) {
  const { t, lang, dir } = useCompanyI18n();
  const { setLang } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const org = orgProp || location.state?.organization || (demo ? SAMPLE_PENDING : {});
  const name = org.name || t('company.pending.yourOrg');
  const email = org.email || org.contact_email;

  return (
    <div className="cw" dir={dir}>
      <div className="cw-pg">
        <header className="cw-pgtop">
          <a href="/" className="cw-brand" style={{ textDecoration: 'none' }} aria-label="SkillSpan"><SkillSpanMark /></a>
          <button type="button" className="cw-lang" lang={lang === 'ar' ? 'en' : 'ar'} onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}>
            {t('company.ws.langSwitch')}
          </button>
        </header>

        <main className="cw-center">
          <section className="cw-pcard" aria-labelledby="cw-pending-title">
            <div className="cw-pcard-head">
              <div className="cw-hg"><Hourglass size={28} strokeWidth={1.7} aria-hidden="true" /></div>
              <span className="cw-pill p-amber" style={{ marginTop: 4 }}><span className="cw-d" />{t('company.pending.badge')}</span>
            </div>
            <h1 id="cw-pending-title">{t('company.pending.title', { org: name })}</h1>
            <p className="cw-lead">{t('company.pending.lead')}</p>

            <ol className="cw-tl">
              <li className="cw-tli">
                <span className="cw-ti ok"><Check size={15} strokeWidth={2.4} aria-hidden="true" /></span>
                <div><div className="cw-tt">{t('company.ws.step.registered')}</div>{org.registeredOn && <div className="cw-ts">{formatDate(org.registeredOn, lang)}</div>}</div>
              </li>
              <li className="cw-tli">
                <span className="cw-ti ok"><Check size={15} strokeWidth={2.4} aria-hidden="true" /></span>
                <div><div className="cw-tt">{t('company.ws.step.documents')}</div>{org.documents && <div className="cw-ts">{lang === 'ar' ? t('company.ws.field.license') : org.documents}</div>}</div>
              </li>
              <li className="cw-tli">
                <span className="cw-ti now"><Clock size={15} strokeWidth={2.2} aria-hidden="true" /></span>
                <div><div className="cw-tt">{t('company.pending.reviewTitle')}</div><div className="cw-ts">{t('company.pending.reviewSub')}</div></div>
                <div className="cw-r"><span className="cw-pill p-amber">{t('company.pending.inProgress')}</span></div>
              </li>
              <li className="cw-tli dim">
                <span className="cw-ti lk"><Lock size={14} strokeWidth={2} aria-hidden="true" /></span>
                <div><div className="cw-tt">{t('company.pending.accessTitle')}</div><div className="cw-ts">{t('company.pending.accessSub')}</div></div>
              </li>
            </ol>

            <div className="cw-mailnote">
              <Mail className="cw-ic" size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>
                {email
                  ? (() => {
                    const [a, b] = t('company.pending.mail', { email: '\u0000' }).split('\u0000');
                    return <>{a}<b dir="ltr">{email}</b>{b}</>;
                  })()
                  : t('company.pending.mailNoEmail')}
              </span>
            </div>

            <div className="cw-pact">
              <button type="button" className="cw-btn pri" onClick={() => navigate('/company/login')}>
                <LogIn className="cw-flip" size={16} strokeWidth={2} aria-hidden="true" /> {t('company.pending.back')}
              </button>
            </div>
          </section>
        </main>

        {demo && <div className="cw-foot">{t('company.ws.sampleBanner')}</div>}
      </div>
    </div>
  );
}
