import { useState } from 'react';
import { BadgeCheck, CircleDashed, FolderPlus, Plus, Send } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { ConfirmDialog, InlineAlert, TonePill } from '../projects/common';
import { BAND_TONE, CONTACT_BLOCK_CODES } from './talentApi';

/** Readiness band + score — text label, never colour alone (NFR-USA-04). */
export function Readiness({ readiness, compact = false }) {
  const { t } = useCompanyI18n();
  if (!readiness || readiness.band == null) return <TonePill tone="gray">{t('tal.notRated')}</TonePill>;
  return (
    <span className={`cw-tl-ready${compact ? ' is-compact' : ''}`}>
      <TonePill tone={BAND_TONE[readiness.band] || 'gray'}>{t(`tal.band.${readiness.band}`)}</TonePill>
      {readiness.score != null && (
        <span className="cw-tl-score" aria-label={t('tal.scoreAria', { n: readiness.score })}>
          <span className="cw-bar"><i style={{ width: `${Math.max(0, Math.min(100, readiness.score))}%` }} /></span>
          <b>{readiness.score}</b>
        </span>
      )}
    </span>
  );
}

/** Verified vs self-declared are visually distinct and labelled (COMP-06 BR-03, AC-03). */
export function SkillChip({ skill }) {
  const { t } = useCompanyI18n();
  const verified = skill.verified === true;
  return (
    <span className={`cw-tl-skill ${verified ? 'is-verified' : 'is-self'}`}>
      {verified ? <BadgeCheck size={13} aria-hidden="true" /> : <CircleDashed size={13} aria-hidden="true" />}
      <span>{skill.name}</span>
      {skill.level != null && <b>{skill.level}/5</b>}
      <span className="cw-vh">{verified ? t('tal.verified') : t('tal.selfDeclared')}</span>
    </span>
  );
}

/** Save one or more candidates to a new or existing list (US-COMP-07 Scenario 1). */
export function SaveToListDialog({ lists, count, busy, error, onSave, onCreate, onClose }) {
  const { t } = useCompanyI18n();
  const [mode, setMode] = useState(lists.length ? 'existing' : 'new');
  const [listId, setListId] = useState(lists[0]?.id || '');
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = mode === 'new' && !name.trim();
  return (
    <ConfirmDialog
      icon={FolderPlus}
      title={t('tal.save.title', { n: count })}
      body={t('tal.save.body')}
      confirmLabel={mode === 'new' ? t('tal.save.create') : t('tal.save.add')}
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirm={() => { setTouched(true); if (missing) return; if (mode === 'new') onCreate(name.trim()); else onSave(listId); }}
    >
      {lists.length > 0 && (
        <div className="cw-pj-seg cw-tl-seg" role="radiogroup" aria-label={t('tal.save.where')}>
          <label className={mode === 'existing' ? 'on' : ''}><input type="radio" name="tl-save" checked={mode === 'existing'} onChange={() => setMode('existing')} />{t('tal.save.existing')}</label>
          <label className={mode === 'new' ? 'on' : ''}><input type="radio" name="tl-save" checked={mode === 'new'} onChange={() => setMode('new')} />{t('tal.save.newList')}</label>
        </div>
      )}
      {mode === 'existing' ? (
        <div className="cw-pf-field cw-pj-reason">
          <label htmlFor="tl-save-list">{t('tal.save.list')}</label>
          <select id="tl-save-list" value={listId} onChange={(e) => setListId(e.target.value)}>
            {lists.map((l) => <option key={l.id} value={l.id}>{t('tal.save.option', { name: l.name, n: l.count })}</option>)}
          </select>
        </div>
      ) : (
        <div className="cw-pf-field cw-pj-reason">
          <label htmlFor="tl-save-name">{t('tal.save.name')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
          <input id="tl-save-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder={t('tal.save.namePh')} aria-invalid={touched && missing ? 'true' : undefined} />
          {touched && missing && <span className="cw-pj-ferr">{t('tal.save.nameRequired')}</span>}
        </div>
      )}
      <p className="cw-pf-muted" style={{ fontSize: 12.5 }}>{t('tal.save.private')}</p>
    </ConfirmDialog>
  );
}

/** Invite or message (US-COMP-07 Scenario 3) — blocked reasons shown as sent by the server (Scenario 4). */
export function ContactDialog({ name, projects, busy, error, onSend, onClose }) {
  const { t } = useCompanyI18n();
  const [type, setType] = useState('invite');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = !message.trim() || (type === 'invite' && projects.length > 0 && !projectId);
  const blocked = error && CONTACT_BLOCK_CODES.includes(error.code);
  return (
    <ConfirmDialog
      icon={Send}
      title={t('tal.contact.title', { name })}
      body={t('tal.contact.body')}
      confirmLabel={type === 'invite' ? t('tal.contact.sendInvite') : t('tal.contact.sendMessage')}
      busy={busy}
      error={blocked ? null : error}
      onClose={onClose}
      onConfirm={() => { setTouched(true); if (!missing) onSend({ type, message: message.trim(), projectId: type === 'invite' ? projectId : null }); }}
    >
      {blocked && (
        <InlineAlert tone="amber" title={t(`tal.contact.blocked.${error.code}`)} error={{ message: error.message }} />
      )}
      <div className="cw-pj-seg cw-tl-seg" role="radiogroup" aria-label={t('tal.contact.type')}>
        <label className={type === 'invite' ? 'on' : ''}><input type="radio" name="tl-ct" checked={type === 'invite'} onChange={() => setType('invite')} />{t('tal.contact.invite')}</label>
        <label className={type === 'message' ? 'on' : ''}><input type="radio" name="tl-ct" checked={type === 'message'} onChange={() => setType('message')} />{t('tal.contact.message')}</label>
      </div>
      {type === 'invite' && projects.length > 0 && (
        <div className="cw-pf-field cw-pj-reason">
          <label htmlFor="tl-ct-project">{t('tal.contact.project')}</label>
          <select id="tl-ct-project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div className="cw-pf-field cw-pj-reason">
        <label htmlFor="tl-ct-msg">{t('tal.contact.text')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
        <textarea id="tl-ct-msg" rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={type === 'invite' ? t('tal.contact.invitePh') : t('tal.contact.messagePh')} aria-invalid={touched && !message.trim() ? 'true' : undefined} />
        {touched && !message.trim() && <span className="cw-pj-ferr">{t('team.exc.required')}</span>}
      </div>
      <p className="cw-pf-muted" style={{ fontSize: 12.5 }}>{t('tal.contact.rules')}</p>
    </ConfirmDialog>
  );
}

export function AddButton({ children, ...rest }) {
  return <button type="button" className="cw-btn sec sm" {...rest}><Plus size={14} aria-hidden="true" /> {children}</button>;
}
