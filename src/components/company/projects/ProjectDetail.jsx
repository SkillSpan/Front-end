import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Archive, Ban, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, Copy, FilePenLine, FolderOpen, History, Inbox,
  Lock, MessageSquareWarning, Play, RotateCcw, Send, ShieldCheck, Sparkles, Target, Users, UsersRound, XCircle, Layers,
} from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import './projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import { SectionSkeleton } from '../dashboard/SectionState';
import { setQueryData } from '../../../cache/queryCache';
import { ACTIONS, allowedActions, isCloneable, isEditable, READ_ONLY_STATES } from './lifecycle';
import { cloneProject, getCompanyProject, projectKeys, runProjectAction } from './api/projectLifecycleApi';
import { newIdempotencyKey } from './api/shared';
import { mockForceState } from './mockBackend';
import { completeness, projectToForm, SKILL_LEVEL_KEYS } from './projectForm';
import { CapacityBar, ConfirmDialog, InlineAlert, Notice, PageFailure, PageHeader, StatePill, TonePill } from './common';
import { useCompanyPermissions, usePageData } from './hooks';

/**
 * Project owner details page (US-PRJ-02 Scenario 1 step 4, AC-02) —
 * /company/projects/:id
 *   - lifecycle status display + only the actions SRS Table 70 allows in the
 *     current state (AC-03…AC-09), each behind a confirmation; Cancel needs a
 *     reason (BR-10); invalid transitions show the server's refusal (Scenario 8)
 *   - moderation reason (US-PRJ-01 Scenario 6, AC-15), status history (BR-15)
 *   - confidential information shown only here, marked restricted (PRJ-08)
 *   - Archived: read-only (BR-12)
 * Data: GET /api/v1/company/projects/{id}; actions: POST …/submit,
 * …/transitions, …/clone (projectLifecycleApi.js).
 * Preview (?preview=…): loading | error | denied | notfound | readonly |
 *   approved | rejected | cancelled (status displays on sample data).
 */
const PREVIEW_STATUS = {
  approved: { status: 'approved', approval: { status: 'approved', approver: { name: 'SkillSpan moderation' }, decided_at: '2026-11-03T09:30:00Z' }, scheduled_open_at: '2026-11-10T08:00:00Z', applications_count: 0, capacity_state: { accepted: 0, total: 3, remaining: 3 } },
  rejected: { status: 'rejected', approval: { status: 'rejected', approver: { name: 'SkillSpan moderation' }, reason: 'Sponsored projects may not ask learners to build production features without pay. Please reframe this as a research or prototype brief.', decided_at: '2026-11-03T09:30:00Z' } },
  cancelled: { status: 'cancelled', cancellation_reason: 'The client postponed the redesign to next year.' },
};

export default function ProjectDetail({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  const [flash, setFlash] = useState(location.state?.projectFlash || null);
  const [dialog, setDialog] = useState(null); // { action } | { clone: true }
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [idemKey, setIdemKey] = useState(null);

  useEffect(() => {
    if (location.state?.projectFlash) navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview-only status displays (approved / rejected / cancelled) on a sample project.
  const [forced] = useState(() => {
    if (preview && PREVIEW_STATUS[previewState]) {
      try { mockForceState(id, PREVIEW_STATUS[previewState].status, PREVIEW_STATUS[previewState]); } catch { /* unknown sample id */ }
      return previewState;
    }
    return null;
  });

  const key = projectKeys.detail(id, preview);
  const page = usePageData(key, () => getCompanyProject(id, { preview }), { previewState: forced ? null : previewState, user });
  const project = page.data;

  if (page.failure || page.status === 'error') {
    return (
      <>
        <PageHeader back={{ label: t('prj.list.title'), onClick: () => go('/company/projects') }} title={t('prj.detail.title')} />
        <PageFailure page={page} title={t('prj.detail.title')} onNavigate={go} backTo={{ route: '/company/projects', label: t('prj.backToList') }} />
      </>
    );
  }
  if (page.status === 'loading' || !project) {
    return (
      <div className="cw-pj" aria-busy="true">
        <div className="cw-ph cw-pj-ph"><div className="cw-pj-ph-main"><span className="cw-sk" style={{ width: 90, height: 10 }} /><span className="cw-sk" style={{ width: '46%', height: 24, marginTop: 14, display: 'block' }} /><span className="cw-sk" style={{ width: '30%', height: 10, marginTop: 12, display: 'block' }} /></div></div>
        <div className="cw-pj-grid">
          <div className="cw-pj-col"><SectionSkeleton variant="list" /><SectionSkeleton variant="list" /></div>
          <div className="cw-pj-col"><SectionSkeleton variant="links" /></div>
        </div>
      </div>
    );
  }

  const state = project.status;
  const canPublish = perms.can_publish_projects;
  const actions = canPublish ? allowedActions(state) : [];
  const editable = canPublish && isEditable(state);
  const cloneable = canPublish && isCloneable(state);
  const readOnly = READ_ONLY_STATES.includes(state);
  const check = completeness(projectToForm(project));
  const accepted = Number(project.capacity_state?.accepted ?? 0);
  const total = Number(project.capacity_state?.total ?? project.capacity ?? 0);
  const appsCount = project.applications_count ?? null;
  const moderation = project.approval || {};
  const fmt = (iso) => (iso ? formatDate(String(iso).slice(0, 10), lang) : '');

  const openDialog = (next) => { setActionError(null); setIdemKey(newIdempotencyKey(next.action || 'clone')); setDialog(next); };
  const closeDialog = () => { if (!busy) { setDialog(null); setActionError(null); } };

  const runAction = async (action, reason) => {
    if (action === 'start') { go(`/company/projects/${project.id}/team`); return; }
    setBusy(true); setActionError(null);
    try {
      const next = await runProjectAction(project.id, action, { reason, preview, idempotencyKey: idemKey });
      if (next) setQueryData(key, next, { touch: true });
      else page.refetch().catch(() => {});
      setDialog(null);
      setFlash({ action, to: next?.status || ACTIONS[action].to });
    } catch (err) {
      if (err?.status === 401) return;
      setActionError(err);
    } finally { setBusy(false); }
  };

  const runClone = async () => {
    setBusy(true); setActionError(null);
    try {
      const copy = await cloneProject(project.id, { preview, idempotencyKey: idemKey });
      setDialog(null);
      if (copy?.id != null) go(`/company/projects/${copy.id}/edit`, { state: { projectFlash: { cloned: project.title } } });
    } catch (err) {
      if (err?.status !== 401) setActionError(err);
    } finally { setBusy(false); }
  };

  const onAction = (action) => {
    if (action === 'resubmit' || action === 'submit') {
      // Submit goes through the form's Review & Submit (completeness check, US-PRJ-01 Scenario 2).
      go(`/company/projects/${project.id}/edit?section=review`);
      return;
    }
    if (action === 'start') { go(`/company/projects/${project.id}/team`); return; }
    openDialog({ action });
  };

  const primary = actions.filter((a) => a !== 'cancel' && a !== 'archive' && a !== 'reopen');
  const secondary = actions.filter((a) => a === 'reopen' || a === 'archive');
  const ACTION_ICON = { submit: Send, resubmit: Send, open: FolderOpen, move_to_selection: Inbox, reopen: RotateCcw, start: UsersRound, revise: FilePenLine, archive: Archive, cancel: Ban };

  const headerActions = (
    <>
      {editable && (
        <button type="button" className="cw-btn sec" onClick={() => go(`/company/projects/${project.id}/edit`)}>
          <FilePenLine size={15} strokeWidth={1.9} aria-hidden="true" /> {t('prj.action.edit')}
        </button>
      )}
      {secondary.map((a) => {
        const Icon = ACTION_ICON[a];
        return <button key={a} type="button" className="cw-btn sec" onClick={() => onAction(a)}><Icon size={15} strokeWidth={1.9} aria-hidden="true" /> {t(`prj.action.${a}`)}</button>;
      })}
      {cloneable && (
        <button type="button" className="cw-btn sec" onClick={() => openDialog({ clone: true })}>
          <Copy size={15} strokeWidth={1.9} aria-hidden="true" /> {t('prj.action.clone')}
        </button>
      )}
      {primary.map((a) => {
        const Icon = ACTION_ICON[a];
        return <button key={a} type="button" className="cw-btn pri" onClick={() => onAction(a)}><Icon size={15} strokeWidth={1.9} aria-hidden="true" /> {t(`prj.action.${a}`)}</button>;
      })}
    </>
  );

  return (
    <div className="cw-pj">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      <PageHeader
        back={{ label: t('prj.list.title'), onClick: () => go('/company/projects') }}
        title={project.title || t('prj.untitled')}
        actions={headerActions}
      >
        <div className="cw-pj-ph-meta">
          <StatePill state={state} />
          <TonePill tone="gray">{project.project_type ? t(`prj.type.${project.project_type}`) : t('prj.type.none')}</TonePill>
          {project.domain && <span>{project.domain}</span>}
          {project.version != null && <><span className="cw-pj-dot">·</span><span>{t('prj.version', { n: project.version })}</span></>}
          {project.updated_at && <><span className="cw-pj-dot">·</span><span>{t('prj.updated', { date: fmt(project.updated_at) })}</span></>}
        </div>
      </PageHeader>

      {flash && <Notice title={flashTitle(flash, t)} body={flashBody(flash, t)} onClose={() => setFlash(null)} />}

      <StatusBanner project={project} t={t} fmt={fmt} check={check} moderation={moderation} />

      <div className="cw-pj-grid">
        <div className="cw-pj-col">
          <section className="cw-card cw-pj-sec" aria-labelledby="pj-basic">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><Target size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="pj-basic">{t('prj.sec.basic')}</h2></div>
            <dl className="cw-pj-dl">
              <Row wide label={t('prj.f.summary')} value={project.summary} t={t} />
              <Row wide label={t('prj.f.scope')} value={project.scope} t={t} />
              <ListRow label={t('prj.f.objectives')} items={project.objectives} t={t} />
              <ListRow label={t('prj.f.deliverables')} items={project.deliverables} t={t} />
              <ListRow wide label={t('prj.f.learningOutcomes')} items={project.learning_outcomes} t={t} />
            </dl>
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="pj-roles">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><CalendarClock size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="pj-roles">{t('prj.sec.roles')}</h2></div>
            <dl className="cw-pj-dl">
              <Row label={t('prj.f.startDate')} value={fmt(project.start_date)} t={t} />
              <Row label={t('prj.f.endDate')} value={fmt(project.end_date)} t={t} />
              <Row label={t('prj.f.applicationDeadline')} value={fmt(project.application_deadline)} t={t} />
              <Row label={t('prj.f.durationWeeks')} value={project.duration_weeks ? t('prj.weeks', { n: project.duration_weeks }) : ''} t={t} />
              <Row label={t('prj.f.workMode')} value={project.work_mode ? t(`prj.mode.${project.work_mode}`) : ''} t={t} />
              <Row label={t('prj.f.location')} value={project.location} t={t} />
              <Row wide label={t('prj.f.schedule')} value={project.schedule} t={t} />
            </dl>
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="pj-skills">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><Sparkles size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="pj-skills">{t('prj.sec.skills')}</h2></div>
            <dl className="cw-pj-dl">
              <div className="wide">
                <dt>{t('prj.f.skills')}</dt>
                <dd>
                  {(project.required_skills || []).length ? (
                    <div className="cw-pj-skill-list">
                      {project.required_skills.map((s) => <SkillLine key={s.skill_id} skill={s} t={t} />)}
                    </div>
                  ) : <span className="cw-pf-empty">{t('prj.notSet')}</span>}
                </dd>
              </div>
              <Row label={t('prj.f.difficulty')} value={project.difficulty ? t(`prj.diff.${project.difficulty}`) : ''} t={t} />
              <Row label={t('prj.f.careerRole')} value={project.career_role?.title} t={t} />
              <EligibilityRow eligibility={project.eligibility} t={t} />
            </dl>
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="pj-conf">
            <div className="cw-pj-sec-h">
              <span className="cw-pf-sec-ic"><ShieldCheck size={17} strokeWidth={1.9} aria-hidden="true" /></span>
              <h2 id="pj-conf">{t('prj.sec.confidentiality')}</h2>
              {project.confidentiality === 'confidential' && <span className="cw-pj-lock"><Lock size={12} strokeWidth={2.2} aria-hidden="true" />{t('prj.conf.confidential')}</span>}
            </div>
            <dl className="cw-pj-dl">
              <div className="wide">
                <dt>{t('prj.f.confidentiality')}</dt>
                <dd>{t(`prj.conf.${project.confidentiality === 'confidential' ? 'confidential' : 'public'}Desc`)}</dd>
                {project.confidentiality === 'confidential' && project.confidential_info && (
                  <div className="cw-pj-conf"><span className="cw-pf-muted">{t('prj.conf.onlyYou')}</span><div style={{ marginTop: 4 }}>{project.confidential_info}</div></div>
                )}
              </div>
              <div className="wide">
                <dt>{t('prj.f.rubric')}</dt>
                <dd>
                  {project.rubric
                    ? <span className="cw-pj-rubline"><ClipboardCheck size={15} strokeWidth={1.9} aria-hidden="true" /> {project.rubric.name} · {t('prj.rubric.version', { v: project.rubric.version })} <TonePill tone="green">{t('prj.rubric.approved')}</TonePill></span>
                    : <span className="cw-pf-empty">{t('prj.rubric.none')}</span>}
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <aside className="cw-pj-col">
          <section className="cw-card cw-pj-side" aria-labelledby="pj-cap">
            <h2 id="pj-cap">{t('prj.side.capacity')}</h2>
            <div className="cw-pj-capbig"><b>{accepted}</b><span>{t('prj.side.ofAccepted', { total })}</span></div>
            <CapacityBar filled={accepted} total={total} label={t('prj.capacityAria', { n: accepted, total })} />
            {(project.roles || []).length > 0 && (
              <ul className="cw-pj-roles">
                {project.roles.map((r) => (
                  <li key={r.id ?? r.name}><b>{r.name}</b><span>{t('prj.side.rolePlaces', { n: r.capacity, min: r.min_required ?? 1 })}</span></li>
                ))}
              </ul>
            )}
          </section>

          {perms.can_review_applications && ['open', 'selection', 'active', 'under_review', 'completed'].includes(state) && (
            <section className="cw-card cw-pj-side">
              <div className="cw-pj-linkcard">
                <span className="cw-tb blue"><Inbox size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                <div>
                  <h2>{t('prj.side.applications')}</h2>
                  <p>{appsCount != null ? t('prj.side.applicationsN', { n: appsCount }) : t('prj.side.applicationsSub')}</p>
                </div>
                <button type="button" className="cw-btn ghost sm" onClick={() => go(`/company/applicants?project=${encodeURIComponent(project.id)}`)}>
                  {t('prj.side.review')} <ChevronRight className="cw-flip" size={14} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          {perms.can_review_applications && ['selection', 'active'].includes(state) && (
            <section className="cw-card cw-pj-side">
              <div className="cw-pj-linkcard">
                <span className="cw-tb violet"><Users size={18} strokeWidth={1.8} aria-hidden="true" /></span>
                <div>
                  <h2>{t('prj.side.team')}</h2>
                  <p>{state === 'active' ? t('prj.side.teamActive') : t('prj.side.teamSub')}</p>
                </div>
                <button type="button" className="cw-btn ghost sm" onClick={() => go(`/company/projects/${project.id}/team`)}>
                  {t('prj.side.open')} <ChevronRight className="cw-flip" size={14} aria-hidden="true" />
                </button>
              </div>
            </section>
          )}

          <section className="cw-card cw-pj-side" aria-labelledby="pj-hist">
            <h2 id="pj-hist"><History size={15} strokeWidth={1.9} aria-hidden="true" style={{ verticalAlign: '-2px', marginInlineEnd: 6 }} />{t('prj.side.history')}</h2>
            {(project.status_history || []).length ? (
              <ol className="cw-pj-tl">
                {[...project.status_history].reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`}>
                    {h.from ? t('prj.hist.moved', { to: t(`company.ws.state.${h.to}`) }) : t('prj.hist.created')}
                    <small>{[h.actor?.name, fmt(h.at)].filter(Boolean).join(' · ')}</small>
                    {h.reason && <q>{h.reason}</q>}
                  </li>
                ))}
              </ol>
            ) : <p className="cw-pf-muted" style={{ marginTop: 8 }}>{t('prj.hist.none')}</p>}
          </section>

          {canPublish && actions.includes('cancel') && (
            <button type="button" className="cw-btn danger-ghost" onClick={() => onAction('cancel')}>
              <Ban size={15} strokeWidth={1.9} aria-hidden="true" /> {t('prj.action.cancel')}
            </button>
          )}
          {readOnly && <p className="cw-pf-muted"><Lock size={12} aria-hidden="true" /> {t('prj.readOnly')}</p>}
        </aside>
      </div>

      {dialog?.action && (
        <ActionDialog
          action={dialog.action}
          project={project}
          t={t}
          fmt={fmt}
          busy={busy}
          error={actionError}
          onClose={closeDialog}
          onConfirm={(reason) => runAction(dialog.action, reason)}
        />
      )}
      {dialog?.clone && (
        <ConfirmDialog
          icon={Copy}
          title={t('prj.dlg.clone.title')}
          body={t('prj.dlg.clone.body', { title: project.title })}
          confirmLabel={t('prj.dlg.clone.confirm')}
          busy={busy}
          error={actionError}
          onClose={closeDialog}
          onConfirm={runClone}
        />
      )}
    </div>
  );
}

function flashTitle(flash, t) {
  if (flash.cloned) return t('prj.flash.cloned');
  if (flash.saved) return t('prj.flash.saved');
  if (flash.to) return t('prj.flash.moved', { state: t(`company.ws.state.${flash.to}`) });
  return '';
}
function flashBody(flash, t) {
  if (flash.to === 'submitted') return t('prj.flash.submittedBody');
  if (flash.to === 'approved') return t('prj.flash.approvedBody');
  if (flash.to === 'open') return t('prj.flash.openBody');
  if (flash.to === 'selection') return t('prj.flash.selectionBody');
  if (flash.to === 'cancelled') return t('prj.flash.cancelledBody');
  if (flash.to === 'archived') return t('prj.flash.archivedBody');
  if (flash.to === 'draft') return t('prj.flash.draftBody');
  return '';
}

function Row({ label, value, wide, t }) {
  const empty = value == null || value === '';
  return (
    <div className={wide ? 'wide' : undefined}>
      <dt>{label}</dt>
      <dd>{empty ? <span className="cw-pf-empty">{t('prj.notSet')}</span> : value}</dd>
    </div>
  );
}

function ListRow({ label, items, wide, t }) {
  const list = (Array.isArray(items) ? items : []).map((x) => (typeof x === 'string' ? x : x?.title || x?.name || '')).filter(Boolean);
  return (
    <div className={wide ? 'wide' : undefined}>
      <dt>{label}</dt>
      <dd>{list.length ? <ul className="cw-pj-bul">{list.map((x, i) => <li key={i}>{x}</li>)}</ul> : <span className="cw-pf-empty">{t('prj.notSet')}</span>}</dd>
    </div>
  );
}

function EligibilityRow({ eligibility = {}, t }) {
  const e = eligibility || {};
  const parts = [['organization', e.organization], ['location', e.location], ['language', e.language], ['schedule', e.schedule], ['workMode', e.work_mode]].filter(([, v]) => v);
  return (
    <div className="wide">
      <dt>{t('prj.f.eligibility')}</dt>
      <dd>
        {e.open_to_all && !parts.length ? t('prj.elig.openToAll') : parts.length ? (
          <ul className="cw-pj-bul">{parts.map(([k, v]) => <li key={k}><b>{t(`prj.elig.${k}`)}:</b> {v}</li>)}</ul>
        ) : <span className="cw-pf-empty">{t('prj.notSet')}</span>}
      </dd>
    </div>
  );
}

export function SkillLine({ skill, t }) {
  const lvl = Number(skill.minimum_required_level ?? skill.minLevel ?? 0);
  return (
    <div className="cw-pj-skill">
      <span className="cw-pj-skill-n">{skill.skill_name ?? skill.skillName}</span>
      {(skill.is_critical_entry || skill.critical) && <span className="cw-pj-crit">{t('prj.skill.critical')}</span>}
      <span className="cw-pj-lvl" aria-label={t('prj.skill.minAria', { n: lvl, name: t(`prj.level.${SKILL_LEVEL_KEYS[lvl]}`) })}>
        {[1, 2, 3, 4, 5].map((n) => <i key={n} className={n <= lvl ? 'on' : ''} />)}
      </span>
      <span className="cw-pj-lvl-t">{t('prj.skill.min', { n: lvl, name: t(`prj.level.${SKILL_LEVEL_KEYS[lvl]}`) })}</span>
    </div>
  );
}

/** Status display per state (US-PRJ-01 UI/UX: Draft, Submitted, Approved, Changes Requested, Rejected; US-PRJ-02 states). */
function StatusBanner({ project, t, fmt, check, moderation }) {
  const s = project.status;
  const reason = moderation.reason || project.moderation_reason || '';
  const Quote = reason ? (
    <div className="cw-pj-quote"><small>{t('prj.banner.moderatorSaid', { name: moderation.approver?.name || t('prj.banner.moderator') })}</small>{reason}</div>
  ) : null;
  const cfg = {
    draft: { tone: 'gray', Icon: FilePenLine, title: t('prj.banner.draft'), body: check.complete ? t('prj.banner.draftReady') : t('prj.banner.draftMissing', { n: check.missing.length }) },
    submitted: { tone: 'violet', Icon: Send, title: t('prj.banner.submitted'), body: t('prj.banner.submittedBody', { date: fmt(project.submitted_at) }) },
    changes_requested: { tone: 'amber', Icon: MessageSquareWarning, title: t('prj.banner.changes'), body: t('prj.banner.changesBody') },
    approved: { tone: 'green', Icon: CheckCircle2, title: t('prj.banner.approved'), body: project.scheduled_open_at ? t('prj.banner.approvedScheduled', { date: fmt(project.scheduled_open_at) }) : t('prj.banner.approvedBody') },
    open: { tone: 'blue', Icon: FolderOpen, title: t('prj.banner.open'), body: t('prj.banner.openBody', { date: fmt(project.application_deadline) }) },
    selection: { tone: 'violet', Icon: Inbox, title: t('prj.banner.selection'), body: t('prj.banner.selectionBody') },
    active: { tone: 'green', Icon: Play, title: t('prj.banner.active'), body: t('prj.banner.activeBody') },
    under_review: { tone: 'blue', Icon: Layers, title: t('prj.banner.underReview'), body: t('prj.banner.underReviewBody') },
    completed: { tone: 'gray', Icon: CheckCircle2, title: t('prj.banner.completed'), body: t('prj.banner.completedBody') },
    rejected: { tone: 'red', Icon: XCircle, title: t('prj.banner.rejected'), body: t('prj.banner.rejectedBody') },
    cancelled: { tone: 'red', Icon: Ban, title: t('prj.banner.cancelled'), body: project.cancellation_reason ? t('prj.banner.cancelledReason', { reason: project.cancellation_reason }) : t('prj.banner.cancelledBody') },
    archived: { tone: 'gray', Icon: Archive, title: t('prj.banner.archived'), body: t('prj.banner.archivedBody', { date: fmt(project.archived_at) }) },
  }[s];
  if (!cfg) return null;
  const { tone, Icon, title, body } = cfg;
  return (
    <div className={`cw-pj-banner is-${tone}`} role="status">
      <span className="cw-pj-banner-ic"><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
        {['changes_requested', 'rejected'].includes(s) && Quote}
        {s === 'approved' && !project.rubric && <p className="cw-pj-ferr" style={{ marginTop: 8 }}>{t('prj.rubric.requiredToOpen')}</p>}
      </div>
    </div>
  );
}

/** Confirmations for Open, Move to Selection, Reopen, Revise, Archive, Cancel (US-PRJ-02 UI/UX). */
function ActionDialog({ action, project, t, fmt, busy, error, onClose, onConfirm }) {
  const meta = ACTIONS[action];
  const ICON = { open: FolderOpen, move_to_selection: Inbox, reopen: RotateCcw, revise: FilePenLine, archive: Archive, cancel: Ban };
  const tone = action === 'cancel' ? 'danger' : 'pri';
  const apps = project.applications_count || 0;
  const body = {
    open: t('prj.dlg.open.body'),
    move_to_selection: t('prj.dlg.selection.body', { date: fmt(project.application_deadline) }),
    reopen: t('prj.dlg.reopen.body'),
    revise: t('prj.dlg.revise.body'),
    archive: t('prj.dlg.archive.body'),
    cancel: apps > 0 ? t('prj.dlg.cancel.bodyApps', { n: apps }) : t('prj.dlg.cancel.body'),
  }[action];
  return (
    <ConfirmDialog
      icon={ICON[action]}
      tone={tone}
      title={t(`prj.dlg.${action}.title`)}
      body={body}
      confirmLabel={t(`prj.action.${action}`)}
      cancelLabel={action === 'cancel' ? t('prj.dlg.cancel.keep') : undefined}
      reason={meta.reason === 'required' ? 'required' : (action === 'archive' || action === 'open' ? null : 'optional')}
      reasonLabel={action === 'cancel' ? t('prj.dlg.cancel.reason') : undefined}
      reasonHint={action === 'cancel' ? t('prj.dlg.cancel.hint') : undefined}
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {action === 'open' && !project.rubric && <InlineAlert tone="amber" error={{ message: t('prj.rubric.requiredToOpen') }} />}
    </ConfirmDialog>
  );
}
