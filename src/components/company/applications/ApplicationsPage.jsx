import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderOpen, Inbox, SearchX } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import Pagination from '../notifications/Pagination';
import EmptyState from '../dashboard/EmptyState';
import { APPLICATION_STATES as PROJECT_STATES_WITH_APPLICATIONS } from '../projects/lifecycle';
import { listCompanyProjects, projectKeys } from '../projects/api/projectLifecycleApi';
import { CapacityBar, PageFailure, PageHeader, StatePill, TonePill } from '../projects/common';
import { usePageData } from '../projects/hooks';
import {
  APPLICATION_SORTS, APPLICATION_STATUSES, APPLICATION_TONE, APPLICATIONS_PAGE_SIZE, applicationKeys, listApplications,
} from './applicationReviewApi';
import { initials } from './people';

/**
 * Applications (US-MATCH-03 Scenario 1, AC-01, AC-02, BR-13) — /company/applicants
 *   ?project=<id>&status=<status>&sort=<key>&page=<n>
 * The dashboard's "applications awaiting a decision" task and the project
 * page link here with ?project= (US-COMP-03 Scenario 3).
 * Without ?project, the representative picks one of the organization's
 * projects that take applications (the sprint document defines applications
 * per project: GET /projects/{id}/applications — there is no cross-project list).
 * Preview (?preview=…): loading | error | empty | denied | notfound.
 */
const AWAITING = ['submitted', 'shortlisted', 'waitlisted'];

export function ApplicationStatus({ status }) {
  const { t } = useCompanyI18n();
  return <TonePill tone={APPLICATION_TONE[status] || 'gray'}>{t(`app.status.${status}`)}</TonePill>;
}

export default function ApplicationsPage({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const params = new URLSearchParams(location.search);
  const projectId = params.get('project') || '';
  const query = {
    status: APPLICATION_STATUSES.includes(params.get('status')) ? params.get('status') : '',
    sort: APPLICATION_SORTS.includes(params.get('sort')) ? params.get('sort') : 'submitted_desc',
    page: Math.max(1, Number(params.get('page')) || 1),
    perPage: APPLICATIONS_PAGE_SIZE,
  };
  const setQuery = (patch) => {
    const next = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v == null || (k === 'page' && v === 1)) next.delete(k); else next.set(k, String(v)); });
    if (!('page' in patch)) next.delete('page');
    if ('project' in patch) { next.delete('status'); next.delete('page'); }
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, { replace: true });
  };

  // The organization's projects that take applications (for the picker).
  const projQuery = { perPage: 50, sort: 'updated_desc' };
  const projects = usePageData(previewState === 'empty' ? null : projectKeys.list(projQuery, preview), () => listCompanyProjects(projQuery, { preview }), { previewState: projectId ? null : previewState, user });
  const reviewable = useMemo(
    () => (projects.data?.items || []).filter((p) => PROJECT_STATES_WITH_APPLICATIONS.includes(p.status)),
    [projects.data],
  );

  const apps = usePageData(
    projectId ? applicationKeys.list(projectId, query, preview) : null,
    () => listApplications(projectId, query, { preview }),
    { previewState: projectId ? previewState : null, user, enabled: Boolean(projectId) },
  );

  // Keep the page title on the project once it is known.
  const project = apps.data?.project || reviewable.find((p) => String(p.id) === String(projectId)) || null;

  const header = (
    <PageHeader
      title={t('app.list.title')}
      sub={project ? project.title : t('app.list.sub')}
      back={projectId ? { label: t('app.list.backToProject'), onClick: () => go(`/company/projects/${projectId}`) } : undefined}
    />
  );

  if (!projectId) {
    if (projects.failure || projects.status === 'error') return <>{header}<PageFailure page={projects} title={t('app.list.title')} onNavigate={go} /></>;
    return (
      <div className="cw-pj">
        {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
        {header}
        <section className="cw-card cw-pj-listcard" aria-labelledby="cw-ap-pick-h">
          <h2 id="cw-ap-pick-h" className="cw-ap-h2">{t('app.pick.title')}</h2>
          <p className="cw-pf-muted" style={{ margin: '4px 0 14px' }}>{t('app.pick.sub')}</p>
          {projects.status === 'loading' && previewState !== 'empty' ? <PickSkeleton /> : reviewable.length === 0 ? (
            <EmptyState icon={Inbox} title={t('app.pick.emptyTitle')} body={t('app.pick.emptyBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/projects')}>{t('app.pick.toProjects')}</button>} />
          ) : (
            <ul className="cw-pj-rows">
              {reviewable.map((p) => (
                <li key={p.id}>
                  <button type="button" className="cw-pj-row cw-ap-prow" onClick={() => setQuery({ project: p.id })}>
                    <span className="cw-pj-row-main">
                      <span className="cw-pj-row-t">{p.title}</span>
                      <span className="cw-pj-row-s">{p.applications != null ? t('app.pick.nApps', { n: p.applications }) : (p.domain || '')}</span>
                    </span>
                    <span className="cw-pj-row-state"><StatePill state={p.status} /></span>
                    <span className="cw-pj-row-cap">
                      <span className="cw-pj-row-k">{t('app.accepted')}</span>
                      <CapacityBar filled={p.filled} total={p.capacity} label={t('prj.capacityAria', { n: p.filled, total: p.capacity })} />
                    </span>
                    <ChevronRight className="cw-flip cw-pj-row-go" size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  if (apps.failure || apps.status === 'error') {
    return <>{header}<PageFailure page={apps} title={t('app.list.title')} onNavigate={go} backTo={{ route: '/company/applicants', label: t('app.list.allProjects') }} /></>;
  }

  const data = previewState === 'empty' ? { items: [], total: 0, page: 1, lastPage: 1, statusCounts: {} } : apps.data;
  const counts = data?.statusCounts || null;
  const allCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;
  const awaiting = counts ? AWAITING.reduce((a, s) => a + (counts[s] || 0), 0) : null;
  const chips = ['', ...APPLICATION_STATUSES.filter((s) => s !== 'draft' && (!counts || counts[s] > 0 || s === query.status))];
  const cap = project?.capacity;

  return (
    <div className="cw-pj">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}

      <div className="cw-ap-top">
        <label className="cw-pj-sort cw-ap-projsel">
          <span>{t('app.list.project')}</span>
          <select value={projectId} onChange={(e) => setQuery({ project: e.target.value })}>
            {!reviewable.some((p) => String(p.id) === String(projectId)) && <option value={projectId}>{project?.title || projectId}</option>}
            {reviewable.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
          </select>
        </label>
        {project && (
          <div className="cw-ap-capline">
            <StatePill state={project.status} />
            {cap && cap.total > 0 && (
              <span className="cw-ap-capmeta">
                <CapacityBar filled={cap.accepted} total={cap.total} label={t('prj.capacityAria', { n: cap.accepted, total: cap.total })} />
                <span>{cap.remaining > 0 ? t('app.capLeft', { n: cap.remaining }) : t('app.capFull')}</span>
              </span>
            )}
            {awaiting != null && <span className="cw-ap-await">{t('app.awaitingN', { n: awaiting })}</span>}
          </div>
        )}
      </div>

      {cap?.roles?.length > 0 && (
        <ul className="cw-ap-roles" aria-label={t('app.roleCapacity')}>
          {cap.roles.map((r) => (
            <li key={r.id} className={r.accepted >= r.capacity ? 'is-full' : ''}>
              <b>{r.name}</b>
              <span>{t('app.roleAccepted', { n: r.accepted, total: r.capacity })}</span>
              {r.accepted >= r.capacity && <TonePill tone="gray">{t('app.full')}</TonePill>}
            </li>
          ))}
        </ul>
      )}

      <section className="cw-card cw-pj-listcard" aria-labelledby="cw-ap-list-h">
        <h2 id="cw-ap-list-h" className="cw-vh">{t('app.list.title')}</h2>
        <div className="cw-pj-toolbar">
          <div className="cw-pj-chips cw-ap-toolbar-chips" role="group" aria-label={t('app.list.filter')} style={{ flex: 1, minWidth: 0 }}>
            {chips.map((s) => {
              const on = query.status === s;
              const n = s === '' ? allCount : counts?.[s];
              return (
                <button key={s || 'all'} type="button" className={`cw-pj-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setQuery({ status: s })}>
                  {s === '' ? t('prj.list.all') : t(`app.status.${s}`)}
                  {n != null && <span className="cw-pj-chip-n">{n}</span>}
                </button>
              );
            })}
          </div>
          <label className="cw-pj-sort">
            <span>{t('prj.list.sort')}</span>
            <select value={query.sort} onChange={(e) => setQuery({ sort: e.target.value })}>
              {APPLICATION_SORTS.map((s) => <option key={s} value={s}>{t(`app.sort.${s}`)}</option>)}
            </select>
          </label>
        </div>

        {apps.status === 'loading' && previewState !== 'empty' ? <AppSkeleton /> : data.items.length === 0 ? (
          query.status ? (
            <EmptyState icon={SearchX} title={t('app.list.noMatch', { status: t(`app.status.${query.status}`) })} body={t('app.list.noMatchBody')} action={<button type="button" className="cw-btn ghost" onClick={() => setQuery({ status: '' })}>{t('app.list.showAll')}</button>} />
          ) : (
            <EmptyState icon={FolderOpen} title={t('app.list.emptyTitle')} body={project?.status === 'open' ? t('app.list.emptyOpen') : t('app.list.emptyBody')} />
          )
        ) : (
          <>
            <div className="cw-pj-count" aria-live="polite">{t('prj.list.showing', { n: data.items.length, total: data.total })}</div>
            <div className="cw-ap-thead" aria-hidden="true">
              <span>{t('app.col.applicant')}</span><span>{t('app.col.role')}</span><span>{t('app.col.submitted')}</span><span>{t('app.col.status')}</span><span />
            </div>
            <ul className="cw-pj-rows">
              {data.items.map((a) => (
                <li key={a.id}>
                  <button type="button" className="cw-pj-row cw-ap-row" onClick={() => go(`/company/applicants/${a.id}`)}>
                    <span className="cw-ap-av" aria-hidden="true">{initials(a.name)}</span>
                    <span className="cw-pj-row-main">
                      <span className="cw-pj-row-t">{a.name}</span>
                      <span className="cw-pj-row-s">{a.headline}</span>
                    </span>
                    <span className="cw-ap-role"><span className="cw-pj-row-k">{t('app.col.role')}</span>{a.role?.name || <span className="cw-pf-empty">{t('app.noRole')}</span>}</span>
                    <span className="cw-ap-date"><span className="cw-pj-row-k">{t('app.col.submitted')}</span>{a.submittedAt ? formatDate(String(a.submittedAt).slice(0, 10), lang) : '—'}{a.projectVersion != null && <small>{t('app.vShort', { v: a.projectVersion })}</small>}</span>
                    <span className="cw-ap-st"><ApplicationStatus status={a.status} /></span>
                    <ChevronRight className="cw-flip cw-pj-row-go" size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} lastPage={data.lastPage} onChange={(n) => setQuery({ page: n })} />
          </>
        )}
      </section>
      <p className="cw-pj-hint cw-ap-privacy">{t('app.privacyNote')}</p>
    </div>
  );
}


function PickSkeleton() {
  return (
    <ul className="cw-pj-rows" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i}><div className="cw-pj-row is-skel"><span className="cw-pj-row-main"><span className="cw-sk" style={{ width: `${60 - i * 8}%`, height: 12 }} /><span className="cw-sk" style={{ width: '30%', height: 9, marginTop: 8 }} /></span></div></li>
      ))}
    </ul>
  );
}

function AppSkeleton() {
  return (
    <ul className="cw-pj-rows" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i}>
          <div className="cw-pj-row cw-ap-row is-skel">
            <span className="cw-ap-av cw-sk" />
            <span className="cw-pj-row-main"><span className="cw-sk" style={{ width: `${55 - i * 5}%`, height: 12 }} /><span className="cw-sk" style={{ width: '35%', height: 9, marginTop: 8 }} /></span>
            <span className="cw-ap-role"><span className="cw-sk" style={{ width: 90, height: 10 }} /></span>
            <span className="cw-ap-date"><span className="cw-sk" style={{ width: 70, height: 10 }} /></span>
            <span className="cw-ap-st"><span className="cw-sk" style={{ width: 80, height: 22, borderRadius: 99 }} /></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
