import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck, Building2, Check, ChevronRight, ClipboardCheck, FlaskConical, Info, Lock, Plus, Save, Search, Send, ShieldCheck, Trash2, X,
} from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import './projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from '../dashboard/EmptyState';
import { formatDate } from '../dashboard/format';
import { SectionSkeleton } from '../dashboard/SectionState';
import { setQueryData } from '../../../cache/queryCache';
import { useCachedQuery } from '../../../cache/useCachedQuery';
import { apiKey } from '../../../cache/queryCache';
import {
  blankRole, completeness, CONFIDENTIALITY, DIFFICULTIES, emptyProjectForm, FORM_SECTIONS, mapServerErrors, projectToForm,
  PROJECT_TYPES, sectionOf, SKILL_LEVEL_KEYS, SKILL_LEVELS, validateProjectForm, WORK_MODES,
} from './projectForm.js';
import { isEditable } from './lifecycle';
import { createProjectDraft, loadCareerRoleSkills, loadFormReferences, PUBLICATION_ENDPOINTS, submitProject, updateProjectDraft } from './api/projectPublicationApi';
import { getCompanyProject, projectKeys } from './api/projectLifecycleApi';
import { newIdempotencyKey } from './api/shared';
import { InlineAlert, Notice, PageFailure, PageHeader, StatePill } from './common';
import { useCompanyPermissions, usePageData } from './hooks';
import { SkillLine } from './ProjectDetail';

/**
 * Create / Edit Project (US-PRJ-01) — /company/projects/new and
 * /company/projects/:id/edit (Draft or Changes Requested only, US-PRJ-02 BR-04).
 *
 *   Sections (sprint doc "Project Information"): 1 Basic Information (with the
 *   project type, AC-02) · 2 Roles, Schedule & Capacity · 3 Skills, Difficulty
 *   & Eligibility · 4 Confidentiality & Evaluation · 5 Review & Submit.
 *   Save as Draft at any point (AC-09); Review & Submit lists every missing
 *   item (AC-10) and submits a complete project (AC-11), or publishes it
 *   where the approval policy allows owner approval (AC-12).
 *   Server 422s land under their fields and nothing typed is lost.
 *
 * Preview (?preview=…): loading | error | denied | readonly | errors (a draft
 * attempt with client errors) · ?section=basic|roles|skills|confidentiality|review.
 */
export default function ProjectForm({ user, onNavigate, demo, previewState }) {
  const { t } = useCompanyI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  const editing = Boolean(id);

  const page = usePageData(editing ? projectKeys.detail(id, preview) : null, () => getCompanyProject(id, { preview }), { previewState, user, enabled: editing });
  const refsKey = apiKey('/api/v1/skills/taxonomy', null, { variant: preview ? 'form-refs-preview' : 'form-refs' });
  const refs = useCachedQuery(previewState === 'loading' ? null : refsKey, () => loadFormReferences({ preview }));

  const header = <PageHeader back={{ label: editing ? t('prj.detail.title') : t('prj.list.title'), onClick: () => go(editing ? `/company/projects/${id}` : '/company/projects') }} title={editing ? t('prj.form.editTitle') : t('prj.form.createTitle')} sub={t('prj.form.sub')} />;

  if (!perms.can_publish_projects) {
    return (
      <>
        {header}
        <section className="cw-card"><EmptyState icon={Lock} title={t('prj.form.noPermission')} body={t('prj.form.noPermissionBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/projects')}>{t('prj.backToList')}</button>} /></section>
      </>
    );
  }
  if (editing && (page.failure || page.status === 'error')) {
    return <>{header}<PageFailure page={page} title={t('prj.form.editTitle')} onNavigate={go} backTo={{ route: '/company/projects', label: t('prj.backToList') }} /></>;
  }
  if (previewState === 'loading' || (editing && (page.status === 'loading' || !page.data)) || refs.status === 'loading') {
    return (
      <div className="cw-pj" aria-busy="true">
        {header}
        <div className="cw-pj-form"><SectionSkeleton variant="links" className="cw-pj-steps-sk" /><SectionSkeleton variant="list" /></div>
      </div>
    );
  }
  if (editing && page.data && !isEditable(page.data.status)) {
    return (
      <>
        {header}
        <section className="cw-card"><EmptyState icon={Lock} title={t('prj.form.notEditable', { state: t(`company.ws.state.${page.data.status}`) })} body={t('prj.form.notEditableBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go(`/company/projects/${id}`)}>{t('prj.form.backToProject')}</button>} /></section>
      </>
    );
  }
  return (
    <FormBody
      key={editing ? `edit-${id}` : 'new'}
      project={editing ? page.data : null}
      refs={refs.data || { taxonomy: [], careerRoles: [], rubrics: [], failed: ['taxonomy', 'careerRoles', 'rubrics'] }}
      refsError={refs.status === 'error' ? refs.error : null}
      preview={preview}
      previewState={previewState}
      go={go}
      t={t}
    />
  );
}

function FormBody({ project: initialProject, refs, refsError, preview, previewState, go, t }) {
  const location = useLocation();
  const [project, setProject] = useState(initialProject);
  const [form, setForm] = useState(() => (initialProject ? projectToForm(initialProject) : emptyProjectForm()));
  const sectionParam = new URLSearchParams(location.search).get('section');
  const [section, setSection] = useState(FORM_SECTIONS.includes(sectionParam) ? sectionParam : 'basic');
  const [attempt, setAttempt] = useState(previewState === 'errors' ? 'submit' : null); // 'draft' | 'submit'
  const [serverErrors, setServerErrors] = useState({});
  const [busy, setBusy] = useState(null); // 'draft' | 'submit'
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(location.state?.projectFlash || null);
  const [dirty, setDirty] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const createKey = useRef(newIdempotencyKey('create'));
  const submitKey = useRef(newIdempotencyKey('submit'));
  const topRef = useRef(null);

  const policy = project?.approval_policy || 'moderation';
  const status = project?.status || 'draft';
  const material = Boolean(project && (project.applications_count || 0) > 0);
  const moderation = project?.approval || {};

  const clientErrors = useMemo(
    () => (attempt ? validateProjectForm(form, attempt, { rubricsAvailable: (refs.rubrics || []).length > 0 }) : {}),
    [form, attempt, refs],
  );
  const check = useMemo(() => completeness(form), [form]);

  /*
   * The server only accepts `required_skills` that sit inside the chosen
   * career role's map (SkillMappedToCareerRole), but the picker offers the
   * whole taxonomy — so without this a company could pick a skill and get a
   * 422 it cannot explain. `null` = unknown map = do not filter.
   */
  const roleSkillKey = form.careerRoleId
    ? apiKey(PUBLICATION_ENDPOINTS.careerRoleSkills(form.careerRoleId), null, { variant: preview ? 'role-skills-preview' : 'role-skills' })
    : null;
  const roleSkills = useCachedQuery(roleSkillKey, () => loadCareerRoleSkills(form.careerRoleId, { preview }), { enabled: Boolean(form.careerRoleId) });
  const allowedSkillIds = useMemo(() => (Array.isArray(roleSkills.data) ? new Set(roleSkills.data) : null), [roleSkills.data]);

  // Changing the role can orphan a skill that was picked under the old one.
  // Those rows can never be saved, so drop them rather than let the form fail.
  useEffect(() => {
    if (!allowedSkillIds) return;
    setForm((f) => {
      const kept = f.skills.filter((s) => allowedSkillIds.has(s.skillId));
      return kept.length === f.skills.length ? f : { ...f, skills: kept };
    });
  }, [allowedSkillIds]);
  const errorFor = (field) => {
    if (serverErrors[field]) return serverErrors[field].text;
    if (clientErrors[field]) return t(clientErrors[field]);
    return null;
  };
  const sectionMissing = (s) => check.missing.filter((m) => m.section === s).length;

  const update = (patch) => {
    setForm((f) => ({ ...f, ...(typeof patch === 'function' ? patch(f) : patch) }));
    setDirty(true);
    if (Object.keys(serverErrors).length) setServerErrors({});
  };

  const goSection = (s) => {
    setSection(s);
    topRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };

  async function save({ quiet = false } = {}) {
    const errs = validateProjectForm(form, 'draft', { rubricsAvailable: (refs.rubrics || []).length > 0 });
    if (Object.keys(errs).length) {
      setAttempt((a) => a || 'draft');
      const first = Object.keys(errs)[0];
      setSection(sectionOf(first));
      setError({ message: t('prj.form.fixBeforeSave') });
      return null;
    }
    setBusy('draft'); setError(null); setServerErrors({});
    try {
      let saved;
      let materialChange = false;
      if (project?.id != null) {
        const res = await updateProjectDraft(project.id, form, { preview, refs });
        saved = res.project; materialChange = res.materialChange;
      } else {
        saved = await createProjectDraft(form, { preview, idempotencyKey: createKey.current, refs });
        // Keep this screen (and what was typed) — just give it the project's own address.
        if (saved?.id != null && typeof window !== 'undefined') window.history.replaceState(window.history.state, '', `/company/projects/${saved.id}/edit`);
      }
      if (saved) {
        setProject(saved);
        setQueryData(projectKeys.detail(saved.id, preview), saved, { touch: true });
      }
      setDirty(false);
      setSavedAt(new Date());
      if (!quiet) setFlash({ saved: true, materialChange });
      return saved;
    } catch (err) {
      if (err?.status === 401) return null;
      const mapped = mapServerErrors(err?.errors);
      setServerErrors(mapped);
      const first = Object.keys(mapped)[0];
      if (first) setSection(sectionOf(first));
      setError(err);
      return null;
    } finally { setBusy(null); }
  }

  async function submit() {
    setAttempt('submit');
    if (!check.complete) { setSection('review'); setError({ message: t('prj.form.incomplete', { n: check.missing.length }) }); return; }
    const saved = dirty || !project?.id ? await save({ quiet: true }) : project;
    if (!saved?.id) return;
    setBusy('submit'); setError(null);
    try {
      const next = await submitProject(saved.id, { preview, idempotencyKey: submitKey.current });
      if (next) setQueryData(projectKeys.detail(saved.id, preview), next, { touch: true });
      go(`/company/projects/${saved.id}`, { state: { projectFlash: { to: next?.status || 'submitted' } } });
    } catch (err) {
      if (err?.status === 401) return;
      const missing = err?.details?.missing;
      if (Array.isArray(missing) && missing.length) setSection('review');
      setServerErrors(mapServerErrors(err?.errors));
      setError(err);
    } finally { setBusy(null); }
  }

  const sectionTitle = (s) => t(`prj.sec.${s}`);
  const idx = FORM_SECTIONS.indexOf(section);
  const nextSection = FORM_SECTIONS[idx + 1];
  const prevSection = FORM_SECTIONS[idx - 1];
  const submitLabel = policy === 'owner_approval' ? t('prj.form.publish') : (status === 'changes_requested' ? t('prj.form.resubmit') : t('prj.form.submit'));

  return (
    <div className="cw-pj" ref={topRef}>
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      <PageHeader
        back={{ label: project?.id != null ? t('prj.detail.title') : t('prj.list.title'), onClick: () => go(project?.id != null ? `/company/projects/${project.id}` : '/company/projects') }}
        title={project?.id != null ? (form.title || t('prj.untitled')) : t('prj.form.createTitle')}
        sub={project?.id != null ? null : t('prj.form.sub')}
        actions={(
          <>
            {savedAt && !dirty && <span className="cw-pj-saved"><Check size={14} aria-hidden="true" /> {t('prj.form.savedNow')}</span>}
            <button type="button" className="cw-btn sec" onClick={() => save()} disabled={Boolean(busy)} aria-busy={busy === 'draft' || undefined}>
              <Save size={15} strokeWidth={1.9} aria-hidden="true" /> {busy === 'draft' ? t('prj.working') : t('prj.form.saveDraft')}
            </button>
          </>
        )}
      >
        {project?.id != null && <div className="cw-pj-ph-meta"><StatePill state={status} />{project.version != null && <span>{t('prj.version', { n: project.version })}</span>}</div>}
      </PageHeader>

      {flash && (
        <Notice
          title={flash.cloned ? t('prj.flash.cloned') : t('prj.flash.saved')}
          body={flash.cloned ? t('prj.flash.clonedBody', { title: flash.cloned }) : (flash.materialChange ? t('prj.flash.materialSaved') : t('prj.flash.savedBody'))}
          onClose={() => setFlash(null)}
        />
      )}
      {status === 'changes_requested' && (
        <div className="cw-pj-banner is-amber" role="status">
          <span className="cw-pj-banner-ic"><Info size={19} strokeWidth={1.9} aria-hidden="true" /></span>
          <div>
            <h3>{t('prj.banner.changes')}</h3>
            <p>{t('prj.form.changesBody')}</p>
            {moderation.reason && <div className="cw-pj-quote"><small>{t('prj.banner.moderatorSaid', { name: moderation.approver?.name || t('prj.banner.moderator') })}</small>{moderation.reason}</div>}
          </div>
        </div>
      )}
      {material && (
        // US-PRJ-02 BR-09 / Scenario 5 — material-change warning.
        <InlineAlert tone="amber" title={t('prj.form.materialTitle')} error={{ message: t('prj.form.materialBody', { n: project.applications_count, v: (project.version || 1) + 1 }) }} />
      )}
      {refsError && <InlineAlert tone="amber" error={{ message: t('prj.form.refsFailed') }} />}
      {!refsError && refs.failed?.length > 0 && <InlineAlert tone="amber" error={{ message: t('prj.form.refsPartial', { list: refs.failed.map((f) => t(`prj.refs.${f}`)).join(', ') }) }} />}
      {error && <InlineAlert error={error} title={t('prj.form.couldNot')} onClose={() => setError(null)} />}

      <div className="cw-pj-form">
        <nav className="cw-card cw-pj-steps" aria-label={t('prj.form.sections')}>
          <ol>
            {FORM_SECTIONS.map((s, i) => {
              const miss = s === 'review' ? 0 : sectionMissing(s);
              const hasErr = attempt && Object.keys(clientErrors).some((f) => sectionOf(f) === s);
              const done = s !== 'review' && miss === 0;
              return (
                <li key={s}>
                  <button type="button" className={`cw-pj-step${section === s ? ' on' : ''}${done ? ' done' : ''}${hasErr ? ' err' : ''}`} aria-current={section === s ? 'step' : undefined} onClick={() => goSection(s)}>
                    <span className="cw-pj-step-n">{done ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : i + 1}</span>
                    <span className="cw-pj-step-l">
                      {sectionTitle(s)}
                      <small>{s === 'review' ? (check.complete ? t('prj.form.readyToSubmit') : t('prj.form.nMissing', { n: check.missing.length })) : (done ? t('prj.form.complete') : t('prj.form.nMissing', { n: miss }))}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="cw-pj-steps-foot">
            <div className="cw-pf-muted">{t('prj.form.completeness')} <b>{check.percent}%</b></div>
            <div className="cw-pbar"><i style={{ width: `${check.percent}%` }} /></div>
          </div>
        </nav>

        <div className="cw-pj-col">
          <div className="cw-card cw-pj-mstep">
            <label className="cw-pj-sort" style={{ width: '100%' }}>
              <span>{t('prj.form.stepOf', { n: idx + 1, total: FORM_SECTIONS.length })}</span>
              <select value={section} onChange={(e) => goSection(e.target.value)} aria-label={t('prj.form.sections')}>
                {FORM_SECTIONS.map((s) => <option key={s} value={s}>{sectionTitle(s)}</option>)}
              </select>
            </label>
            <div className="cw-pbar" style={{ marginTop: 10 }}><i style={{ width: `${((idx + 1) / FORM_SECTIONS.length) * 100}%` }} /></div>
          </div>

          <section className="cw-card cw-pj-fcard" aria-labelledby="pj-sec-title">
            <header>
              <h2 id="pj-sec-title">{sectionTitle(section)}</h2>
              <p>{t(`prj.secSub.${section}`)}</p>
            </header>

            {section === 'basic' && <BasicSection form={form} update={update} errorFor={errorFor} t={t} />}
            {section === 'roles' && <RolesSection form={form} update={update} errorFor={errorFor} t={t} />}
            {section === 'skills' && <SkillsSection form={form} update={update} errorFor={errorFor} refs={refs} allowedSkillIds={allowedSkillIds} t={t} />}
            {section === 'confidentiality' && <ConfidentialitySection form={form} update={update} errorFor={errorFor} refs={refs} t={t} />}
            {section === 'review' && (
              <ReviewSection form={form} refs={refs} check={check} policy={policy} onFix={(m) => { setAttempt('submit'); goSection(m.section); }} goSection={goSection} t={t} />
            )}

            <div className="cw-pj-fnav">
              {prevSection && <button type="button" className="cw-btn sec" onClick={() => goSection(prevSection)}>{t('prj.form.back')}</button>}
              <div className="cw-sp" />
              {nextSection ? (
                <button type="button" className="cw-btn pri" onClick={() => goSection(nextSection)}>
                  {t('prj.form.next', { section: sectionTitle(nextSection) })} <ChevronRight className="cw-flip" size={15} aria-hidden="true" />
                </button>
              ) : (
                <div className="cw-pj-submitbar">
                  <button type="button" className="cw-btn sec" onClick={() => save()} disabled={Boolean(busy)}>{busy === 'draft' ? t('prj.working') : t('prj.form.saveDraft')}</button>
                  <button type="button" className="cw-btn pri" onClick={submit} disabled={Boolean(busy) || !check.complete} aria-describedby="pj-submit-note" aria-busy={busy === 'submit' || undefined}>
                    <Send size={15} strokeWidth={1.9} aria-hidden="true" /> {busy === 'submit' ? t('prj.working') : submitLabel}
                  </button>
                </div>
              )}
            </div>
            {section === 'review' && <p id="pj-submit-note" className="cw-pj-hint" style={{ marginTop: 10 }}>{policy === 'owner_approval' ? t('prj.form.publishNote') : t('prj.form.submitNote')}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Field helpers                                                       */
/* ------------------------------------------------------------------ */

function Field({ id, label, required, optional, error, hint, wide, children, t }) {
  return (
    <div className={`cw-pf-field${wide ? ' wide' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="cw-pf-req" aria-hidden="true">*</span>}
        {optional && <span className="cw-pf-opt">{t('prj.optional')}</span>}
      </label>
      {children}
      {error ? <span className="cw-pj-ferr" id={`${id}-err`}>{error}</span> : (hint ? <span className="cw-pj-hint" id={`${id}-hint`}>{hint}</span> : null)}
    </div>
  );
}

const aria = (id, error, hint) => ({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': error ? `${id}-err` : (hint ? `${id}-hint` : undefined) });

function ItemList({ id, items, onChange, placeholder, addLabel, error, t }) {
  const set = (i, v) => onChange(items.map((x, j) => (j === i ? v : x)));
  return (
    <div className="cw-pj-items">
      {items.map((v, i) => (
        <div className="cw-pj-item" key={i}>
          <span className="cw-pj-item-n" aria-hidden="true">{i + 1}</span>
          <input id={i === 0 ? id : undefined} value={v} placeholder={placeholder} aria-invalid={error && i === 0 ? 'true' : undefined} aria-label={`${placeholder} ${i + 1}`} onChange={(e) => set(i, e.target.value)} maxLength={300} />
          <button type="button" className="cw-pj-x" aria-label={t('prj.remove')} disabled={items.length === 1 && !v} onClick={() => onChange(items.length === 1 ? [''] : items.filter((_, j) => j !== i))}><Trash2 size={15} strokeWidth={1.8} aria-hidden="true" /></button>
        </div>
      ))}
      <button type="button" className="cw-pj-add" onClick={() => onChange([...items, ''])}><Plus size={15} strokeWidth={2.2} aria-hidden="true" /> {addLabel}</button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 1 — Basic Information (+ project type, PRJ-10)              */
/* ------------------------------------------------------------------ */

function BasicSection({ form, update, errorFor, t }) {
  const TYPE_ICON = { company_sponsored: Building2, simulation: FlaskConical };
  return (
    <>
      <div className="cw-pj-fgroup">
        <h3 id="pj-type-l">{t('prj.f.projectType')} <span className="cw-pf-req" aria-hidden="true">*</span></h3>
        <div className="cw-pj-types" role="radiogroup" aria-labelledby="pj-type-l" aria-describedby={errorFor('projectType') ? 'pj-type-err' : undefined}>
          {PROJECT_TYPES.map((type) => {
            const Icon = TYPE_ICON[type];
            const on = form.projectType === type;
            return (
              <label key={type} className={`cw-pj-type${on ? ' on' : ''}`}>
                <input type="radio" name="pj-type" value={type} checked={on} onChange={() => update({ projectType: type })} />
                <span className="cw-pj-type-chk"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
                <span className="cw-pj-type-ic"><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
                <b>{t(`prj.type.${type}`)}</b>
                <span>{t(`prj.typeDesc.${type}`)}</span>
              </label>
            );
          })}
        </div>
        {errorFor('projectType') && <span className="cw-pj-ferr" id="pj-type-err" style={{ display: 'block', marginTop: 8 }}>{errorFor('projectType')}</span>}
      </div>

      <div className="cw-pj-fgroup">
        <div className="cw-pf-fields">
          <Field id="pj-title" label={t('prj.f.title')} required wide error={errorFor('title')} t={t}>
            <input {...aria('pj-title', errorFor('title'))} value={form.title} maxLength={140} onChange={(e) => update({ title: e.target.value })} placeholder={t('prj.ph.title')} />
          </Field>
          <Field id="pj-summary" label={t('prj.f.summary')} required wide error={errorFor('summary')} hint={t('prj.hint.summary')} t={t}>
            <input {...aria('pj-summary', errorFor('summary'), true)} value={form.summary} maxLength={200} onChange={(e) => update({ summary: e.target.value })} />
          </Field>
          <Field id="pj-domain" label={t('prj.f.domain')} required error={errorFor('domain')} hint={t('prj.hint.domain')} t={t}>
            <input {...aria('pj-domain', errorFor('domain'), true)} value={form.domain} maxLength={80} onChange={(e) => update({ domain: e.target.value })} />
          </Field>
          <Field id="pj-scope" label={t('prj.f.scope')} required wide error={errorFor('scope')} hint={t('prj.hint.scope')} t={t}>
            <textarea {...aria('pj-scope', errorFor('scope'), true)} value={form.scope} rows={3} maxLength={2000} onChange={(e) => update({ scope: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="cw-pj-fgroup">
        <Field id="pj-objectives" label={t('prj.f.objectives')} required wide error={errorFor('objectives')} t={t}>
          <ItemList id="pj-objectives" items={form.objectives} onChange={(v) => update({ objectives: v })} placeholder={t('prj.ph.objective')} addLabel={t('prj.add.objective')} error={errorFor('objectives')} t={t} />
        </Field>
      </div>
      <div className="cw-pj-fgroup">
        <Field id="pj-deliverables" label={t('prj.f.deliverables')} required wide error={errorFor('deliverables')} t={t}>
          <ItemList id="pj-deliverables" items={form.deliverables} onChange={(v) => update({ deliverables: v })} placeholder={t('prj.ph.deliverable')} addLabel={t('prj.add.deliverable')} error={errorFor('deliverables')} t={t} />
        </Field>
      </div>
      <div className="cw-pj-fgroup">
        <Field id="pj-outcomes" label={t('prj.f.learningOutcomes')} required wide error={errorFor('learningOutcomes')} hint={t('prj.hint.outcomes')} t={t}>
          <ItemList id="pj-outcomes" items={form.learningOutcomes} onChange={(v) => update({ learningOutcomes: v })} placeholder={t('prj.ph.outcome')} addLabel={t('prj.add.outcome')} error={errorFor('learningOutcomes')} t={t} />
        </Field>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — Roles, Schedule & Capacity                              */
/* ------------------------------------------------------------------ */

function RolesSection({ form, update, errorFor, t }) {
  const setRole = (i, patch) => update((f) => ({ roles: f.roles.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const used = form.roles.reduce((a, r) => a + (Number(r.capacity) || 0), 0);
  const total = Number(form.totalCapacity) || 0;
  const over = total > 0 && used > total;
  const weeks = form.startDate && form.endDate && form.endDate >= form.startDate
    ? Math.max(1, Math.round((new Date(form.endDate) - new Date(form.startDate)) / (7 * 86400000))) : null;
  return (
    <>
      <div className="cw-pj-fgroup">
        <h3>{t('prj.f.roles')} <span className="cw-pf-req" aria-hidden="true">*</span> <small>{t('prj.hint.roles')}</small></h3>
        <div className="cw-pj-roletable">
          <div className="cw-pj-rolehead" aria-hidden="true"><span>{t('prj.f.roleName')}</span><span>{t('prj.f.roleCapacity')}</span><span>{t('prj.f.roleMin')}</span><span /></div>
          {form.roles.map((r, i) => {
            const nameErr = errorFor(`roles.${i}.name`);
            const capErr = errorFor(`roles.${i}.capacity`);
            const minErr = errorFor(`roles.${i}.minRequired`);
            return (
              <div className="cw-pj-rolerow" key={r.key}>
                <div><span className="cw-pj-rk">{t('prj.f.roleName')}</span><input aria-label={`${t('prj.f.roleName')} ${i + 1}`} value={r.name} placeholder={t('prj.ph.role')} aria-invalid={nameErr ? 'true' : undefined} onChange={(e) => setRole(i, { name: e.target.value })} maxLength={80} />{nameErr && <span className="cw-pj-ferr">{nameErr}</span>}</div>
                <div><span className="cw-pj-rk">{t('prj.f.roleCapacity')}</span><input aria-label={`${t('prj.f.roleCapacity')} ${i + 1}`} type="number" min="1" inputMode="numeric" value={r.capacity} aria-invalid={capErr ? 'true' : undefined} onChange={(e) => setRole(i, { capacity: e.target.value })} />{capErr && <span className="cw-pj-ferr">{capErr}</span>}</div>
                <div><span className="cw-pj-rk">{t('prj.f.roleMin')}</span><input aria-label={`${t('prj.f.roleMin')} ${i + 1}`} type="number" min="0" inputMode="numeric" value={r.minRequired} aria-invalid={minErr ? 'true' : undefined} onChange={(e) => setRole(i, { minRequired: e.target.value })} />{minErr && <span className="cw-pj-ferr">{minErr}</span>}</div>
                <button type="button" className="cw-pj-x" aria-label={t('prj.removeRole')} disabled={form.roles.length === 1} onClick={() => update((f) => ({ roles: f.roles.filter((_, j) => j !== i) }))}><Trash2 size={15} strokeWidth={1.8} aria-hidden="true" /></button>
              </div>
            );
          })}
          <button type="button" className="cw-pj-add" onClick={() => update((f) => ({ roles: [...f.roles, blankRole()] }))}><Plus size={15} strokeWidth={2.2} aria-hidden="true" /> {t('prj.add.role')}</button>
        </div>
        {errorFor('roles') && <span className="cw-pj-ferr" style={{ display: 'block', marginTop: 6 }}>{errorFor('roles')}</span>}
      </div>

      <div className="cw-pj-fgroup">
        <div className="cw-pf-fields">
          <Field id="pj-capacity" label={t('prj.f.totalCapacity')} required error={errorFor('totalCapacity')} hint={t('prj.hint.capacity')} t={t}>
            <input {...aria('pj-capacity', errorFor('totalCapacity'), true)} type="number" min="1" inputMode="numeric" value={form.totalCapacity} onChange={(e) => update({ totalCapacity: e.target.value })} />
          </Field>
          <div className="cw-pf-field">
            <span className="cw-pj-rk" style={{ display: 'block', fontSize: 13, color: 'var(--cw-ink)', fontWeight: 500 }}>{t('prj.f.rolePlaces')}</span>
            <div className={`cw-pj-sum${over ? ' is-over' : ''}`} role="status" style={{ marginTop: 0, minHeight: 42 }}>
              <div className="cw-bar"><i style={{ width: `${total ? Math.min(100, (used / total) * 100) : 0}%`, background: over ? 'var(--cw-red)' : undefined }} /></div>
              <span>{total ? t('prj.form.rolesUse', { used, total }) : t('prj.form.rolesUseNoTotal', { used })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cw-pj-fgroup">
        <h3>{t('prj.form.dates')}</h3>
        <div className="cw-pf-fields">
          <Field id="pj-start" label={t('prj.f.startDate')} required error={errorFor('startDate')} t={t}>
            <input {...aria('pj-start', errorFor('startDate'))} type="date" value={form.startDate} onChange={(e) => update({ startDate: e.target.value })} />
          </Field>
          <Field id="pj-end" label={t('prj.f.endDate')} required error={errorFor('endDate')} hint={weeks ? t('prj.weeksApprox', { n: weeks }) : null} t={t}>
            <input {...aria('pj-end', errorFor('endDate'), weeks)} type="date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => update({ endDate: e.target.value })} />
          </Field>
          <Field id="pj-deadline" label={t('prj.f.applicationDeadline')} required error={errorFor('applicationDeadline')} hint={t('prj.hint.deadline')} t={t}>
            <input {...aria('pj-deadline', errorFor('applicationDeadline'), true)} type="date" value={form.applicationDeadline} max={form.startDate || undefined} onChange={(e) => update({ applicationDeadline: e.target.value })} />
          </Field>
          <Field id="pj-weeks" label={t('prj.f.durationWeeks')} optional error={errorFor('durationWeeks')} t={t}>
            <input {...aria('pj-weeks', errorFor('durationWeeks'))} type="number" min="1" inputMode="numeric" value={form.durationWeeks} placeholder={weeks ? String(weeks) : ''} onChange={(e) => update({ durationWeeks: e.target.value })} />
          </Field>
          <Field id="pj-schedule" label={t('prj.f.schedule')} required wide error={errorFor('schedule')} hint={t('prj.hint.schedule')} t={t}>
            <input {...aria('pj-schedule', errorFor('schedule'), true)} value={form.schedule} maxLength={200} onChange={(e) => update({ schedule: e.target.value })} />
          </Field>
        </div>
      </div>

      <div className="cw-pj-fgroup">
        <h3 id="pj-mode-l">{t('prj.f.workMode')} <span className="cw-pf-req" aria-hidden="true">*</span></h3>
        <div className="cw-pj-seg" role="radiogroup" aria-labelledby="pj-mode-l">
          {WORK_MODES.map((m) => (
            <label key={m} className={form.workMode === m ? 'on' : ''}>
              <input type="radio" name="pj-mode" value={m} checked={form.workMode === m} onChange={() => update({ workMode: m })} />{t(`prj.mode.${m}`)}
            </label>
          ))}
        </div>
        {errorFor('workMode') && <span className="cw-pj-ferr" style={{ display: 'block', marginTop: 6 }}>{errorFor('workMode')}</span>}
        {(form.workMode === 'onsite' || form.workMode === 'hybrid') && (
          <div className="cw-pf-fields" style={{ marginTop: 16 }}>
            <Field id="pj-location" label={t('prj.f.location')} required error={errorFor('location')} t={t}>
              <input {...aria('pj-location', errorFor('location'))} value={form.location} maxLength={120} onChange={(e) => update({ location: e.target.value })} />
            </Field>
          </div>
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — Skills, Difficulty & Eligibility                        */
/* ------------------------------------------------------------------ */

function SkillPicker({ taxonomy, selected, allowed = null, onPick, t }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const needle = q.trim().toLowerCase();
  const groups = taxonomy.map((g) => ({
    ...g,
    // When the chosen role's map is known, only its skills are offerable —
    // anything else is rejected by the server.
    skills: g.skills.filter((s) => (!allowed || allowed.has(s.id)) && (!needle || s.name.toLowerCase().includes(needle))),
  })).filter((g) => g.skills.length);
  const pick = (s) => { onPick(s); setQ(''); setOpen(false); };
  const first = groups[0]?.skills.find((s) => !selected.includes(s.id));
  return (
    <div className="cw-pj-picker" ref={boxRef}>
      <div className="cw-pj-search">
        <Search size={16} strokeWidth={2} aria-hidden="true" />
        <input
          id="pj-skills"
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="pj-skill-pop"
          aria-autocomplete="list"
          value={q}
          placeholder={t('prj.ph.skill')}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter') { e.preventDefault(); if (first) pick(first); }
          }}
        />
      </div>
      {open && (
        <div className="cw-pj-pop" id="pj-skill-pop" role="listbox" aria-label={t('prj.f.skills')}>
          {!taxonomy.length && <div className="cw-pj-pop-empty">{t('prj.form.noTaxonomy')}</div>}
          {taxonomy.length > 0 && !groups.length && <div className="cw-pj-pop-empty">{t('prj.form.noSkillMatch')}</div>}
          {groups.map((g) => (
            <div key={g.key} role="group" aria-label={g.label}>
              {g.label && <div className="cw-pj-pop-g">{g.label}</div>}
              {g.skills.map((s) => {
                const taken = selected.includes(s.id);
                return (
                  <button key={s.id} type="button" role="option" aria-selected={taken} disabled={taken} className={`cw-pj-pop-o${first && first.id === s.id ? ' hl' : ''}`} onClick={() => pick(s)}>
                    <span>{s.name}</span>{taken ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LevelSelector({ value, onChange, label, t }) {
  return (
    <div>
      <div className="cw-pj-levels" role="radiogroup" aria-label={label}>
        {SKILL_LEVELS.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} title={t(`prj.level.${SKILL_LEVEL_KEYS[n]}`)} className={value === n ? 'on' : (n < value ? 'in' : '')} onClick={() => onChange(n)}>{n}</button>
        ))}
      </div>
      <span className="cw-pj-lvlname">{t('prj.skill.minShort', { name: t(`prj.level.${SKILL_LEVEL_KEYS[value] || 'awareness'}`) })}</span>
    </div>
  );
}

function SkillsSection({ form, update, errorFor, refs, allowedSkillIds = null, t }) {
  const selectedIds = form.skills.map((s) => s.skillId);
  const setSkill = (i, patch) => update((f) => ({ skills: f.skills.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const e = form.eligibility;
  const setElig = (patch) => update((f) => ({ eligibility: { ...f.eligibility, ...patch } }));
  return (
    <>
      <div className="cw-pj-fgroup">
        <Field id="pj-skills" label={t('prj.f.skills')} required wide error={errorFor('skills')} hint={t('prj.hint.skills')} t={t}>
          <SkillPicker taxonomy={refs.taxonomy || []} selected={selectedIds} allowed={allowedSkillIds} onPick={(s) => update((f) => ({ skills: [...f.skills, { skillId: s.id, skillName: s.name, minLevel: 2, critical: false }] }))} t={t} />
        </Field>
        {form.skills.length > 0 && (
          <div className="cw-pj-sklist">
            {form.skills.map((s, i) => (
              <div className="cw-pj-skrow" key={s.skillId}>
                <div className="cw-pj-skrow-n"><b>{s.skillName}</b><small>{t('prj.skill.fromTaxonomy')}</small>{errorFor(`skills.${i}.minLevel`) && <span className="cw-pj-ferr" style={{ display: 'block' }}>{errorFor(`skills.${i}.minLevel`)}</span>}</div>
                <LevelSelector value={Number(s.minLevel)} onChange={(n) => setSkill(i, { minLevel: n })} label={t('prj.skill.levelFor', { name: s.skillName })} t={t} />
                <label className="cw-pj-toggle" title={t('prj.skill.criticalHint')}>
                  <input type="checkbox" checked={Boolean(s.critical)} onChange={(ev) => setSkill(i, { critical: ev.target.checked })} />
                  {t('prj.skill.critical')}
                </label>
                <button type="button" className="cw-pj-x" aria-label={t('prj.skill.remove', { name: s.skillName })} onClick={() => update((f) => ({ skills: f.skills.filter((_, j) => j !== i) }))}><X size={16} strokeWidth={1.9} aria-hidden="true" /></button>
              </div>
            ))}
            <p className="cw-pj-hint">{t('prj.skill.criticalHint')}</p>
          </div>
        )}
      </div>

      <div className="cw-pj-fgroup">
        <h3 id="pj-diff-l">{t('prj.f.difficulty')} <span className="cw-pf-req" aria-hidden="true">*</span></h3>
        <div className="cw-pj-seg" role="radiogroup" aria-labelledby="pj-diff-l">
          {DIFFICULTIES.map((d) => (
            <label key={d} className={form.difficulty === d ? 'on' : ''}><input type="radio" name="pj-diff" value={d} checked={form.difficulty === d} onChange={() => update({ difficulty: d })} />{t(`prj.diff.${d}`)}</label>
          ))}
        </div>
        {errorFor('difficulty') && <span className="cw-pj-ferr" style={{ display: 'block', marginTop: 6 }}>{errorFor('difficulty')}</span>}
        <div className="cw-pf-fields" style={{ marginTop: 18 }}>
          <Field id="pj-career" label={t('prj.f.careerRole')} optional hint={t('prj.hint.careerRole')} t={t}>
            <select {...aria('pj-career', null, true)} value={form.careerRoleId} onChange={(ev) => update({ careerRoleId: ev.target.value })}>
              <option value="">{t('prj.form.noCareerRole')}</option>
              {(refs.careerRoles || []).map((r) => <option key={r.id} value={String(r.id)}>{r.title}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="cw-pj-fgroup">
        <h3>{t('prj.f.eligibility')} <span className="cw-pf-req" aria-hidden="true">*</span> <small>{t('prj.hint.eligibility')}</small></h3>
        <label className="cw-pj-check">
          <input type="checkbox" checked={Boolean(e.openToAll)} onChange={(ev) => setElig({ openToAll: ev.target.checked })} />
          <span>{t('prj.elig.openToAll')}<small>{t('prj.elig.openToAllHint')}</small></span>
        </label>
        <div className="cw-pf-fields" style={{ marginTop: 16 }}>
          {['organization', 'location', 'language', 'schedule', 'workMode'].map((k) => (
            <Field key={k} id={`pj-el-${k}`} label={t(`prj.elig.${k}`)} optional t={t}>
              <input id={`pj-el-${k}`} value={e[k] || ''} placeholder={t(`prj.elig.ph.${k}`)} maxLength={160} onChange={(ev) => setElig({ [k]: ev.target.value })} />
            </Field>
          ))}
        </div>
        {errorFor('eligibility') && <span className="cw-pj-ferr" style={{ display: 'block', marginTop: 8 }}>{errorFor('eligibility')}</span>}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — Confidentiality & Evaluation (PRJ-08, PRJ-09)           */
/* ------------------------------------------------------------------ */

function ConfidentialitySection({ form, update, errorFor, refs, t }) {
  const rubrics = refs.rubrics || [];
  return (
    <>
      <div className="cw-pj-fgroup">
        <h3 id="pj-conf-l">{t('prj.f.confidentiality')}</h3>
        <div className="cw-pj-types" role="radiogroup" aria-labelledby="pj-conf-l">
          {CONFIDENTIALITY.map((c) => {
            const on = form.confidentiality === c;
            const Icon = c === 'confidential' ? Lock : ShieldCheck;
            return (
              <label key={c} className={`cw-pj-type${on ? ' on' : ''}`}>
                <input type="radio" name="pj-conf" value={c} checked={on} onChange={() => update({ confidentiality: c })} />
                <span className="cw-pj-type-chk"><Check size={12} strokeWidth={3} aria-hidden="true" /></span>
                <span className="cw-pj-type-ic"><Icon size={19} strokeWidth={1.9} aria-hidden="true" /></span>
                <b>{t(`prj.conf.${c}`)}</b>
                <span>{t(`prj.conf.${c}Desc`)}</span>
              </label>
            );
          })}
        </div>
        {form.confidentiality === 'confidential' && (
          <div className="cw-pf-fields" style={{ marginTop: 18 }}>
            <Field id="pj-confinfo" label={t('prj.f.confidentialInfo')} required wide error={errorFor('confidentialInfo')} hint={t('prj.hint.confidentialInfo')} t={t}>
              <textarea {...aria('pj-confinfo', errorFor('confidentialInfo'), true)} rows={3} maxLength={3000} value={form.confidentialInfo} onChange={(e) => update({ confidentialInfo: e.target.value })} />
            </Field>
          </div>
        )}
      </div>

      <div className="cw-pj-fgroup">
        <h3 id="pj-rub-l">{t('prj.f.rubric')} <span className="cw-pf-req" aria-hidden="true">*</span> <small>{t('prj.hint.rubric')}</small></h3>
        {rubrics.length ? (
          <div className="cw-pj-rubrics" role="radiogroup" aria-labelledby="pj-rub-l">
            {rubrics.map((r) => {
              const on = String(form.rubricId) === String(r.id);
              return (
                <label key={r.id} className={`cw-pj-rubric${on ? ' on' : ''}`}>
                  <input type="radio" name="pj-rubric" value={r.id} checked={on} onChange={() => update({ rubricId: String(r.id) })} />
                  <ClipboardCheck size={18} strokeWidth={1.8} aria-hidden="true" style={{ color: 'var(--cw-blue)', flex: 'none' }} />
                  <div><b>{r.name}</b><small>{[t('prj.rubric.version', { v: r.version }), r.criteria ? t('prj.rubric.criteria', { n: r.criteria }) : null].filter(Boolean).join(' · ')}</small></div>
                  <span className="cw-pill p-green"><BadgeCheck size={12} aria-hidden="true" />{t('prj.rubric.approved')}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <InlineAlert tone="amber" error={{ message: t('prj.rubric.noneAvailable') }} />
        )}
        {errorFor('rubricId') && <span className="cw-pj-ferr" style={{ display: 'block', marginTop: 8 }}>{errorFor('rubricId')}</span>}
        <p className="cw-pj-hint" style={{ marginTop: 10 }}>{t('prj.rubric.requiredToOpen')}</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Section 5 — Review & Submit (completeness check)                    */
/* ------------------------------------------------------------------ */

function ReviewBlock({ id, goSection, t, children }) {
  return (
    <div className="cw-pj-rv-sec">
      <header><h3>{t(`prj.sec.${id}`)}</h3><button type="button" className="cw-link" onClick={() => goSection(id)}>{t('prj.form.edit')}</button></header>
      <dl className="cw-pj-dl">{children}</dl>
    </div>
  );
}

function D({ label, children, wide }) {
  return <div className={wide ? 'wide' : undefined}><dt>{label}</dt><dd>{children}</dd></div>;
}

function ReviewSection({ form, refs, check, policy, onFix, goSection, t }) {
  const { lang } = useCompanyI18n();
  const day = (iso) => (iso ? formatDate(iso, lang) : null);
  const rubric = (refs.rubrics || []).find((r) => String(r.id) === String(form.rubricId));
  const career = (refs.careerRoles || []).find((r) => String(r.id) === String(form.careerRoleId));
  const list = (arr) => arr.map((x) => String(x).trim()).filter(Boolean);
  const dash = <span className="cw-pf-empty">{t('prj.notSet')}</span>;
  const val = (v) => (v ? v : dash);
  return (
    <div className="cw-pj-review">
      <div className={`cw-pj-check-card ${check.complete ? 'is-ok' : 'is-miss'}`} role="status">
        <h3>{check.complete ? <BadgeCheck size={18} aria-hidden="true" style={{ color: 'var(--cw-green)' }} /> : <Info size={18} aria-hidden="true" style={{ color: 'var(--cw-amber-ink)' }} />}{check.complete ? t('prj.check.ready') : t('prj.check.missing', { n: check.missing.length })}</h3>
        <p>{check.complete ? (policy === 'owner_approval' ? t('prj.check.readyPublish') : t('prj.check.readyBody')) : t('prj.check.missingBody')}</p>
        {!check.complete && (
          <ul className="cw-pj-miss">
            {check.missing.map((m) => (
              <li key={m.field}>
                <button type="button" onClick={() => onFix(m)}>
                  <span>{t(`prj.missing.${m.field.split('.')[0]}`)}{m.field.includes('.') ? ` ${Number(m.field.split('.')[1]) + 1}` : ''}</span>
                  <span className="cw-pj-miss-sec">{t(`prj.sec.${m.section}`)}</span>
                  <span className="cw-pj-miss-go">{t('prj.check.fix')} <ChevronRight className="cw-flip" size={13} aria-hidden="true" /></span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ReviewBlock id="basic" goSection={goSection} t={t}>
        <D label={t('prj.f.projectType')}>{form.projectType ? t(`prj.type.${form.projectType}`) : dash}</D>
        <D label={t('prj.f.domain')}>{val(form.domain)}</D>
        <D label={t('prj.f.title')} wide>{val(form.title)}</D>
        <D label={t('prj.f.summary')} wide>{val(form.summary)}</D>
        <D label={t('prj.f.objectives')}>{list(form.objectives).length ? <ul className="cw-pj-bul">{list(form.objectives).map((x, i) => <li key={i}>{x}</li>)}</ul> : dash}</D>
        <D label={t('prj.f.deliverables')}>{list(form.deliverables).length ? <ul className="cw-pj-bul">{list(form.deliverables).map((x, i) => <li key={i}>{x}</li>)}</ul> : dash}</D>
      </ReviewBlock>
      <ReviewBlock id="roles" goSection={goSection} t={t}>
        <D label={t('prj.f.roles')} wide>{form.roles.filter((r) => r.name).length ? <ul className="cw-pj-bul">{form.roles.filter((r) => r.name).map((r) => <li key={r.key}>{r.name} · {t('prj.side.rolePlaces', { n: r.capacity || 0, min: r.minRequired || 0 })}</li>)}</ul> : dash}</D>
        <D label={t('prj.f.totalCapacity')}>{val(form.totalCapacity)}</D>
        <D label={t('prj.f.workMode')}>{form.workMode ? `${t(`prj.mode.${form.workMode}`)}${form.location ? ` · ${form.location}` : ''}` : dash}</D>
        <D label={t('prj.f.startDate')}>{val(day(form.startDate))}</D>
        <D label={t('prj.f.endDate')}>{val(day(form.endDate))}</D>
        <D label={t('prj.f.applicationDeadline')}>{val(day(form.applicationDeadline))}</D>
        <D label={t('prj.f.schedule')}>{val(form.schedule)}</D>
      </ReviewBlock>
      <ReviewBlock id="skills" goSection={goSection} t={t}>
        <D label={t('prj.f.skills')} wide>{form.skills.length ? <div className="cw-pj-skill-list">{form.skills.map((s) => <SkillLine key={s.skillId} skill={s} t={t} />)}</div> : dash}</D>
        <D label={t('prj.f.difficulty')}>{form.difficulty ? t(`prj.diff.${form.difficulty}`) : dash}</D>
        <D label={t('prj.f.careerRole')}>{career?.title || dash}</D>
      </ReviewBlock>
      <ReviewBlock id="confidentiality" goSection={goSection} t={t}>
        <D label={t('prj.f.confidentiality')}>{t(`prj.conf.${form.confidentiality}`)}</D>
        <D label={t('prj.f.rubric')}>{rubric ? `${rubric.name} · ${t('prj.rubric.version', { v: rubric.version })}` : dash}</D>
      </ReviewBlock>
    </div>
  );
}
