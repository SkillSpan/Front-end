import { useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowUpCircle, BadgeCheck, Briefcase, CheckCircle2, Lock, PlayCircle, Send, ShieldAlert, UserPlus, Users, X,
} from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import EmptyState from '../dashboard/EmptyState';
import { setQueryData } from '../../../cache/queryCache';
import { ConfirmDialog, InlineAlert, Notice, PageFailure, PageHeader, StatePill, TonePill } from '../projects/common';
import { useCompanyPermissions, usePageData } from '../projects/hooks';
import { newIdempotencyKey } from '../projects/api/shared';
import { initials } from '../applications/people';
import {
  assignToRoles, COMPOSITION_CODES, CONFLICT_CODES, CRITICAL_SKILL_CODES, getTeam, promoteFromWaitlist, removeAssignment, sendInvitations, startProject, teamKeys,
} from './teamFormationApi';
import { applyTeamPreview } from './teamPreview';

/**
 * Team Formation & Project Start (US-MATCH-04) — /company/projects/:id/team
 *
 *   Scenario 1  accepted participants + roles with remaining capacity; assign (AC-01/02/03)
 *   Scenario 2  Send Invitations → pending (AC-06)
 *   Scenario 3  responses arrive; a decline releases the place → promote from waitlist (AC-08)
 *   Scenario 4  critical-skill gap → exception dialog (support + risk) (AC-04)
 *   Scenario 5  Start Project → team + workspace record + Active, atomically on the server (AC-10/11)
 *   Scenario 6  unfilled required roles are listed and block the start (AC-09)
 *   BR-07       a participant on a conflicting active team cannot be assigned (AC-05)
 * Preview (?preview=…): loading | error | denied | notfound | readonly | ready | declined | conflict | active.
 */
const PREVIEW_SCENARIOS = ['ready', 'declined', 'conflict', 'active'];

export default function TeamFormation({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const perms = useCompanyPermissions({ demo, previewState });
  // Preview scenario applied once, before the first fetch (useState initializer runs once).
  useState(() => { if (preview && PREVIEW_SCENARIOS.includes(previewState)) applyTeamPreview(id, previewState); return true; });

  const key = teamKeys.team(id, preview);
  const page = usePageData(key, () => getTeam(id, { preview }), { previewState, user });
  const team = page.data;

  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);
  const [exceptionFor, setExceptionFor] = useState(null); // { participant, roleId, gaps }
  const [confirm, setConfirm] = useState(null); // 'start' | { promote } | { remove }
  const [roleChoice, setRoleChoice] = useState({});
  const inviteKey = useRef(null);
  const startKey = useRef(null);
  const promoteKeys = useRef({});

  const fmt = (iso) => (iso ? formatDate(String(iso).slice(0, 10), lang) : '');
  const header = (
    <PageHeader
      back={{ label: t('prj.detail.title'), onClick: () => go(`/company/projects/${id}`) }}
      title={t('team.title')}
      sub={team?.project?.title || null}
    >
      {team?.project && <div className="cw-pj-ph-meta"><StatePill state={team.project.status} />{team.project.startDate && <span>{t('team.startsOn', { date: fmt(team.project.startDate) })}</span>}</div>}
    </PageHeader>
  );

  const canManage = perms.can_review_applications && team?.project?.status === 'selection';
  const roleById = useMemo(() => Object.fromEntries((team?.roles || []).map((r) => [String(r.id), r])), [team]);

  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('team.title')} onNavigate={go} backTo={{ route: `/company/projects/${id}`, label: t('prj.form.backToProject') }} variant="detail" /></>;
  if (page.status === 'loading' || !team) {
    return (
      <div className="cw-pj" aria-busy="true">
        {header}
        <div className="cw-pj-grid">
          <div className="cw-pj-col">{[0, 1, 2].map((i) => <section key={i} className="cw-card"><span className="cw-sk" style={{ width: '35%', height: 14 }} /><span className="cw-sk" style={{ width: '100%', height: 8, marginTop: 14, borderRadius: 99 }} /><span className="cw-sk" style={{ width: '70%', height: 36, marginTop: 14 }} /></section>)}</div>
          <aside className="cw-pj-col"><section className="cw-card"><span className="cw-sk" style={{ width: '50%', height: 14 }} /><span className="cw-sk" style={{ width: '100%', height: 48, marginTop: 14 }} /></section></aside>
        </div>
      </div>
    );
  }

  const status = team.project?.status;
  if (!['selection', 'active', 'under_review', 'completed'].includes(status)) {
    return (
      <div className="cw-pj">
        {header}
        <section className="cw-card"><EmptyState icon={Lock} title={t('team.notYet')} body={t('team.notYetBody', { state: t(`company.ws.state.${status}`) })} action={<button type="button" className="cw-btn ghost" onClick={() => go(`/company/projects/${id}`)}>{t('prj.form.backToProject')}</button>} /></section>
      </div>
    );
  }

  const assigned = team.participants.filter((p) => p.assignment);
  const unassigned = team.participants.filter((p) => !p.assignment && !p.declined);
  const declined = team.participants.filter((p) => !p.assignment && p.declined);
  const toInvite = assigned.filter((p) => p.assignment.status === 'assigned' && !p.assignment.invitation);
  const pending = assigned.filter((p) => p.assignment.invitation?.status === 'pending');
  const valid = team.composition.valid;

  const apply = (next, message) => { if (next) setQueryData(key, next, { touch: true }); if (message) setFlash(message); setError(null); };
  const fail = (err) => { if (err?.status !== 401) setError(err); };

  async function assign(participant, roleId, exception) {
    setBusy(`assign-${participant.applicationId}`); setError(null);
    try {
      const next = await assignToRoles(id, [{ applicationId: participant.applicationId, roleId, exception }], { preview });
      apply(next, { title: t('team.flash.assigned', { name: participant.name, role: roleById[String(roleId)]?.name || '' }), body: exception ? t('team.flash.exception') : t('team.flash.assignedBody') });
      setExceptionFor(null);
    } catch (err) {
      if (CRITICAL_SKILL_CODES.includes(err?.code)) {
        const gaps = (err.details?.gaps || []).map((g) => ({ name: g.skill_name, required: g.required_level, level: g.level }));
        setExceptionFor({ participant, roleId, gaps: gaps.length ? gaps : participant.gaps });
      } else fail(err);
    } finally { setBusy(null); }
  }

  function onAssign(participant) {
    const roleId = roleChoice[participant.applicationId] ?? defaultRole(participant, team.roles);
    if (!roleId) return;
    // Scenario 4 — open the exception dialog straight away when the gap is already known.
    if (participant.gaps.length && !(participant.exception && participant.exception.status === 'approved')) {
      setExceptionFor({ participant, roleId, gaps: participant.gaps });
      return;
    }
    assign(participant, roleId);
  }

  async function unassign(participant) {
    setBusy(`remove-${participant.applicationId}`);
    try { apply(await removeAssignment(id, participant.applicationId, { preview }), { title: t('team.flash.removed', { name: participant.name }) }); setConfirm(null); } catch (err) { fail(err); } finally { setBusy(null); }
  }

  async function invite() {
    setBusy('invite');
    if (!inviteKey.current) inviteKey.current = newIdempotencyKey('invite');
    try {
      const n = toInvite.length;
      apply(await sendInvitations(id, { preview, idempotencyKey: inviteKey.current }), { title: t('team.flash.invited', { n }), body: t('team.flash.invitedBody') });
      inviteKey.current = null;
    } catch (err) { fail(err); } finally { setBusy(null); }
  }

  async function promote(w) {
    setBusy(`promote-${w.applicationId}`);
    if (!promoteKeys.current[w.applicationId]) promoteKeys.current[w.applicationId] = newIdempotencyKey('promote');
    try {
      await promoteFromWaitlist(w.applicationId, { preview, idempotencyKey: promoteKeys.current[w.applicationId] });
      delete promoteKeys.current[w.applicationId];
      apply(await getTeam(id, { preview }), { title: t('team.flash.promoted', { name: w.name }), body: t('team.flash.promotedBody') });
      setConfirm(null);
    } catch (err) { setConfirm(null); fail(err); } finally { setBusy(null); }
  }

  async function start() {
    setBusy('start');
    if (!startKey.current) startKey.current = newIdempotencyKey('start');
    try {
      await startProject(id, { preview, idempotencyKey: startKey.current });
      startKey.current = null;
      apply(await getTeam(id, { preview }), { title: t('team.flash.started'), body: t('team.flash.startedBody') });
      setConfirm(null);
    } catch (err) {
      setConfirm(null);
      if (COMPOSITION_CODES.includes(err?.code)) page.refetch?.().catch?.(() => {});
      fail(err);
    } finally { setBusy(null); }
  }

  const unfilledFromError = COMPOSITION_CODES.includes(error?.code) ? (error.details?.unfilled_roles || []) : null;

  return (
    <div className="cw-pj">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      <PageHeader
        back={{ label: t('prj.detail.title'), onClick: () => go(`/company/projects/${id}`) }}
        title={t('team.title')}
        sub={team.project?.title || null}
        actions={canManage ? (
          <>
            {toInvite.length > 0 && (
              <button type="button" className="cw-btn sec" onClick={invite} disabled={Boolean(busy)} aria-busy={busy === 'invite' || undefined}>
                <Send size={15} strokeWidth={1.9} aria-hidden="true" /> {busy === 'invite' ? t('prj.working') : t('team.sendInvites', { n: toInvite.length })}
              </button>
            )}
            <button type="button" className="cw-btn pri" onClick={() => setConfirm('start')} disabled={Boolean(busy) || !valid} aria-describedby={!valid ? 'team-comp' : undefined}>
              <PlayCircle size={16} strokeWidth={1.9} aria-hidden="true" /> {t('team.start')}
            </button>
          </>
        ) : null}
      >
        <div className="cw-pj-ph-meta"><StatePill state={status} />{team.project?.startDate && <span>{t('team.startsOn', { date: fmt(team.project.startDate) })}</span>}</div>
      </PageHeader>

      {flash && <Notice title={flash.title} body={flash.body} onClose={() => setFlash(null)} />}
      {error && (
        <InlineAlert error={error} title={COMPOSITION_CODES.includes(error.code) ? t('team.err.composition') : CONFLICT_CODES.includes(error.code) ? t('team.err.conflict') : t('prj.form.couldNot')} onClose={() => setError(null)}>
          {unfilledFromError?.length > 0 && <ul className="cw-tm-unfilled">{unfilledFromError.map((u) => <li key={u.id ?? u.name}>{t('team.needsMore', { role: u.name, n: u.needed ?? 1 })}</li>)}</ul>}
        </InlineAlert>
      )}

      {status !== 'selection' ? (
        <div className="cw-pj-banner is-green" role="status">
          <span className="cw-pj-banner-ic"><CheckCircle2 size={19} strokeWidth={1.9} aria-hidden="true" /></span>
          <div>
            <h3>{t('team.activeTitle')}</h3>
            <p>{team.workspace ? t('team.activeBody', { date: fmt(team.workspace.created_at) }) : t('team.activeBodyNoWs')}</p>
          </div>
        </div>
      ) : (
        <div id="team-comp" className={`cw-pj-banner ${valid ? 'is-green' : 'is-amber'}`} role="status">
          <span className="cw-pj-banner-ic">{valid ? <BadgeCheck size={19} strokeWidth={1.9} aria-hidden="true" /> : <AlertTriangle size={19} strokeWidth={1.9} aria-hidden="true" />}</span>
          <div>
            <h3>{valid ? t('team.validTitle') : t('team.invalidTitle')}</h3>
            {valid ? <p>{t('team.validBody')}</p> : (
              <>
                <p>{t('team.invalidBody')}</p>
                <ul className="cw-tm-unfilled">{team.composition.unfilled.map((u) => <li key={u.id}>{t('team.needsMore', { role: u.name, n: u.needed })}</li>)}</ul>
              </>
            )}
            {pending.length > 0 && <p className="cw-tm-pendnote">{t('team.pendingNote', { n: pending.length })}</p>}
          </div>
        </div>
      )}

      <div className="cw-pj-grid cw-tm-grid">
        <div className="cw-pj-col">
          <h2 className="cw-tm-h2">{t('team.roles')}</h2>
          {team.roles.map((r) => {
            const members = assigned.filter((p) => String(p.assignment.roleId) === String(r.id));
            const short = r.confirmed < r.minRequired;
            return (
              <section key={r.id} className="cw-card cw-tm-role" aria-labelledby={`role-${r.id}`}>
                <header>
                  <span className="cw-tm-role-ic"><Briefcase size={17} strokeWidth={1.9} aria-hidden="true" /></span>
                  <div className="cw-tm-role-t">
                    <h3 id={`role-${r.id}`}>{r.name}</h3>
                    <p>{t('team.roleMeta', { assigned: r.assigned, capacity: r.capacity, min: r.minRequired })}</p>
                  </div>
                  {r.remaining > 0 ? <TonePill tone="blue">{t('team.placesLeft', { n: r.remaining })}</TonePill> : <TonePill tone="gray">{t('app.full')}</TonePill>}
                </header>
                <div className="cw-tm-slots" aria-hidden="true">
                  {Array.from({ length: r.capacity }).map((_, i) => {
                    const m = members[i];
                    const st = m ? memberState(m) : 'empty';
                    return <i key={i} className={`is-${st}`} />;
                  })}
                </div>
                <div className="cw-tm-confirmed">{t('team.confirmedOf', { n: r.confirmed, min: r.minRequired })}{short ? <span className="cw-tm-short">{t('team.short', { n: r.minRequired - r.confirmed })}</span> : <span className="cw-tm-ok"><CheckCircle2 size={13} aria-hidden="true" /> {t('team.minMet')}</span>}</div>
                {members.length ? (
                  <ul className="cw-tm-members">
                    {members.map((m) => {
                      const st = memberState(m);
                      return (
                        <li key={m.applicationId}>
                          <span className="cw-ap-av" aria-hidden="true">{initials(m.name)}</span>
                          <div className="cw-tm-m-n">
                            <b>{m.name}</b>
                            <span>{m.headline}</span>
                          </div>
                          <div className="cw-tm-m-tags">
                            {m.exception && <TonePill tone="violet">{t('team.exceptionApproved')}</TonePill>}
                            <TonePill tone={{ confirmed: 'green', pending: 'amber', assigned: 'gray' }[st]}>{t(`team.member.${st}`)}</TonePill>
                          </div>
                          {canManage && st !== 'confirmed' && (
                            <button type="button" className="cw-pj-x" aria-label={t('team.removeFrom', { name: m.name, role: r.name })} disabled={Boolean(busy)} onClick={() => setConfirm({ remove: m, role: r })}><X size={16} strokeWidth={1.9} aria-hidden="true" /></button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : <p className="cw-tm-empty">{t('team.noMembers')}</p>}
              </section>
            );
          })}
        </div>

        <aside className="cw-pj-col">
          <section className="cw-card cw-pj-side cw-tm-pool" aria-labelledby="tm-pool-h">
            <h2 id="tm-pool-h"><Users size={15} strokeWidth={1.9} aria-hidden="true" /> {t('team.toAssign')} <span className="cw-count">{unassigned.length}</span></h2>
            <p className="cw-pf-muted">{t('team.toAssignSub')}</p>
            {unassigned.length === 0 ? <p className="cw-tm-empty">{t('team.allAssigned')}</p> : (
              <ul className="cw-tm-plist">
                {unassigned.map((p) => {
                  const choice = roleChoice[p.applicationId] ?? defaultRole(p, team.roles);
                  const full = choice && roleById[String(choice)]?.remaining === 0;
                  return (
                    <li key={p.applicationId}>
                      <div className="cw-tm-p-top">
                        <span className="cw-ap-av" aria-hidden="true">{initials(p.name)}</span>
                        <div className="cw-tm-m-n"><b>{p.name}</b><span>{p.requestedRole ? t('team.askedFor', { role: p.requestedRole.name }) : p.headline}</span></div>
                      </div>
                      {p.gaps.length > 0 && (
                        <p className="cw-tm-warn"><ShieldAlert size={14} aria-hidden="true" /> {t('team.gap', { list: p.gaps.map((g) => t('team.gapItem', { name: g.name, level: g.level, required: g.required })).join(', ') })}</p>
                      )}
                      {p.conflict && <p className="cw-tm-warn is-red"><Lock size={14} aria-hidden="true" /> {t('team.conflict', { project: p.conflict.project_title || p.conflict.project || t('team.anotherProject') })}</p>}
                      {canManage && (
                        <div className="cw-tm-assign">
                          <select aria-label={t('team.roleFor', { name: p.name })} value={choice || ''} onChange={(e) => setRoleChoice((c) => ({ ...c, [p.applicationId]: e.target.value }))} disabled={Boolean(p.conflict)}>
                            {team.roles.map((r) => <option key={r.id} value={r.id} disabled={r.remaining === 0}>{r.name} — {r.remaining > 0 ? t('team.placesLeft', { n: r.remaining }) : t('app.full')}</option>)}
                          </select>
                          <button type="button" className="cw-btn pri sm" onClick={() => onAssign(p)} disabled={Boolean(busy) || Boolean(p.conflict) || !choice || full} aria-busy={busy === `assign-${p.applicationId}` || undefined}>
                            <UserPlus size={14} strokeWidth={2} aria-hidden="true" /> {t('team.assign')}
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {declined.length > 0 && (
            <section className="cw-card cw-pj-side" aria-labelledby="tm-dec-h">
              <h2 id="tm-dec-h">{t('team.declinedTitle')}</h2>
              <ul className="cw-tm-plist is-compact">
                {declined.map((p) => <li key={p.applicationId}><div className="cw-tm-p-top"><span className="cw-ap-av" aria-hidden="true">{initials(p.name)}</span><div className="cw-tm-m-n"><b>{p.name}</b><span>{t('team.declinedLine')}</span></div><TonePill tone="red">{t('team.member.declined')}</TonePill></div></li>)}
              </ul>
              {team.waitlist.length > 0 && canManage && <p className="cw-tm-hint">{t('team.promoteHint')}</p>}
            </section>
          )}

          <section className="cw-card cw-pj-side" aria-labelledby="tm-wait-h">
            <h2 id="tm-wait-h"><ArrowUpCircle size={15} strokeWidth={1.9} aria-hidden="true" /> {t('team.waitlist')} <span className="cw-count">{team.waitlist.length}</span></h2>
            {team.waitlist.length === 0 ? <p className="cw-tm-empty">{t('team.waitlistEmpty')}</p> : (
              <ul className="cw-tm-plist is-compact">
                {team.waitlist.map((w) => (
                  <li key={w.applicationId}>
                    <div className="cw-tm-p-top">
                      <span className="cw-ap-av" aria-hidden="true">{initials(w.name)}</span>
                      <div className="cw-tm-m-n"><b>{w.name}</b><span>{w.requestedRole ? t('team.askedFor', { role: w.requestedRole.name }) : ''}</span></div>
                      {canManage && <button type="button" className="cw-btn ghost sm" disabled={Boolean(busy)} onClick={() => setConfirm({ promote: w })}>{t('team.promote')}</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {!perms.can_review_applications && <p className="cw-pf-muted"><Lock size={12} aria-hidden="true" /> {t('team.readOnly')}</p>}
        </aside>
      </div>

      {exceptionFor && (
        <ExceptionDialog
          data={exceptionFor}
          role={roleById[String(exceptionFor.roleId)]}
          busy={busy === `assign-${exceptionFor.participant.applicationId}`}
          error={error && !CRITICAL_SKILL_CODES.includes(error.code) ? error : null}
          onClose={() => setExceptionFor(null)}
          onSubmit={(exception) => assign(exceptionFor.participant, exceptionFor.roleId, exception)}
          t={t}
        />
      )}
      {confirm === 'start' && (
        <ConfirmDialog
          icon={PlayCircle}
          title={t('team.dlg.startTitle')}
          body={t('team.dlg.startBody', { n: assigned.filter((p) => memberState(p) === 'confirmed').length })}
          confirmLabel={t('team.start')}
          busy={busy === 'start'}
          onClose={() => setConfirm(null)}
          onConfirm={start}
        >
          <ul className="cw-tm-dlglist">
            {team.roles.map((r) => <li key={r.id}><b>{r.name}</b><span>{assigned.filter((p) => String(p.assignment.roleId) === String(r.id) && memberState(p) === 'confirmed').map((p) => p.name).join(', ') || '—'}</span></li>)}
          </ul>
        </ConfirmDialog>
      )}
      {confirm?.promote && (
        <ConfirmDialog
          icon={ArrowUpCircle}
          title={t('team.dlg.promoteTitle', { name: confirm.promote.name })}
          body={t('team.dlg.promoteBody')}
          confirmLabel={t('team.promote')}
          busy={busy === `promote-${confirm.promote.applicationId}`}
          onClose={() => setConfirm(null)}
          onConfirm={() => promote(confirm.promote)}
        />
      )}
      {confirm?.remove && (
        <ConfirmDialog
          icon={X}
          tone="danger"
          title={t('team.dlg.removeTitle', { name: confirm.remove.name })}
          body={t('team.dlg.removeBody', { role: confirm.role.name })}
          confirmLabel={t('team.remove')}
          busy={busy === `remove-${confirm.remove.applicationId}`}
          onClose={() => setConfirm(null)}
          onConfirm={() => unassign(confirm.remove)}
        />
      )}
    </div>
  );
}

function memberState(p) {
  const inv = p.assignment?.invitation;
  if (inv?.status === 'accepted' || p.assignment?.status === 'confirmed') return 'confirmed';
  if (inv?.status === 'pending') return 'pending';
  return 'assigned';
}

function defaultRole(p, roles) {
  const asked = roles.find((r) => String(r.id) === String(p.requestedRole?.id) && r.remaining > 0);
  return asked ? asked.id : (roles.find((r) => r.remaining > 0)?.id ?? null);
}

/** Scenario 4 — critical-skill exception: support + risk are required (BR-06). */
function ExceptionDialog({ data, role, busy, error, onClose, onSubmit, t }) {
  const [support, setSupport] = useState(data.participant.exception?.support || '');
  const [risk, setRisk] = useState(data.participant.exception?.risk || '');
  const [touched, setTouched] = useState(false);
  const missing = { support: !support.trim(), risk: !risk.trim() };
  return (
    <ConfirmDialog
      icon={ShieldAlert}
      title={t('team.exc.title', { name: data.participant.name })}
      body={t('team.exc.body', { role: role?.name || '' })}
      confirmLabel={t('team.exc.confirm')}
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirm={() => { setTouched(true); if (!missing.support && !missing.risk) onSubmit({ support: support.trim(), risk: risk.trim() }); }}
    >
      <ul className="cw-tm-gaps">
        {data.gaps.map((g) => <li key={g.name}><b>{g.name}</b><span>{t('team.gapLevel', { level: g.level, required: g.required })}</span></li>)}
      </ul>
      <div className="cw-pf-field cw-pj-reason">
        <label htmlFor="tm-exc-support">{t('team.exc.support')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
        <textarea id="tm-exc-support" rows={2} value={support} onChange={(e) => setSupport(e.target.value)} aria-invalid={touched && missing.support ? 'true' : undefined} placeholder={t('team.exc.supportPh')} maxLength={1000} />
        {touched && missing.support && <span className="cw-pj-ferr">{t('team.exc.required')}</span>}
      </div>
      <div className="cw-pf-field cw-pj-reason">
        <label htmlFor="tm-exc-risk">{t('team.exc.risk')}<span className="cw-pf-req" aria-hidden="true">*</span></label>
        <textarea id="tm-exc-risk" rows={2} value={risk} onChange={(e) => setRisk(e.target.value)} aria-invalid={touched && missing.risk ? 'true' : undefined} placeholder={t('team.exc.riskPh')} maxLength={1000} />
        {touched && missing.risk && <span className="cw-pj-ferr">{t('team.exc.required')}</span>}
      </div>
      <p className="cw-pf-muted" style={{ fontSize: 12.5 }}>{t('team.exc.note')}</p>
    </ConfirmDialog>
  );
}
