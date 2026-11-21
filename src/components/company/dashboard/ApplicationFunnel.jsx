import { ChevronDown, Lock, Inbox } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from './EmptyState';

// Section 4 — Project & Application Funnel (US-COMP-03). Aggregate counts
// only — no applicant personal data here (BR-05, COMP-06). Figures come
// from the backend (BR-03); the bars are just the count relative to the
// largest stage.
const FUNNEL_STAGES = [
  { key: 'submitted', color: '#1667E0' },
  { key: 'shortlisted', color: '#5B5BD6' },
  { key: 'waitlisted', color: '#F9A01F' },
  { key: 'accepted', color: '#15925A' },
  { key: 'rejected', color: '#D13B3B' },
  { key: 'withdrawn', color: '#98A1BA' },
  { key: 'expired', color: '#C3C9D8' },
];

export default function ApplicationFunnel({ funnel }) {
  const { t } = useCompanyI18n();
  const stages = funnel?.stages || {};
  const total = funnel?.total || 0;
  const max = Math.max(1, ...FUNNEL_STAGES.map((s) => stages[s.key] || 0));

  return (
    <section className="cw-card flex" aria-labelledby="cw-funnel-title">
      <div className="cw-ch">
        <h2 id="cw-funnel-title">{t('company.ws.funnel')}</h2>
        <div className="cw-sp" />
        {/* TODO: project filter (dropdown) once the projects list exists. */}
        <span className={`cw-sel${total === 0 ? ' dim' : ''}`}>
          {t('company.ws.allProjects')} <ChevronDown size={14} strokeWidth={1.8} aria-hidden="true" />
        </span>
      </div>

      <div className="cw-ftot">
        <b className={total === 0 ? 'dim' : ''}>{total}</b>
        <span>{total === 0 ? t('company.ws.funnelTotalZero') : t('company.ws.funnelTotal')}</span>
      </div>

      {total === 0 ? (
        <EmptyState mini icon={Inbox} title={t('company.ws.noApplications')} body={t('company.ws.noApplicationsBody')} />
      ) : (
        <>
          {FUNNEL_STAGES.map(({ key, color }) => {
            const n = stages[key] || 0;
            return (
              <div key={key} className="cw-fr">
                <span className="cw-fl">{t(`company.ws.stage.${key}`)}</span>
                <div className="cw-ft" aria-hidden="true"><i style={{ width: `${Math.round((n / max) * 100)}%`, background: color }} /></div>
                <span className="cw-fc">{n}</span>
              </div>
            );
          })}
          {funnel.byProject?.length > 0 && (
            <>
              <div className="cw-sub2" style={{ marginTop: 18 }}>{t('company.ws.byProject')}</div>
              {funnel.byProject.map((p) => (
                <div key={p.name} className="cw-pp"><span className="cw-n">{p.name}</span><span className="cw-v">{p.count}</span></div>
              ))}
            </>
          )}
        </>
      )}

      <div className="cw-spacer" />
      <div className="cw-note" style={{ marginTop: 0 }}>
        <Lock className="cw-ic" size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('company.ws.funnelNote')}</span>
      </div>
    </section>
  );
}
