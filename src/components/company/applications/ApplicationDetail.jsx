import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Ban, BadgeCheck, CircleSlash, ExternalLink, EyeOff, Hourglass, Info, ListChecks, Star, UserCheck,
} from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import { setQueryData } from '../../../cache/queryCache';
import { CapacityBar, ConfirmDialog, InlineAlert, Notice, PageFailure, PageHeader, StatePill, TonePill } from '../projects/common';
import { useCompanyPermissions, usePageData } from '../projects/hooks';
import { newIdempotencyKey } from '../projects/api/shared';
import { allowedDecisions, applicationKeys, decideApplication, getApplication, isCapacityError } from './applicationReviewApi';
import { ApplicationStatus } from './ApplicationsPage';
import { initials } from './people';

/**
 * Application detail — the approved application view (US-MATCH-03 AC-03/AC-04,
 * SRS Table 71 rule 06, PORT-03, BR-PORT-06) — /company/applicants/:id
 *
 * Shows exactly what GET /applications/{id} returns: the learner's answers,
 * the project version applied to, status + submission time, the profile
 * fields their visibility settings permit, and their skills relevant to the
 * project's required skills with verification state. Nothing private is
 * requested or derived here.
 *
 * Decisions (AC-05/06/07): Shortlist · Waitlist · Accept · Reject, each with an
 * optional reason; the server's capacity check wins (AC-08, Scenario 5 →
 * "Waitlist instead"); withdrawn/expired get no actions (AC-09, Scenario 6).
 * A retry of the same decision re-sends the same idempotency key (AC-12).
 * Preview (?preview=…): loading | error | notfound | denied | readonly.
 */
const VERIF = ['verified', 'self_assessed', 'pending', 'unverified'];
const DECISION_UI = {
  shortlist: { icon: Star, tone: 'pri', btn: 'sec' },
  waitlist: { icon: Hourglass, tone: 'pri', btn: 'sec' },
  accept: { icon: UserCheck, tone: 'pri', btn: 'pri' },
  reject: { icon: Ban, tone: 'danger', btn: 'danger-ghost' },
};

export default function ApplicationDetail({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  const key = applicationKeys.detail(id, preview);
  const page = usePageData(key, () => getApplication(id, { preview }), { previewState, user });

  const [dialog, setDialog] = useState(null); // decision
  const [busy, setBusy] = useState(false);
  const [dlgError, setDlgError] = useState(null);
  const [capError, setCapError] = useState(null);
  const [flash, setFlash] = useState(null);
  const keys = useRef({}); // one idempotency key per (decision) until it succeeds

  const app = page.data;
  const backTo = app?.projectId != null ? `/company/applicants?project=${app.projectId}` : '/company/applicants';
  const header = (
    <PageHeader
      back={{ label: app?.project?.title ? t('app.detail.backTo', { title: app.project.title }) : t('app.list.title'), onClick: () => go(backTo) }}
      title={app?.name || t('app.detail.title')}
      sub={app?.headline || null}
    >
      {app && <div className="cw-pj-ph-meta"><ApplicationStatus status={app.status} />{app.submittedAt && <span>{t('app.detail.submittedOn', { date: formatDate(String(app.submittedAt).slice(0, 10), lang) })}</span>}</div>}
    </PageHeader>
  );

  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('app.detail.title')} onNavigate={go} backTo={{ route: '/company/applicants', label: t('app.list.title') }} variant="detail" /></>;
  if (page.status === 'loading' || !app) {
    return (
      <div className="cw-pj" aria-busy="true">
        {header}
        <div className="cw-pj-grid">
          <div className="cw-pj-col"><section className="cw-card"><span className="cw-sk" style={{ width: '40%', height: 14 }} /><span className="cw-sk" style={{ width: '90%', height: 10, marginTop: 14 }} /><span className="cw-sk" style={{ width: '75%', height: 10, marginTop: 10 }} /></section><section className="cw-card"><span className="cw-sk" style={{ width: '30%', height: 14 }} /><span className="cw-sk" style={{ width: '100%', height: 40, marginTop: 14 }} /></section></div>
          <aside className="cw-pj-col"><section className="cw-card cw-pj-side"><span className="cw-sk" style={{ width: '60%', height: 14 }} /><span className="cw-sk" style={{ width: '100%', height: 36, marginTop: 14 }} /></section></aside>
        </div>
      </div>
    );
  }

  const decisions = perms.can_review_applications ? allowedDecisions(app) : [];
  const closed = ['withdrawn', 'expired'].includes(app.status);
  const project = app.project;
  const cap = project?.capacity;
  const role = cap?.roles?.find((r) => String(r.id) === String(app.role?.id));
  const projectFull = cap && cap.total > 0 && cap.remaining <= 0;
  const roleFull = role && role.accepted >= role.capacity;
  const acceptBlocked = decisions.includes('accept') && (projectFull || roleFull);
  const newerVersion = project?.version != null && app.projectVersion != null && project.version > app.projectVersion;

  async function decide(decision, reason) {
    setBusy(true); setDlgError(null);
    if (!keys.current[decision]) keys.current[decision] = newIdempotencyKey(`decision-${decision}`);
    try {
      const next = await decideApplication(app.id, decision, { reason, preview, idempotencyKey: keys.current[decision] });
      delete keys.current[decision];
      setQueryData(key, next, { touch: true });
      setDialog(null); setCapError(null);
      setFlash({ decision, name: app.name });
    } catch (err) {
      if (err?.status === 401) return;
      if (isCapacityError(err)) { delete keys.current[decision]; setDialog(null); setCapError(err); page.refetch?.().catch?.(() => {}); }
      else setDlgError(err);
    } finally { setBusy(false); }
  }

  const visible = app.applicant || {};
  const profileFields = ['university', 'major', 'location', 'graduation_year', 'languages', 'bio']
    .filter((k) => visible[k] != null && visible[k] !== '' && !(Array.isArray(visible[k]) && !visible[k].length));

  const decisionCard = (variant) => (
          <section className={`cw-card cw-pj-side cw-ap-decide ${variant}`} aria-labelledby={`ap-dec-h-${variant}`}>
            <h2 id={`ap-dec-h-${variant}`}>{t('app.decide.title')}</h2>
            {closed ? <p className="cw-pf-muted">{t('app.decide.closed')}</p>
              : !perms.can_review_applications ? <p className="cw-pf-muted">{t('app.decide.noPermission')}</p>
              : decisions.length === 0 ? <p className="cw-pf-muted">{t('app.decide.final', { status: t(`app.status.${app.status}`) })}</p>
              : (
                <>
                  <p className="cw-pf-muted">{t('app.decide.sub')}</p>
                  <div className="cw-ap-dbtns">
                    {['accept', 'shortlist', 'waitlist', 'reject'].filter((d) => decisions.includes(d)).map((d) => {
                      const ui = DECISION_UI[d];
                      const Icon = ui.icon;
                      const blocked = d === 'accept' && acceptBlocked;
                      return (
                        <button key={d} type="button" className={`cw-btn ${ui.btn}`} disabled={blocked} aria-describedby={blocked ? `ap-accept-blocked-${variant}` : undefined} onClick={() => { setDlgError(null); setDialog(d); }}>
                          <Icon size={15} strokeWidth={1.9} aria-hidden="true" /> {t(`app.decision.${d}`)}
                        </button>
                      );
                    })}
                  </div>
                  {acceptBlocked && <p id={`ap-accept-blocked-${variant}`} className="cw-ap-blocked"><Info size={14} aria-hidden="true" /> {roleFull ? t('app.cap.roleFull', { role: role.name }) : t('app.cap.projectFull')}</p>}
                </>
              )}
          </section>
  );

  return (
    <div className="cw-pj">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}

      {flash && <Notice title={t(`app.flash.${flash.decision}`, { name: flash.name })} body={t('app.flash.notified')} onClose={() => setFlash(null)} />}
      {closed && (
        <div className="cw-pj-banner is-gray" role="status">
          <span className="cw-pj-banner-ic"><CircleSlash size={19} strokeWidth={1.9} aria-hidden="true" /></span>
          <div><h3>{t(`app.closed.${app.status}`)}</h3><p>{t(`app.closed.${app.status}Body`)}</p></div>
        </div>
      )}
      {capError && (
        <InlineAlert tone="amber" title={t('app.cap.title')} error={{ message: capError.message || t('app.cap.body') }} onClose={() => setCapError(null)}>
          {decisions.includes('waitlist') && <button type="button" className="cw-btn sec" onClick={() => { setCapError(null); setDialog('waitlist'); }}>{t('app.cap.waitlistInstead')}</button>}
        </InlineAlert>
      )}

      <div className="cw-pj-grid">
        <div className="cw-pj-col">
          {decisionCard('is-mob')}
          <section className="cw-card cw-pj-sec cw-ap-person" aria-labelledby="ap-person-h">
            <div className="cw-ap-person-top">
              <span className="cw-ap-av is-lg" aria-hidden="true">{initials(app.name)}</span>
              <div>
                <h2 id="ap-person-h">{t('app.profile')}</h2>
                <p>{t('app.profileSub')}</p>
              </div>
            </div>
            <dl className="cw-pj-dl">
              <div><dt>{t('app.f.role')}</dt><dd>{app.role?.name || <span className="cw-pf-empty">{t('app.noRole')}</span>}</dd></div>
              <div><dt>{t('app.f.version')}</dt><dd>{app.projectVersion != null ? t('prj.version', { n: app.projectVersion }) : '—'}{newerVersion && <small className="cw-ap-note">{t('app.newerVersion', { v: project.version })}</small>}</dd></div>
              {profileFields.map((k) => <div key={k} className={k === 'bio' ? 'wide' : undefined}><dt>{t(`app.f.${k}`)}</dt><dd>{Array.isArray(visible[k]) ? visible[k].join(', ') : String(visible[k])}</dd></div>)}
              {app.portfolioUrl && <div className="wide"><dt>{t('app.f.portfolio')}</dt><dd><a className="cw-link" href={app.portfolioUrl} target="_blank" rel="noopener noreferrer">{app.portfolioUrl.replace(/^https?:\/\//, '')} <ExternalLink size={13} aria-hidden="true" /></a></dd></div>}
            </dl>
            <p className="cw-ap-private"><EyeOff size={14} aria-hidden="true" /> {t('app.privacyDetail')}</p>
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="ap-ans-h">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><ListChecks size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="ap-ans-h">{t('app.answers')}</h2></div>
            {app.answers.length ? (
              <dl className="cw-ap-answers">
                {app.answers.map((x, i) => <div key={i}><dt>{x.question}</dt><dd>{x.answer || <span className="cw-pf-empty">{t('app.noAnswer')}</span>}</dd></div>)}
              </dl>
            ) : <p className="cw-pf-muted">{t('app.noAnswers')}</p>}
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="ap-sk-h">
            <div className="cw-pj-sec-h" style={{ marginBottom: 4 }}><span className="cw-pf-sec-ic"><BadgeCheck size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="ap-sk-h">{t('app.skills')}</h2></div>
            <p className="cw-pf-muted">{t('app.skillsSub')}</p>
            {app.skills.length ? (
              <ul className="cw-ap-skills">
                {app.skills.map((s) => {
                  const meets = s.required == null || (s.level ?? 0) >= s.required;
                  return (
                    <li key={s.id}>
                      <div className="cw-ap-sk-n"><b>{s.name}</b>{s.critical && <TonePill tone="violet">{t('prj.skill.critical')}</TonePill>}</div>
                      <div className="cw-ap-sk-lv">
                        <Dots level={s.level ?? 0} required={s.required} />
                        <span>{t('app.levelOf', { n: s.level ?? 0, req: s.required ?? '—' })}</span>
                      </div>
                      <div className="cw-ap-sk-tags">
                        {s.verification && <TonePill tone={s.verification === 'verified' ? 'green' : 'gray'}>{VERIF.includes(s.verification) ? t(`app.verif.${s.verification}`) : s.verification}</TonePill>}
                        <TonePill tone={meets ? 'blue' : 'amber'}>{meets ? t('app.meets') : t('app.below')}</TonePill>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="cw-pf-muted">{t('app.noSkills')}</p>}
          </section>
        </div>

        <aside className="cw-pj-col">
          {decisionCard('is-desk')}

          {cap && cap.total > 0 && (
            <section className="cw-card cw-pj-side" aria-labelledby="ap-cap-h">
              <h2 id="ap-cap-h">{t('prj.side.capacity')}</h2>
              <div className="cw-pj-capbig"><b>{cap.accepted}</b><span>{t('prj.side.ofAccepted', { total: cap.total })}</span></div>
              <CapacityBar filled={cap.accepted} total={cap.total} label={t('prj.capacityAria', { n: cap.accepted, total: cap.total })} />
              {role && <p className="cw-pf-muted" style={{ marginTop: 10 }}>{t('app.roleLine', { role: role.name, n: role.accepted, total: role.capacity })}</p>}
              {project && <button type="button" className="cw-link" style={{ marginTop: 8 }} onClick={() => go(`/company/projects/${project.id}`)}>{t('app.openProject')} <StatePill state={project.status} /></button>}
            </section>
          )}

          <section className="cw-card cw-pj-side" aria-labelledby="ap-hist-h">
            <h2 id="ap-hist-h">{t('app.history')}</h2>
            {app.history.length ? (
              <ol className="cw-pj-tl">
                {[...app.history].reverse().map((h, i) => (
                  <li key={i}>
                    {h.from ? t('app.hist.moved', { to: t(`app.status.${h.to}`) }) : t('app.hist.submitted')}
                    <small>{[h.actor, h.at ? formatDate(String(h.at).slice(0, 10), lang) : null].filter(Boolean).join(' · ')}</small>
                    {h.reason && <q>{h.reason}</q>}
                  </li>
                ))}
              </ol>
            ) : <p className="cw-pf-muted">{t('prj.hist.none')}</p>}
          </section>
        </aside>
      </div>

      {dialog && (
        <ConfirmDialog
          icon={DECISION_UI[dialog].icon}
          tone={DECISION_UI[dialog].tone}
          title={t(`app.dlg.${dialog}.title`, { name: app.name })}
          body={t(`app.dlg.${dialog}.body`, { role: app.role?.name || '' })}
          confirmLabel={t(`app.decision.${dialog}`)}
          reason="optional"
          reasonLabel={t('app.dlg.reason')}
          reasonHint={t('app.dlg.reasonHint')}
          busy={busy}
          error={dlgError}
          onClose={() => { if (!busy) setDialog(null); }}
          onConfirm={(reason) => decide(dialog, reason)}
        />
      )}
    </div>
  );
}

function Dots({ level, required }) {
  return (
    <span className="cw-ap-dots" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => <i key={n} className={`${n <= level ? 'on' : ''}${required === n ? ' req' : ''}`} />)}
    </span>
  );
}
