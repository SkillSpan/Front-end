import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, CheckCircle2, MapPin, UserRound, XCircle } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import { ConfirmDialog, InlineAlert } from '../projects/common';
import { getInvitation, respondToInvitation } from './teamFormationApi';
import { applyTeamPreview } from './teamPreview';

/**
 * Learner invitation — accept or decline (US-MATCH-04 Scenario 3, AC-07, BR-08/09).
 * /team-invitations/:id — opened from the in-app invitation notification.
 * Only the invited learner may answer (the server checks invitee ownership).
 * Accept confirms the team assignment; Decline releases the place and the
 * company is notified (BR-14). The answer is final here.
 * Preview (?preview=…): loading | error | notfound | answered.
 */
export default function TeamInvitationPage({ demo }) {
  const { t, lang, dir } = useCompanyI18n();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const preview = Boolean(demo);
  const previewState = preview ? new URLSearchParams(location.search).get('preview') : null;
  useState(() => { if (preview && previewState === 'answered') applyTeamPreview('p1', 'ready'); return true; });

  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [confirmDecline, setConfirmDecline] = useState(false);

  // Resolves to the next screen state; never rejects.
  const fetchState = useCallback(async () => {
    if (previewState === 'loading') return new Promise(() => {});
    try {
      if (previewState === 'error') throw { status: 0, message: t('inv.loadFailed') };
      if (previewState === 'notfound') throw { status: 404 };
      return { status: 'ready', data: await getInvitation(id, { preview }), error: null };
    } catch (err) {
      return { status: err?.status === 404 || err?.status === 403 ? 'notfound' : 'error', data: null, error: err };
    }
  }, [id, preview, previewState, t]);
  useEffect(() => {
    let alive = true;
    fetchState().then((next) => { if (alive) setState(next); });
    return () => { alive = false; };
  }, [fetchState]);
  const load = () => { setState((s) => ({ ...s, status: 'loading' })); fetchState().then(setState); };

  async function respond(response) {
    setBusy(response); setError(null);
    try {
      await respondToInvitation(id, response, { preview });
      setConfirmDecline(false);
      setState((s) => ({ ...s, data: { ...s.data, status: response } }));
    } catch (err) {
      setConfirmDecline(false);
      if (err?.status === 409) load(); // already answered elsewhere
      setError(err);
    } finally { setBusy(null); }
  }

  const inv = state.data;
  const project = inv?.project || {};
  const fmt = (iso) => (iso ? formatDate(String(iso).slice(0, 10), lang) : '—');

  return (
    <div className="cw cw-inv" dir={dir}>
      <div className="cw-inv-top">SkillSpan</div>
      <main className="cw-inv-main">
        <div className="cw-inv-card">
          {preview && <div className="cw-sample" style={{ marginBottom: 12 }}>{t('company.ws.sampleBanner')}</div>}
          <section className="cw-card" aria-busy={state.status === 'loading' || undefined}>
            {state.status === 'loading' && (
              <>
                <span className="cw-sk" style={{ width: '40%', height: 12 }} />
                <span className="cw-sk" style={{ width: '80%', height: 22, marginTop: 18 }} />
                <span className="cw-sk" style={{ width: '100%', height: 90, marginTop: 20 }} />
                <span className="cw-sk" style={{ width: '100%', height: 42, marginTop: 20 }} />
              </>
            )}
            {state.status === 'notfound' && (
              <div className="cw-inv-done">
                <span className="cw-inv-big is-gray"><XCircle size={26} aria-hidden="true" /></span>
                <h1>{t('inv.notFound')}</h1>
                <p className="cw-inv-lead">{t('inv.notFoundBody')}</p>
              </div>
            )}
            {state.status === 'error' && (
              <InlineAlert error={state.error} title={t('inv.loadFailed')}>
                <button type="button" className="cw-btn sec" onClick={load}>{t('inv.retry')}</button>
              </InlineAlert>
            )}
            {state.status === 'ready' && inv && (
              inv.status === 'pending' ? (
                <>
                  <div className="cw-inv-org">
                    <span className="cw-inv-logo" aria-hidden="true">{(project.organization?.name || '?').slice(0, 1)}</span>
                    <div><small>{t('inv.from')}</small><b>{project.organization?.name}</b></div>
                  </div>
                  <h1>{t('inv.title', { project: project.title })}</h1>
                  <p className="cw-inv-lead">{t('inv.lead', { role: inv.role?.name || '' })}</p>
                  <dl className="cw-inv-facts">
                    <div><dt><UserRound size={12} aria-hidden="true" /> {t('inv.role')}</dt><dd>{inv.role?.name || '—'}</dd></div>
                    <div><dt><MapPin size={12} aria-hidden="true" /> {t('prj.f.workMode')}</dt><dd>{project.work_mode ? t(`prj.mode.${project.work_mode}`) : '—'}</dd></div>
                    <div><dt><CalendarDays size={12} aria-hidden="true" /> {t('prj.f.startDate')}</dt><dd>{fmt(project.start_date)}</dd></div>
                    <div><dt><CalendarDays size={12} aria-hidden="true" /> {t('prj.f.endDate')}</dt><dd>{fmt(project.end_date)}</dd></div>
                  </dl>
                  {error && <div style={{ marginTop: 16 }}><InlineAlert error={error} onClose={() => setError(null)} /></div>}
                  <div className="cw-inv-act">
                    <button type="button" className="cw-btn sec" onClick={() => setConfirmDecline(true)} disabled={Boolean(busy)}>{t('inv.decline')}</button>
                    <button type="button" className="cw-btn pri" onClick={() => respond('accepted')} disabled={Boolean(busy)} aria-busy={busy === 'accepted' || undefined}>
                      <CheckCircle2 size={16} aria-hidden="true" /> {busy === 'accepted' ? t('prj.working') : t('inv.accept')}
                    </button>
                  </div>
                  <p className="cw-inv-note">{t('inv.note', { date: fmt(inv.sent_at) })}</p>
                </>
              ) : (
                <div className="cw-inv-done" role="status">
                  <span className={`cw-inv-big ${inv.status === 'accepted' ? 'is-green' : 'is-gray'}`}>{inv.status === 'accepted' ? <CheckCircle2 size={26} aria-hidden="true" /> : <XCircle size={26} aria-hidden="true" />}</span>
                  <h1>{inv.status === 'accepted' ? t('inv.accepted', { project: project.title }) : t('inv.declined')}</h1>
                  <p className="cw-inv-lead">{inv.status === 'accepted' ? t('inv.acceptedBody', { role: inv.role?.name || '', org: project.organization?.name || '' }) : t('inv.declinedBody', { org: project.organization?.name || '' })}</p>
                  {!preview && <div className="cw-inv-act" style={{ justifyContent: 'center' }}><button type="button" className="cw-btn ghost" style={{ flex: 'none' }} onClick={() => navigate('/dashboard')}>{t('inv.toDashboard')}</button></div>}
                </div>
              )
            )}
          </section>
        </div>
      </main>
      {confirmDecline && (
        <ConfirmDialog
          icon={XCircle}
          tone="danger"
          title={t('inv.dlg.title')}
          body={t('inv.dlg.body', { org: project.organization?.name || '' })}
          confirmLabel={t('inv.decline')}
          cancelLabel={t('inv.dlg.keep')}
          busy={busy === 'declined'}
          onClose={() => setConfirmDecline(false)}
          onConfirm={() => respond('declined')}
        />
      )}
    </div>
  );
}
