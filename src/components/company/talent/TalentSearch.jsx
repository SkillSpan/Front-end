import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, FolderHeart, Info, ListFilter, Search, SearchX, Scale, Send, X } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import './talent.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import Pagination from '../notifications/Pagination';
import EmptyState from '../dashboard/EmptyState';
import { Notice, PageFailure, PageHeader } from '../projects/common';
import { useCompanyPermissions, usePageData } from '../projects/hooks';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import { newIdempotencyKey } from '../projects/api/shared';
import { initials } from '../applications/people';
import {
  addToList, COMPARE_MAX, contactAllCandidates, createList, EXTRA_FILTERS, getLists, getTalentFilterOptions, searchTalent, talentKeys, TALENT_PAGE_SIZE, TALENT_SORTS,
} from './talentApi';
import { compareSelection, useCompareSelection } from './selection';
import { BroadcastDialog, Readiness, SaveToListDialog, SkillChip } from './talentUi';

/**
 * Talent Search (US-COMP-05) — /company/talent
 *   ?search&role&min&sort&page (+ skills, location, language, availability when the backend offers them)
 * Filters (AC-02): role, readiness, sort and name come from the guide's
 * GET /talent + /talent/filters. The other COMP-01 filters appear only when
 * /talent/filters lists their values (ASSUMED keys, see talentApi.js), so a
 * filter is never shown that the backend would silently ignore.
 * Each card: readiness band, verified skills, project evidence, evaluation
 * count, data freshness, and "Why this rank" (COMP-02 rationale, AC-07).
 * Pick up to 4 for Compare (US-COMP-06) or save them to a list (US-COMP-07).
 * Preview (?preview=…): loading | error | empty | denied | readonly.
 */
const READINESS_STEPS = ['', '40', '60', '75', '90'];

export default function TalentSearch({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  const params = new URLSearchParams(location.search);
  const extra = Object.fromEntries(EXTRA_FILTERS.map((k) => [k, params.get(k) || '']));
  const query = {
    search: params.get('search') || '',
    role: params.get('role') || '',
    minReadiness: READINESS_STEPS.includes(params.get('min') || '') ? (params.get('min') || '') : '',
    sort: TALENT_SORTS.includes(params.get('sort')) ? params.get('sort') : 'readiness',
    page: Math.max(1, Number(params.get('page')) || 1),
    perPage: TALENT_PAGE_SIZE,
    extra,
  };
  const setQuery = (patch) => {
    const next = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, val]) => { if (val === '' || val == null || (k === 'page' && val === 1)) next.delete(k); else next.set(k, String(val)); });
    if (!('page' in patch)) next.delete('page');
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, { replace: true });
  };
  const [searchDraft, setSearchDraft] = useState(null);
  const searchText = searchDraft ?? query.search;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openRationale, setOpenRationale] = useState(null);
  const [saveFor, setSaveFor] = useState(null); // array of ids
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [broadcastError, setBroadcastError] = useState(null);
  const selected = useCompareSelection();

  const emptyPreview = previewState === 'empty';
  const filters = useCachedQuery(talentKeys.filters(preview), () => getTalentFilterOptions({ preview }));
  const page = usePageData(emptyPreview ? null : talentKeys.list(query, preview), () => searchTalent(query, { preview }), { previewState, user });
  const lists = useCachedQuery(talentKeys.lists(preview), () => getLists({ preview }));
  const opts = filters.data || { careerRoles: [], readinessBands: [] };
  const data = emptyPreview ? { items: [], total: 0, page: 1, lastPage: 1 } : page.data;
  const activeCount = [query.search, query.role, query.minReadiness, ...Object.values(extra)].filter(Boolean).length;

  const header = (
    <PageHeader
      title={t('tal.title')}
      sub={t('tal.sub')}
      actions={(
        <>
          <button type="button" className="cw-btn sec" onClick={() => go('/company/talent/lists')}>
            <FolderHeart size={15} strokeWidth={1.9} aria-hidden="true" /> {t('tal.lists.title')}
          </button>
          {/* Writing to candidates is the same permission as reading them: a
              company that cannot search talent has nobody to write to, and the
              broadcast endpoint would answer sent_to: 0. Hide the control
              rather than offer a button that cannot do anything. */}
          {perms.can_search_talent && (
            <button
              type="button"
              className="cw-btn pri"
              onClick={() => { setBroadcastError(null); setBroadcastOpen(true); }}
            >
              <Send size={15} strokeWidth={1.9} aria-hidden="true" /> {t('tal.broadcast.action')}
            </button>
          )}
        </>
      )}
    />
  );

  if (!perms.can_search_talent) {
    return <div className="cw-pj">{header}<section className="cw-card"><EmptyState icon={Info} title={t('tal.noPermission')} body={t('tal.noPermissionBody')} /></section></div>;
  }
  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('tal.title')} onNavigate={go} /></>;

  async function save(listId) {
    setBusy(true); setSaveError(null);
    try {
      const l = await addToList(listId, saveFor, { preview });
      setFlash({ title: t('tal.flash.saved', { n: saveFor.length, name: l.name }) });
      setSaveFor(null);
    } catch (err) { if (err?.status !== 401) setSaveError(err); } finally { setBusy(false); }
  }
  async function create(name) {
    setBusy(true); setSaveError(null);
    try {
      const l = await createList(name, saveFor, { preview, idempotencyKey: newIdempotencyKey('list') });
      setFlash({ title: t('tal.flash.saved', { n: saveFor.length, name: l.name }) });
      setSaveFor(null);
    } catch (err) { if (err?.status !== 401) setSaveError(err); } finally { setBusy(false); }
  }

  /**
   * Send one message to everyone this company can see.
   *
   * `sentTo: 0` is reported as such rather than as success: a verified company
   * that currently sees nobody would otherwise be told "sent" when nothing was.
   */
  async function sendToAll(message) {
    setBroadcastBusy(true); setBroadcastError(null);
    try {
      const { sentTo } = await contactAllCandidates(message, { preview, idempotencyKey: newIdempotencyKey('broadcast') });
      setBroadcastOpen(false);
      setFlash({ title: sentTo === 0 ? t('tal.broadcast.sentNone') : t('tal.broadcast.sent', { n: sentTo }), body: sentTo === 0 ? null : t('tal.broadcast.sentBody') });
    } catch (err) { if (err?.status !== 401) setBroadcastError(err); } finally { setBroadcastBusy(false); }
  }

  const suggestions = data?.suggestions || [
    query.role && { key: 'role', label: t('tal.suggest.role'), patch: { role: '' } },
    query.minReadiness && { key: 'min', label: t('tal.suggest.min'), patch: { min: '' } },
    query.search && { key: 'search', label: t('tal.suggest.search'), patch: { search: '' } },
    ...EXTRA_FILTERS.filter((k) => extra[k]).map((k) => ({ key: k, label: t('tal.suggest.extra', { name: t(`tal.f.${k}`) }), patch: { [k]: '' } })),
  ].filter(Boolean);

  return (
    <div className="cw-pj cw-tl">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}
      {flash && <Notice title={flash.title} body={flash.body ?? t('tal.flash.savedBody')} onClose={() => setFlash(null)} />}

      <div className="cw-tl-layout">
        <aside className={`cw-card cw-tl-filters${filtersOpen ? ' is-open' : ''}`} aria-labelledby="tl-f-h">
          <button type="button" className="cw-tl-ftoggle" aria-expanded={filtersOpen} aria-controls="tl-f-body" onClick={() => setFiltersOpen((o) => !o)}>
            <ListFilter size={16} aria-hidden="true" /> <span id="tl-f-h">{t('tal.filters')}</span>
            {activeCount > 0 && <span className="cw-count">{activeCount}</span>}
            <ChevronDown className="cw-tl-chev" size={16} aria-hidden="true" />
          </button>
          <div id="tl-f-body" className="cw-tl-fbody">
            <form role="search" className="cw-pj-search cw-tl-search" onSubmit={(e) => { e.preventDefault(); setQuery({ search: searchText.trim() }); setSearchDraft(null); }}>
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              <input type="search" value={searchText} placeholder={t('tal.f.search')} aria-label={t('tal.f.search')} onChange={(e) => setSearchDraft(e.target.value)} onBlur={() => { if (searchText.trim() !== query.search) setQuery({ search: searchText.trim() }); setSearchDraft(null); }} />
              {searchText && <button type="button" className="cw-pj-search-x" aria-label={t('prj.list.clearSearch')} onClick={() => { setSearchDraft(null); setQuery({ search: '' }); }}><X size={14} aria-hidden="true" /></button>}
            </form>
            <label className="cw-tl-field">
              <span>{t('tal.f.role')}</span>
              <select value={query.role} onChange={(e) => setQuery({ role: e.target.value })}>
                <option value="">{t('tal.f.anyRole')}</option>
                {opts.careerRoles.map((r) => <option key={r.slug} value={r.slug}>{r.title}</option>)}
              </select>
            </label>
            <fieldset className="cw-tl-field">
              <legend>{t('tal.f.readiness')}</legend>
              <div className="cw-tl-steps" role="radiogroup" aria-label={t('tal.f.readiness')}>
                {READINESS_STEPS.map((s) => (
                  <label key={s || 'any'} className={query.minReadiness === s ? 'on' : ''}>
                    <input type="radio" name="tl-min" checked={query.minReadiness === s} onChange={() => setQuery({ min: s })} />
                    {s ? `${s}+` : t('tal.f.any')}
                  </label>
                ))}
              </div>
              <small className="cw-tl-hint">{t('tal.f.readinessHint')}</small>
            </fieldset>
            {EXTRA_FILTERS.filter((k) => Array.isArray(opts[k]) && opts[k].length).map((k) => (
              <label key={k} className="cw-tl-field">
                <span>{t(`tal.f.${k}`)}</span>
                <select value={extra[k]} onChange={(e) => setQuery({ [k]: e.target.value })}>
                  <option value="">{t('tal.f.any')}</option>
                  {opts[k].map((o) => {
                    const val = typeof o === 'object' ? String(o.id) : o;
                    const label = typeof o === 'object' ? o.name : (k === 'availability' ? t(`tal.avail.${o}`) : o);
                    return <option key={val} value={val}>{label}</option>;
                  })}
                </select>
                {k === 'skills' && <small className="cw-tl-hint">{t('tal.f.skillsHint')}</small>}
              </label>
            ))}
            {activeCount > 0 && <button type="button" className="cw-link" onClick={() => { setSearchDraft(null); navigate({ pathname: location.pathname, search: query.sort !== 'readiness' ? `?sort=${query.sort}` : '' }, { replace: true }); }}>{t('tal.f.reset')}</button>}
            <p className="cw-tl-consent"><Info size={13} aria-hidden="true" /> {t('tal.consentNote')}</p>
          </div>
        </aside>

        <section className="cw-tl-results" aria-labelledby="tl-res-h">
          <div className="cw-tl-resbar">
            <h2 id="tl-res-h" className="cw-tl-count" aria-live="polite">{data ? t('tal.found', { n: data.total }) : t('tal.searching')}</h2>
            <label className="cw-pj-sort">
              <span>{t('prj.list.sort')}</span>
              <select value={query.sort} onChange={(e) => setQuery({ sort: e.target.value })}>
                {TALENT_SORTS.map((s) => <option key={s} value={s}>{t(`tal.sort.${s}`)}</option>)}
              </select>
            </label>
          </div>

          {page.status === 'loading' && !emptyPreview ? <ResultSkeleton /> : data.items.length === 0 ? (
            <section className="cw-card">
              <EmptyState icon={SearchX} title={t('tal.empty.title')} body={activeCount ? t('tal.empty.body') : t('tal.empty.none')} />
              {suggestions.length > 0 && (
                <div className="cw-tl-suggest">
                  <span>{t('tal.empty.try')}</span>
                  {suggestions.map((s) => <button key={s.key} type="button" className="cw-pj-chip" onClick={() => setQuery(s.patch)}>{s.label}</button>)}
                </div>
              )}
            </section>
          ) : (
            <>
              <ol className="cw-tl-cards" start={(data.page - 1) * TALENT_PAGE_SIZE + 1}>
                {data.items.map((c, i) => {
                  const picked = selected.includes(String(c.id));
                  const rank = (data.page - 1) * TALENT_PAGE_SIZE + i + 1;
                  const open = openRationale === c.id;
                  return (
                    <li key={c.id} className={`cw-card cw-tl-card${picked ? ' is-picked' : ''}`}>
                      <div className="cw-tl-card-top">
                        <span className="cw-tl-rank" aria-label={t('tal.rankAria', { n: rank })}>#{rank}</span>
                        <span className="cw-ap-av" aria-hidden="true">{initials(c.name)}</span>
                        <div className="cw-tl-who">
                          <button type="button" className="cw-tl-name" onClick={() => go(`/company/talent/${c.id}`)}>{c.name}</button>
                          <span>{[c.careerRole, c.location].filter(Boolean).join(' · ')}</span>
                        </div>
                        <Readiness readiness={c.readiness} />
                      </div>
                      {c.topSkills.length > 0 && <div className="cw-tl-skills">{c.topSkills.map((s) => <SkillChip key={s.id} skill={s} />)}</div>}
                      <div className="cw-tl-facts">
                        {c.projectsCount != null && <span>{t('tal.projectsN', { n: c.projectsCount })}</span>}
                        {c.evaluationsCount != null && <span>{t('tal.evaluationsN', { n: c.evaluationsCount })}</span>}
                        {c.updatedAt && <span>{t('tal.updated', { date: formatDate(String(c.updatedAt).slice(0, 10), lang) })}</span>}
                      </div>
                      {open && c.rationale && <Rationale rationale={c.rationale} t={t} />}
                      <div className="cw-tl-card-act">
                        {c.rationale && (
                          <button type="button" className="cw-link" aria-expanded={open} onClick={() => setOpenRationale(open ? null : c.id)}>
                            {open ? t('tal.hideWhy') : t('tal.why')} <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined }} aria-hidden="true" />
                          </button>
                        )}
                        <span className="cw-sp" />
                        <label className={`cw-tl-pick${!picked && selected.length >= COMPARE_MAX ? ' is-disabled' : ''}`}>
                          <input type="checkbox" checked={picked} disabled={!picked && selected.length >= COMPARE_MAX} onChange={() => compareSelection.toggle(c.id)} />
                          {t('tal.compare')}
                        </label>
                        <button type="button" className="cw-btn sec sm" onClick={() => { setSaveError(null); setSaveFor([c.id]); }}>{t('tal.save')}</button>
                        <button type="button" className="cw-btn ghost sm" onClick={() => go(`/company/talent/${c.id}`)}>{t('tal.open')} <ChevronRight className="cw-flip" size={14} aria-hidden="true" /></button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <Pagination page={data.page} lastPage={data.lastPage} onChange={(n) => setQuery({ page: n })} />
              <p className="cw-pj-hint">{t('tal.rankNote', { v: data.rankingVersion || '—' })}</p>
            </>
          )}
        </section>
      </div>

      {selected.length > 0 && (
        <div className="cw-tl-tray" role="region" aria-label={t('tal.tray')}>
          <Scale size={18} aria-hidden="true" />
          <span className="cw-tl-tray-t">{t('tal.selectedN', { n: selected.length, max: COMPARE_MAX })}</span>
          <button type="button" className="cw-link cw-tl-tray-clear" onClick={() => compareSelection.clear()}>{t('tal.clear')}</button>
          <span className="cw-sp" />
          <button type="button" className="cw-btn sec sm" onClick={() => { setSaveError(null); setSaveFor(selected.map(Number)); }}>{t('tal.saveAll')}</button>
          <button type="button" className="cw-btn pri sm" disabled={selected.length < 2} onClick={() => go(`/company/talent/compare?ids=${selected.join(',')}`)}>{t('tal.compareN', { n: selected.length })}</button>
        </div>
      )}

      {saveFor && (
        <SaveToListDialog lists={lists.data || []} count={saveFor.length} busy={busy} error={saveError} onClose={() => setSaveFor(null)} onSave={save} onCreate={create} />
      )}

      {broadcastOpen && (
        <BroadcastDialog
          count={data?.total ?? 0}
          busy={broadcastBusy}
          error={broadcastError}
          onClose={() => setBroadcastOpen(false)}
          onSend={sendToAll}
        />
      )}
    </div>
  );
}

/** COMP-02 / AC-07 — the job-relevant evidence behind a rank, with missing-data limitations. */
export function Rationale({ rationale, t }) {
  return (
    <div className="cw-tl-why">
      <ul>
        {rationale.factors.map((f) => (
          <li key={f.key}>
            <span className="cw-tl-why-k">{t(`tal.factor.${f.key}`)}</span>
            <span className="cw-bar"><i style={{ width: `${Math.max(0, Math.min(100, f.contribution != null && f.weight ? (f.contribution / (f.weight * 100)) * 100 : 0))}%` }} /></span>
            <span className="cw-tl-why-e">{f.key === 'freshness' ? '' : (f.evidence || t('tal.noEvidence'))}</span>
          </li>
        ))}
      </ul>
      {rationale.limitations.length > 0 && (
        <p className="cw-tl-limits"><Info size={13} aria-hidden="true" /> {rationale.limitations.map((l) => t(`tal.limit.${l}`)).join(' · ')}</p>
      )}
      <p className="cw-tl-fair">{t('tal.fairNote', { v: rationale.version || '—' })}</p>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <ol className="cw-tl-cards" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <li key={i} className="cw-card cw-tl-card">
          <div className="cw-tl-card-top"><span className="cw-ap-av cw-sk" /><div className="cw-tl-who"><span className="cw-sk" style={{ width: 160, height: 12 }} /><span className="cw-sk" style={{ width: 110, height: 9, marginTop: 8 }} /></div><span className="cw-sk" style={{ width: 120, height: 22, borderRadius: 99 }} /></div>
          <div className="cw-tl-skills"><span className="cw-sk" style={{ width: 120, height: 24, borderRadius: 99 }} /><span className="cw-sk" style={{ width: 90, height: 24, borderRadius: 99 }} /></div>
        </li>
      ))}
    </ol>
  );
}
