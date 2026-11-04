import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, CircleDashed, ClipboardCheck, FolderHeart, FolderKanban, Info, Lock, MessageSquareText, Scale, Send, StickyNote } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import './talent.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import { setQueryData } from '../../../cache/queryCache';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import { InlineAlert, Notice, PageFailure, PageHeader, TonePill } from '../projects/common';
import { usePageData } from '../projects/hooks';
import { newIdempotencyKey } from '../projects/api/shared';
import { listCompanyProjects, projectKeys } from '../projects/api/projectLifecycleApi';
import { addNote, addToList, COMPARE_MAX, contactCandidate, createList, getCandidate, getLists, getNotes, talentKeys } from './talentApi';
import { compareSelection, useCompareSelection } from './selection';
import { ContactDialog, Readiness, SaveToListDialog, SkillChip } from './talentUi';
import { Rationale } from './TalentSearch';

/**
 * Candidate evidence summary (US-COMP-06 Scenario 1; AC-01..04) — /company/talent/:id
 * Data: GET /api/v1/talent/{student} (guide §7; 404 when the candidate may not be
 * seen — consent is re-checked on every open, BR-06). Verified and self-declared
 * items are distinct and labelled; team projects show the candidate's own role
 * and contribution only (PORT-05). Private records are never requested.
 * Side: save to list, invite / message (US-COMP-07), add to compare, internal
 * notes (organization-only, author + time).
 * Preview (?preview=…): loading | error | notfound | denied.
 */
export default function CandidateSummary({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const key = talentKeys.candidate(id, preview);
  const page = usePageData(key, () => getCandidate(id, { preview }), { previewState, user });
  const notesKey = talentKeys.notes(id, preview);
  const notes = useCachedQuery(page.data ? notesKey : null, () => getNotes(id, { preview }));
  const lists = useCachedQuery(page.data ? talentKeys.lists(preview) : null, () => getLists({ preview }));
  const openProjects = useCachedQuery(page.data ? projectKeys.list({ state: 'open', perPage: 50 }, preview) : null, () => listCompanyProjects({ state: 'open', perPage: 50 }, { preview }));
  const selected = useCompareSelection();

  const [dialog, setDialog] = useState(null); // 'save' | 'contact'
  const [busy, setBusy] = useState(false);
  const [dlgError, setDlgError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [note, setNote] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState(null);
  const contactKey = useRef(null);
  const fmt = (iso) => (iso ? formatDate(String(iso).slice(0, 10), lang) : '');

  const c = page.data;
  const header = (
    <PageHeader back={{ label: t('tal.title'), onClick: () => go('/company/talent') }} title={c?.name || t('tal.summary')} sub={c ? [c.careerRole, c.location].filter(Boolean).join(' · ') : null}>
      {c && <div className="cw-pj-ph-meta"><Readiness readiness={c.readiness} />{c.updatedAt && <span>{t('tal.updated', { date: fmt(c.updatedAt) })}</span>}</div>}
    </PageHeader>
  );
  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('tal.summary')} onNavigate={go} backTo={{ route: '/company/talent', label: t('tal.title') }} variant="detail" notFound={{ title: t('tal.nf.title'), body: t('tal.nf.body') }} /></>;
  if (page.status === 'loading' || !c) {
    return (
      <div className="cw-pj" aria-busy="true">{header}
        <div className="cw-pj-grid"><div className="cw-pj-col">{[0, 1].map((i) => <section key={i} className="cw-card"><span className="cw-sk" style={{ width: '30%', height: 14 }} /><span className="cw-sk" style={{ width: '100%', height: 54, marginTop: 14 }} /></section>)}</div><aside className="cw-pj-col"><section className="cw-card"><span className="cw-sk" style={{ width: '100%', height: 90 }} /></section></aside></div>
      </div>
    );
  }

  const verified = c.skills.filter((s) => s.verified === true);
  const selfDeclared = c.skills.filter((s) => s.verified !== true);
  const picked = selected.includes(String(c.id));

  async function save(listId) {
    setBusy(true); setDlgError(null);
    try { const l = await addToList(listId, [c.id], { preview }); setFlash({ title: t('tal.flash.saved', { n: 1, name: l.name }), body: t('tal.flash.savedBody') }); setDialog(null); } catch (err) { if (err?.status !== 401) setDlgError(err); } finally { setBusy(false); }
  }
  async function create(name) {
    setBusy(true); setDlgError(null);
    try { const l = await createList(name, [c.id], { preview, idempotencyKey: newIdempotencyKey('list') }); setFlash({ title: t('tal.flash.saved', { n: 1, name: l.name }), body: t('tal.flash.savedBody') }); setDialog(null); } catch (err) { if (err?.status !== 401) setDlgError(err); } finally { setBusy(false); }
  }
  async function contact(payload) {
    setBusy(true); setDlgError(null);
    if (!contactKey.current) contactKey.current = newIdempotencyKey('contact');
    try {
      await contactCandidate(c.id, payload, { preview, idempotencyKey: contactKey.current });
      contactKey.current = null;
      setFlash({ title: payload.type === 'invite' ? t('tal.flash.invited', { name: c.name }) : t('tal.flash.messaged', { name: c.name }), body: t('tal.flash.contactBody') });
      setDialog(null);
    } catch (err) { if (err?.status !== 401) { contactKey.current = null; setDlgError(err); } } finally { setBusy(false); }
  }
  async function submitNote(e) {
    e.preventDefault();
    if (!note.trim()) return;
    setNoteBusy(true); setNoteError(null);
    try {
      const n = await addNote(c.id, note.trim(), { preview, idempotencyKey: newIdempotencyKey('note') });
      setQueryData(notesKey, (prev) => [n, ...(prev || [])], { touch: true });
      setNote('');
    } catch (err) { if (err?.status !== 401) setNoteError(err); } finally { setNoteBusy(false); }
  }

  return (
    <div className="cw-pj cw-tl">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}
      {flash && <Notice title={flash.title} body={flash.body} onClose={() => setFlash(null)} />}

      <div className="cw-pj-grid">
        <div className="cw-pj-col">
          <section className="cw-card cw-pj-sec" aria-labelledby="tl-sk-h">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><BadgeCheck size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="tl-sk-h">{t('tal.sum.skills')}</h2></div>
            <div className="cw-tl-legend"><span className="cw-tl-skill is-verified"><BadgeCheck size={13} aria-hidden="true" />{t('tal.verified')}</span><span className="cw-tl-skill is-self"><CircleDashed size={13} aria-hidden="true" />{t('tal.selfDeclared')}</span></div>
            {verified.length > 0 && <><h3 className="cw-tl-h3">{t('tal.sum.verifiedSkills')}</h3><div className="cw-tl-skills">{verified.map((s) => <SkillChip key={s.id} skill={s} />)}</div></>}
            {selfDeclared.length > 0 && <><h3 className="cw-tl-h3">{t('tal.sum.selfSkills')}</h3><div className="cw-tl-skills">{selfDeclared.map((s) => <SkillChip key={s.id} skill={s} />)}</div></>}
            {!c.skills.length && <p className="cw-tm-empty">{t('tal.sum.noSkills')}</p>}
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="tl-pj-h">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><FolderKanban size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="tl-pj-h">{t('tal.sum.projects')}</h2></div>
            {c.projects.length ? (
              <ul className="cw-tl-ev">
                {c.projects.map((p, i) => (
                  <li key={i} className={p.verified ? 'is-verified' : 'is-self'}>
                    <div className="cw-tl-ev-h">
                      <b>{p.title}</b>
                      <TonePill tone={p.verified ? 'green' : 'gray'}>{p.verified ? t('tal.verified') : t('tal.selfDeclared')}</TonePill>
                    </div>
                    {p.teamRole && <p className="cw-tl-ev-role">{t('tal.sum.role', { role: p.teamRole })}</p>}
                    {p.contribution && <p className="cw-tl-ev-c"><span>{t('tal.sum.contribution')}</span> {p.contribution}</p>}
                    {p.completedAt && <small>{t('tal.sum.completed', { date: fmt(p.completedAt) })}</small>}
                  </li>
                ))}
              </ul>
            ) : <p className="cw-tm-empty">{t('tal.sum.noProjects')}</p>}
          </section>

          <section className="cw-card cw-pj-sec" aria-labelledby="tl-ev-h">
            <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><ClipboardCheck size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="tl-ev-h">{t('tal.sum.evaluations')}</h2></div>
            {c.evaluations.length ? (
              <ul className="cw-tl-ev">
                {c.evaluations.map((e, i) => <li key={i}><div className="cw-tl-ev-h"><b>{e.project}</b>{e.band && <TonePill tone={e.band === 'strong' ? 'green' : 'blue'}>{t(`tal.evalBand.${e.band}`)}</TonePill>}</div><p className="cw-tl-ev-c">{e.summary}</p></li>)}
              </ul>
            ) : <p className="cw-tm-empty">{t('tal.sum.noEvaluations')}</p>}
          </section>

          {(c.rationale || c.limitations.length > 0) && (
            <section className="cw-card cw-pj-sec" aria-labelledby="tl-why-h">
              <div className="cw-pj-sec-h"><span className="cw-pf-sec-ic"><Info size={17} strokeWidth={1.9} aria-hidden="true" /></span><h2 id="tl-why-h">{t('tal.sum.why')}</h2></div>
              {c.rationale ? <Rationale rationale={c.rationale} t={t} /> : <p className="cw-tl-limits">{c.limitations.map((l) => t(`tal.limit.${l}`)).join(' · ')}</p>}
            </section>
          )}
          <p className="cw-ap-private"><Lock size={14} aria-hidden="true" /> {t('tal.sum.privacy')}</p>
        </div>

        <aside className="cw-pj-col">
          <section className="cw-card cw-pj-side" aria-labelledby="tl-act-h">
            <h2 id="tl-act-h">{t('tal.sum.actions')}</h2>
            <div className="cw-tl-acts">
              <button type="button" className="cw-btn pri" onClick={() => { setDlgError(null); setDialog('contact'); }} disabled={!c.contactAllowed} aria-describedby={!c.contactAllowed ? 'tl-noct' : undefined}><Send size={15} aria-hidden="true" /> {t('tal.sum.contact')}</button>
              <button type="button" className="cw-btn sec" onClick={() => { setDlgError(null); setDialog('save'); }}><FolderHeart size={15} aria-hidden="true" /> {t('tal.save')}</button>
              <button type="button" className="cw-btn sec" disabled={!picked && selected.length >= COMPARE_MAX} onClick={() => compareSelection.toggle(c.id)} aria-pressed={picked}><Scale size={15} aria-hidden="true" /> {picked ? t('tal.sum.inCompare') : t('tal.sum.addCompare')}</button>
            </div>
            {!c.contactAllowed && <p id="tl-noct" className="cw-ap-blocked"><Info size={14} aria-hidden="true" /> {t('tal.sum.noContact')}</p>}
            {selected.length >= 2 && <button type="button" className="cw-link" style={{ marginTop: 10 }} onClick={() => go(`/company/talent/compare?ids=${selected.join(',')}`)}>{t('tal.compareN', { n: selected.length })}</button>}
          </section>

          <section className="cw-card cw-pj-side" aria-labelledby="tl-notes-h">
            <h2 id="tl-notes-h"><StickyNote size={15} strokeWidth={1.9} aria-hidden="true" /> {t('tal.notes.title')}</h2>
            <p className="cw-pf-muted">{t('tal.notes.private')}</p>
            <form className="cw-tl-noteform" onSubmit={submitNote}>
              <label htmlFor="tl-note" className="cw-vh">{t('tal.notes.add')}</label>
              <textarea id="tl-note" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('tal.notes.placeholder')} />
              {noteError && <InlineAlert error={noteError} onClose={() => setNoteError(null)} />}
              <button type="submit" className="cw-btn sec sm" disabled={noteBusy || !note.trim()}><MessageSquareText size={14} aria-hidden="true" /> {noteBusy ? t('prj.working') : t('tal.notes.add')}</button>
            </form>
            {notes.status === 'loading' ? <span className="cw-sk" style={{ width: '100%', height: 40, marginTop: 12 }} /> : (notes.data || []).length ? (
              <ol className="cw-pj-tl">
                {notes.data.map((n) => <li key={n.id}>{n.body}<small>{[n.author, n.at ? fmt(n.at) : null].filter(Boolean).join(' · ')}</small></li>)}
              </ol>
            ) : <p className="cw-tm-empty">{t('tal.notes.none')}</p>}
          </section>
        </aside>
      </div>

      {dialog === 'save' && <SaveToListDialog lists={lists.data || []} count={1} busy={busy} error={dlgError} onClose={() => setDialog(null)} onSave={save} onCreate={create} />}
      {dialog === 'contact' && <ContactDialog name={c.name} projects={(openProjects.data?.items || []).map((p) => ({ id: p.id, title: p.title }))} busy={busy} error={dlgError} onClose={() => setDialog(null)} onSend={contact} />}
    </div>
  );
}
