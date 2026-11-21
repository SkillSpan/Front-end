import { useLocation, useNavigate } from 'react-router-dom';
import { CircleDashed, Info, Scale, ShieldCheck, X } from 'lucide-react';
import '../workspace/companyWorkspace.css';
import '../profile/companyProfile.css';
import '../projects/projects.css';
import './talent.css';
import { useCompanyI18n } from '../useCompanyI18n';
import { formatDate } from '../dashboard/format';
import EmptyState from '../dashboard/EmptyState';
import { apiKey } from '../../../cache/queryCache';
import { PageFailure, PageHeader } from '../projects/common';
import { usePageData } from '../projects/hooks';
import { initials } from '../applications/people';
import { compareCandidates, COMPARE_MAX } from './talentApi';
import { compareSelection } from './selection';
import { Readiness } from './talentUi';

/**
 * Side-by-side comparison (US-COMP-06 Scenario 2–3; AC-05..09) —
 * /company/talent/compare?ids=31,32
 * POST /api/v1/talent/compare (sprint name, TODO(api)). Same rows and the same
 * evidence period for everyone (BR-07); a cell without evidence says so
 * (AC-07); a candidate who became hidden is dropped and only counted (TC-24);
 * the human-review notice is always shown (BR-09).
 * Preview (?preview=…): loading | error | denied | hidden (one picked candidate withdrew consent).
 */
export default function TalentCompare({ user, onNavigate, demo, previewState }) {
  const { t, lang } = useCompanyI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const go = onNavigate || navigate;
  const preview = Boolean(demo);
  const ids = (new URLSearchParams(location.search).get('ids') || '').split(',').map((x) => x.trim()).filter(Boolean).slice(0, COMPARE_MAX);
  const askIds = previewState === 'hidden' ? [...ids, '90'] : ids;
  const key = apiKey('/api/v1/talent/compare', { ids: askIds.join(',') }, { method: 'POST', variant: preview ? 'preview' : undefined });
  const page = usePageData(ids.length >= 2 ? key : null, () => compareCandidates(askIds, { preview }), { previewState: previewState === 'hidden' ? null : previewState, user });
  const fmt = (iso) => (iso ? formatDate(String(iso).slice(0, 10), lang) : '');
  const header = <PageHeader back={{ label: t('tal.title'), onClick: () => go('/company/talent') }} title={t('tal.cmp.title')} sub={t('tal.cmp.sub')} />;

  if (ids.length < 2) {
    return <div className="cw-pj">{header}<section className="cw-card"><EmptyState icon={Scale} title={t('tal.cmp.pickTitle')} body={t('tal.cmp.pickBody', { max: COMPARE_MAX })} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/talent')}>{t('tal.cmp.toSearch')}</button>} /></section></div>;
  }
  if (page.failure || page.status === 'error') return <>{header}<PageFailure page={page} title={t('tal.cmp.title')} onNavigate={go} /></>;

  const data = page.data;
  const people = data?.candidates || [];
  const skillNames = [...new Set(people.flatMap((c) => c.skills.map((s) => s.name)))];
  const remove = (cid) => {
    const next = ids.filter((x) => x !== String(cid));
    compareSelection.set(next);
    navigate({ pathname: location.pathname, search: `?ids=${next.join(',')}` }, { replace: true });
  };
  const none = <span className="cw-tl-none"><CircleDashed size={13} aria-hidden="true" /> {t('tal.cmp.noEvidence')}</span>;

  return (
    <div className="cw-pj cw-tl">
      {preview && <div className="cw-sample">{t('company.ws.sampleBanner')}</div>}
      {header}
      <div className="cw-pj-banner is-blue" role="note">
        <span className="cw-pj-banner-ic"><ShieldCheck size={19} strokeWidth={1.9} aria-hidden="true" /></span>
        <div><h3>{t('tal.cmp.humanTitle')}</h3><p>{t('tal.cmp.humanBody')}</p></div>
      </div>
      {data?.removedCount > 0 && (
        <div className="cw-pj-banner is-gray" role="status">
          <span className="cw-pj-banner-ic"><Info size={19} strokeWidth={1.9} aria-hidden="true" /></span>
          <div><h3>{t('tal.cmp.removedTitle', { n: data.removedCount })}</h3><p>{t('tal.cmp.removedBody')}</p></div>
        </div>
      )}

      {page.status === 'loading' || !data ? (
        <section className="cw-card"><span className="cw-sk" style={{ width: '100%', height: 260 }} /></section>
      ) : people.length < 2 ? (
        <section className="cw-card"><EmptyState icon={Scale} title={t('tal.cmp.tooFew')} body={t('tal.cmp.tooFewBody')} action={<button type="button" className="cw-btn ghost" onClick={() => go('/company/talent')}>{t('tal.cmp.toSearch')}</button>} /></section>
      ) : (
        <section className="cw-card cw-tl-cmp" aria-label={t('tal.cmp.title')}>
          {data.period && <p className="cw-tl-period">{t('tal.cmp.period', { from: fmt(data.period.from), to: fmt(data.period.to) })}</p>}
          <div className="cw-tl-cmp-scroll" tabIndex={0} role="region" aria-label={t('tal.cmp.scroll')}>
            <table>
              <thead>
                <tr>
                  <th scope="col" className="cw-tl-cmp-k"><span className="cw-vh">{t('tal.cmp.field')}</span></th>
                  {people.map((c) => (
                    <th key={c.id} scope="col">
                      <div className="cw-tl-cmp-who">
                        <span className="cw-ap-av" aria-hidden="true">{initials(c.name)}</span>
                        <button type="button" className="cw-tl-name" onClick={() => go(`/company/talent/${c.id}`)}>{c.name}</button>
                        <button type="button" className="cw-pj-x" aria-label={t('tal.cmp.remove', { name: c.name })} onClick={() => remove(c.id)}><X size={14} aria-hidden="true" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr><th scope="row">{t('tal.cmp.readiness')}</th>{people.map((c) => <td key={c.id}><Readiness readiness={c.readiness} compact /></td>)}</tr>
                <tr><th scope="row">{t('tal.f.role')}</th>{people.map((c) => <td key={c.id}>{c.careerRole || none}</td>)}</tr>
                <tr className="cw-tl-cmp-group"><th scope="rowgroup" colSpan={people.length + 1}>{t('tal.sum.skills')}</th></tr>
                {skillNames.map((name) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    {people.map((c) => {
                      const s = c.skills.find((x) => x.name === name);
                      return <td key={c.id}>{s ? <span className={`cw-tl-lv ${s.verified ? 'is-verified' : 'is-self'}`}><b>{s.level ?? '—'}/5</b> {s.verified ? t('tal.verified') : t('tal.selfDeclared')}</span> : none}</td>;
                    })}
                  </tr>
                ))}
                <tr className="cw-tl-cmp-group"><th scope="rowgroup" colSpan={people.length + 1}>{t('tal.cmp.evidence')}</th></tr>
                <tr><th scope="row">{t('tal.sum.projects')}</th>{people.map((c) => <td key={c.id}>{c.projects.length ? <ul className="cw-tl-cmp-list">{c.projects.map((p, i) => <li key={i}><b>{p.title}</b>{p.teamRole && <span>{p.teamRole}</span>}{!p.verified && <em>{t('tal.selfDeclared')}</em>}</li>)}</ul> : none}</td>)}</tr>
                <tr><th scope="row">{t('tal.sum.evaluations')}</th>{people.map((c) => <td key={c.id}>{c.evaluations.length ? <ul className="cw-tl-cmp-list">{c.evaluations.map((e, i) => <li key={i}><b>{e.project}</b><span>{e.summary}</span></li>)}</ul> : none}</td>)}</tr>
                <tr><th scope="row">{t('tal.cmp.freshness')}</th>{people.map((c) => <td key={c.id}>{c.updatedAt ? fmt(c.updatedAt) : none}</td>)}</tr>
                <tr><th scope="row">{t('tal.cmp.missing')}</th>{people.map((c) => <td key={c.id}>{c.limitations.length ? <ul className="cw-tl-cmp-miss">{c.limitations.map((l) => <li key={l}>{t(`tal.limit.${l}`)}</li>)}</ul> : <span className="cw-tm-ok">{t('tal.cmp.complete')}</span>}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
