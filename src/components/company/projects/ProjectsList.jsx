import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, FolderPlus, Plus, Search, SearchX, X } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import './projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import Pagination from '../notifications/Pagination';
import EmptyState from '../dashboard/EmptyState';
import { PROJECT_STATES } from './lifecycle';
import { listCompanyProjects, projectKeys, PROJECT_SORTS, PROJECTS_PAGE_SIZE } from './api/projectLifecycleApi';
import { CapacityBar, PageFailure, PageHeader, StatePill } from './common';
import { useCompanyPermissions, usePageData } from './hooks';

/**
 * My Projects (US-PRJ-02 Scenario 1, AC-01, BR-14) — /company/projects
 *   ?state=<status>&search=<title>&sort=<key>&page=<n>  (kept in the URL so
 *   the dashboard's "Continue drafts" link and the back button land right)
 * Each row: title, type, state, application deadline, filled capacity.
 * Data: GET /api/v1/company/projects (projectLifecycleApi.js). Only the
 * organization's own projects exist for this screen (AUTH-04, AC-14).
 * Preview (?state=…): loading | error | empty | denied | readonly.
 */
const PREVIEW_ONLY = ['loading', 'error', 'empty', 'denied', 'readonly'];

export default function ProjectsList({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  const params = new URLSearchParams(location.search);
  const urlState = params.get('state');
  const query = {
    state: PROJECT_STATES.includes(urlState) && !PREVIEW_ONLY.includes(urlState) ? urlState : '',
    search: params.get('search') || '',
    sort: PROJECT_SORTS.includes(params.get('sort')) ? params.get('sort') : 'updated_desc',
    page: Math.max(1, Number(params.get('page')) || 1),
    perPage: PROJECTS_PAGE_SIZE,
  };
  const emptyPreview = previewState === 'empty';
  const setQuery = (patch) => {
    const next = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, v]) => { if (v === '' || v == null || (k === 'page' && v === 1)) next.delete(k); else next.set(k, String(v)); });
    if (!('page' in patch)) next.delete('page');
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, { replace: true });
  };

  // Draft text while typing; null = follow the URL (back button, Clear filters).
  const [searchDraft, setSearchDraft] = useState(null);
  const searchText = searchDraft ?? query.search;
  const setSearchText = setSearchDraft;

  const key = projectKeys.list(query, preview);
  const page = usePageData(
    emptyPreview ? null : key,
    () => listCompanyProjects(query, { preview }),
    { previewState, user },
  );
  const data = emptyPreview ? { items: [], total: 0, page: 1, lastPage: 1, statusCounts: {} } : page.data;
  const counts = data?.statusCounts || null;
  const allCount = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null;
  const filtering = Boolean(query.state || query.search);

  const chips = ['', ...PROJECT_STATES.filter((s) => !counts || counts[s] > 0 || s === query.state)];

  if (page.failure || page.status === 'error') {
    return (
      <>
        <PageHeader title={t('prj.list.title')} sub={t('prj.list.sub')} />
        <PageFailure page={page} title={t('prj.list.title')} onNavigate={go} />
      </>
    );
  }

  const createBtn = perms.can_publish_projects ? (
    <button type="button" className="cw-btn pri" onClick={() => go('/company/projects/new')}>
      <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {t('prj.create')}
    </button>
  ) : null;

  return (
    <div className="cw-pj">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      <PageHeader title={t('prj.list.title')} sub={t('prj.list.sub')} actions={createBtn} />

      <section className="cw-card cw-pj-listcard" aria-labelledby="cw-pj-list-h">
        <h2 id="cw-pj-list-h" className="cw-vh">{t('prj.list.title')}</h2>
        <div className="cw-pj-toolbar">
          <form
            className="cw-pj-search"
            role="search"
            onSubmit={(e) => { e.preventDefault(); setQuery({ search: searchText.trim() }); setSearchDraft(null); }}
          >
            <Search size={16} strokeWidth={2} aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              placeholder={t('prj.list.search')}
              aria-label={t('prj.list.search')}
              onChange={(e) => setSearchText(e.target.value)}
              onBlur={() => { if (searchText.trim() !== query.search) setQuery({ search: searchText.trim() }); setSearchDraft(null); }}
            />
            {searchText && (
              <button type="button" className="cw-pj-search-x" aria-label={t('prj.list.clearSearch')} onClick={() => { setSearchText(''); setQuery({ search: '' }); }}>
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </form>
          <label className="cw-pj-sort">
            <span>{t('prj.list.sort')}</span>
            <select value={query.sort} onChange={(e) => setQuery({ sort: e.target.value })}>
              {PROJECT_SORTS.map((s) => <option key={s} value={s}>{t(`prj.sort.${s}`)}</option>)}
            </select>
          </label>
        </div>

        <div className="cw-pj-chips" role="group" aria-label={t('prj.list.filter')}>
          {chips.map((s) => {
            const on = query.state === s;
            const n = s === '' ? allCount : counts?.[s];
            return (
              <button key={s || 'all'} type="button" className={`cw-pj-chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setQuery({ state: s })}>
                {s === '' ? t('prj.list.all') : t(`company.ws.state.${s}`)}
                {n != null && <span className="cw-pj-chip-n">{n}</span>}
              </button>
            );
          })}
        </div>

        {page.status === 'loading' && !emptyPreview ? (
          <ListSkeleton />
        ) : data.items.length === 0 ? (
          filtering ? (
            <EmptyState
              icon={SearchX}
              title={t('prj.list.noMatch')}
              body={t('prj.list.noMatchBody')}
              action={<button type="button" className="cw-btn ghost" onClick={() => { setSearchText(''); setQuery({ state: '', search: '' }); }}>{t('prj.list.clearFilters')}</button>}
            />
          ) : (
            <EmptyState
              icon={FolderPlus}
              title={t('company.ws.noProjects')}
              body={t('prj.list.emptyBody')}
              action={perms.can_publish_projects ? (
                <button type="button" className="cw-btn pri" onClick={() => go('/company/projects/new')}>
                  <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {t('prj.createFirst')}
                </button>
              ) : null}
            />
          )
        ) : (
          <>
            <div className="cw-pj-count" aria-live="polite">{t('prj.list.showing', { n: data.items.length, total: data.total })}</div>
            <ul className="cw-pj-rows">
              {data.items.map((p) => (
                <li key={p.id}>
                  <button type="button" className="cw-pj-row" onClick={() => go(`/company/projects/${p.id}`)}>
                    <span className="cw-pj-row-main">
                      <span className="cw-pj-row-t">{p.title || t('prj.untitled')}</span>
                      <span className="cw-pj-row-s">
                        {p.type ? t(`prj.type.${p.type}`) : t('prj.type.none')}{p.domain ? ` · ${p.domain}` : ''}
                      </span>
                    </span>
                    <span className="cw-pj-row-state"><StatePill state={p.status} /></span>
                    <span className="cw-pj-row-dl">
                      <span className="cw-pj-row-k">{t('prj.list.deadline')}</span>
                      {p.deadline ? formatDate(String(p.deadline).slice(0, 10), lang) : <span className="cw-pf-empty">{t('prj.notSet')}</span>}
                    </span>
                    <span className="cw-pj-row-cap">
                      <span className="cw-pj-row-k">{t('prj.list.filled')}</span>
                      <CapacityBar filled={p.filled} total={p.capacity} label={t('prj.capacityAria', { n: p.filled, total: p.capacity })} />
                    </span>
                    <ChevronRight className="cw-flip cw-pj-row-go" size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <Pagination page={data.page} lastPage={data.lastPage} onChange={(n) => setQuery({ page: n })} />
          </>
        )}
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="cw-pj-rows" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i}>
          <div className="cw-pj-row is-skel">
            <span className="cw-pj-row-main"><span className="cw-sk" style={{ width: `${62 - i * 6}%`, height: 12 }} /><span className="cw-sk" style={{ width: '34%', height: 9, marginTop: 8 }} /></span>
            <span className="cw-pj-row-state"><span className="cw-sk" style={{ width: 84, height: 22, borderRadius: 99 }} /></span>
            <span className="cw-pj-row-dl"><span className="cw-sk" style={{ width: 70, height: 10 }} /></span>
            <span className="cw-pj-row-cap"><span className="cw-sk" style={{ width: '100%', height: 8, borderRadius: 99 }} /></span>
          </div>
        </li>
      ))}
    </ul>
  );
}
