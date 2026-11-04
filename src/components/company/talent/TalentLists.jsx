import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, FolderHeart, FolderPlus, Info, Pencil, Trash2, Users, X } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import './talent.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import EmptyState from '../dashboard/EmptyState';
import { setQueryData } from '../../../cache/queryCache';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import { ConfirmDialog, InlineAlert, Notice, PageFailure, PageHeader } from '../projects/common';
import { usePageData } from '../projects/hooks';
import { newIdempotencyKey } from '../projects/api/shared';
import { initials } from '../applications/people';
import { createList, deleteList, getList, getLists, getTalentFunnel, removeFromList, renameList, talentKeys } from './talentApi';
import { Readiness } from './talentUi';

/**
 * Saved candidate lists (US-COMP-07; AC-01, AC-02, AC-08) —
 * /company/talent/lists and /company/talent/lists/:listId
 * Create / rename / delete lists; open a list; remove a candidate. Lists are
 * organization-only. Candidates who withdrew consent are hidden from the list
 * and only counted (BR-09). The aggregate candidate funnel (saved / contacted /
 * responded, AC-09) sits on top — counts only, no personal data (COMP-06).
 * Preview (?preview=…): loading | error | empty | denied.
 */
export default function TalentLists({ user, onNavigate, demo, previewState }) {
  const { listId } = useParams();
  return listId ? <ListDetail listId={listId} user={user} onNavigate={onNavigate} demo={demo} previewState={previewState} /> : <ListsOverview user={user} onNavigate={onNavigate} demo={demo} previewState={previewState} />;
}

export function TalentFunnel({ preview, empty = false }) {
  const { t } = useCompanyI18n();
  const funnel = useCachedQuery(empty ? null : talentKeys.funnel(preview), () => getTalentFunnel({ preview }));
  if (funnel.status === 'error') return null;
  const f = empty ? { saved: 0, contacted: 0, responded: 0 } : funnel.data;
  return (
    <section className="cw-card cw-tl-funnel" aria-labelledby="tl-fun-h">
      <h2 id="tl-fun-h" className="cw-vh">{t('tal.funnel.title')}</h2>
      {['saved', 'contacted', 'responded'].map((k) => (
        <div key={k}><b>{f ? f[k] : <span className="cw-sk" style={{ width: 28, height: 22 }} />}</b><span>{t(`tal.funnel.${k}`)}</span></div>
      ))}
      <p>{t('tal.funnel.note')}</p>
    </section>
  );
}

function ListsOverview({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const key = talentKeys.lists(preview);
  const page = usePageData(previewState === 'empty' ? null : key, () => getLists({ preview }), { previewState, user });
  const [dialog, setDialog] = useState(null); // { mode: 'create'|'rename'|'delete', list }
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const header = <PageHeader back={{ label: t('tal.title'), onClick: () => go('/company/talent') }} title={t('tal.lists.title')} sub={t('tal.lists.sub')} actions={<button type="button" className="cw-btn pri" onClick={() => { setName(''); setError(null); setDialog({ mode: 'create' }); }}><FolderPlus size={15} aria-hidden="true" /> {t('tal.lists.new')}</button>} />;
  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('tal.lists.title')} onNavigate={go} /></>;
  const lists = previewState === 'empty' ? [] : (page.data || []);

  async function run() {
    setBusy(true); setError(null);
    try {
      if (dialog.mode === 'create') { const l = await createList(name, [], { preview, idempotencyKey: newIdempotencyKey('list') }); setQueryData(key, (prev) => [l, ...(prev || [])], { touch: true }); setFlash(t('tal.lists.created', { name: l.name })); }
      if (dialog.mode === 'rename') { const l = await renameList(dialog.list.id, name, { preview }); setQueryData(key, (prev) => (prev || []).map((x) => (x.id === l.id ? l : x)), { touch: true }); setFlash(t('tal.lists.renamed', { name: l.name })); }
      if (dialog.mode === 'delete') { await deleteList(dialog.list.id, { preview }); setQueryData(key, (prev) => (prev || []).filter((x) => x.id !== dialog.list.id), { touch: true }); setFlash(t('tal.lists.deleted', { name: dialog.list.name })); }
      setDialog(null);
    } catch (err) { if (err?.status !== 401) setError(err); } finally { setBusy(false); }
  }

  return (
    <div className="cw-pj cw-tl">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}
      {flash && <Notice title={flash} onClose={() => setFlash(null)} />}
      <TalentFunnel preview={preview} empty={previewState === 'empty'} />
      <section className="cw-card cw-pj-listcard" aria-labelledby="tl-lists-h">
        <h2 id="tl-lists-h" className="cw-vh">{t('tal.lists.title')}</h2>
        {page.status === 'loading' && previewState !== 'empty' ? <span className="cw-sk" style={{ display: 'block', margin: 20, height: 120 }} /> : lists.length === 0 ? (
          <EmptyState icon={FolderHeart} title={t('tal.lists.emptyTitle')} body={t('tal.lists.emptyBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/talent')}>{t('tal.cmp.toSearch')}</button>} />
        ) : (
          <ul className="cw-pj-rows">
            {lists.map((l) => (
              <li key={l.id} className="cw-tl-listrow">
                <button type="button" className="cw-pj-row cw-tl-lrow" onClick={() => go(`/company/talent/lists/${l.id}`)}>
                  <span className="cw-tl-licon" aria-hidden="true"><FolderHeart size={17} /></span>
                  <span className="cw-pj-row-main"><span className="cw-pj-row-t">{l.name}</span><span className="cw-pj-row-s">{[l.createdBy, l.updatedAt ? t('prj.updated', { date: formatDate(String(l.updatedAt).slice(0, 10), lang) }) : null].filter(Boolean).join(' · ')}</span></span>
                  <span className="cw-tl-lcount"><Users size={14} aria-hidden="true" /> {t('tal.lists.count', { n: l.count })}</span>
                  <ChevronRight className="cw-flip cw-pj-row-go" size={18} aria-hidden="true" />
                </button>
                <div className="cw-tl-lacts">
                  <button type="button" className="cw-pj-x" aria-label={t('tal.lists.rename', { name: l.name })} onClick={() => { setName(l.name); setError(null); setDialog({ mode: 'rename', list: l }); }}><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" className="cw-pj-x" aria-label={t('tal.lists.delete', { name: l.name })} onClick={() => { setError(null); setDialog({ mode: 'delete', list: l }); }}><Trash2 size={15} aria-hidden="true" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="cw-pj-hint">{t('tal.save.private')}</p>

      {dialog && dialog.mode !== 'delete' && (
        <ConfirmDialog icon={dialog.mode === 'create' ? FolderPlus : Pencil} title={dialog.mode === 'create' ? t('tal.lists.new') : t('tal.lists.renameTitle')} confirmLabel={dialog.mode === 'create' ? t('tal.save.create') : t('tal.lists.save')} busy={busy} error={error} onClose={() => setDialog(null)} onConfirm={() => { if (name.trim()) run(); }}>
          <div className="cw-pf-field cw-pj-reason">
            <label htmlFor="tl-lname">{t('tal.save.name')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
            <input id="tl-lname" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t('tal.save.namePh')} />
          </div>
        </ConfirmDialog>
      )}
      {dialog?.mode === 'delete' && (
        <ConfirmDialog icon={Trash2} tone="danger" title={t('tal.lists.deleteTitle', { name: dialog.list.name })} body={t('tal.lists.deleteBody')} confirmLabel={t('tal.lists.deleteConfirm')} busy={busy} error={error} onClose={() => setDialog(null)} onConfirm={run} />
      )}
    </div>
  );
}

function ListDetail({ listId, user, onNavigate, demo, previewState }) {
  const { t } = useCompanyI18n();
  const navigate = useNavigate();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const key = talentKeys.savedList(listId, preview);
  const page = usePageData(key, () => getList(listId, { preview }), { previewState, user });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const l = page.data;
  const header = <PageHeader back={{ label: t('tal.lists.title'), onClick: () => go('/company/talent/lists') }} title={l?.name || t('tal.lists.title')} sub={l ? t('tal.lists.count', { n: l.count }) : null} />;
  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('tal.lists.title')} onNavigate={go} backTo={{ route: '/company/talent/lists', label: t('tal.lists.title') }} variant="detail" notFound={{ title: t('tal.lists.nfTitle'), body: t('tal.lists.nfBody') }} /></>;

  async function remove(c) {
    setBusy(c.id); setError(null);
    try { setQueryData(key, await removeFromList(listId, c.id, { preview }), { touch: true }); } catch (err) { if (err?.status !== 401) setError(err); } finally { setBusy(null); }
  }

  return (
    <div className="cw-pj cw-tl">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}
      {error && <InlineAlert error={error} onClose={() => setError(null)} />}
      {l?.hiddenCount > 0 && (
        <div className="cw-pj-banner is-gray" role="status">
          <span className="cw-pj-banner-ic"><Info size={19} aria-hidden="true" /></span>
          <div><h3>{t('tal.lists.hiddenTitle', { n: l.hiddenCount })}</h3><p>{t('tal.lists.hiddenBody')}</p></div>
        </div>
      )}
      <section className="cw-card cw-pj-listcard">
        {page.status === 'loading' || !l ? <span className="cw-sk" style={{ display: 'block', margin: 20, height: 120 }} /> : l.candidates.length === 0 ? (
          <EmptyState icon={Users} title={t('tal.lists.noCandidates')} body={t('tal.lists.noCandidatesBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/talent')}>{t('tal.cmp.toSearch')}</button>} />
        ) : (
          <ul className="cw-pj-rows">
            {l.candidates.map((c) => (
              <li key={c.id} className="cw-tl-listrow">
                <button type="button" className="cw-pj-row cw-tl-crow" onClick={() => go(`/company/talent/${c.id}`)}>
                  <span className="cw-ap-av" aria-hidden="true">{initials(c.name)}</span>
                  <span className="cw-pj-row-main"><span className="cw-pj-row-t">{c.name}</span><span className="cw-pj-row-s">{[c.careerRole, c.location].filter(Boolean).join(' · ')}</span></span>
                  <span className="cw-tl-crow-r"><Readiness readiness={c.readiness} compact /></span>
                  <ChevronRight className="cw-flip cw-pj-row-go" size={18} aria-hidden="true" />
                </button>
                <div className="cw-tl-lacts">
                  <button type="button" className="cw-pj-x" aria-label={t('tal.lists.removeFrom', { name: c.name })} disabled={busy === c.id} onClick={() => remove(c)}><X size={15} aria-hidden="true" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
