import { ArrowRight, ChevronRight, FolderPlus, Plus } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from './EmptyState';
import { formatDate } from './format';

// Section 3 — Projects Overview (US-COMP-03): count per lifecycle state
// (approved status dictionary, SRS Table 75) + most recently updated projects.
const STATE_GROUPS = [
  { key: 'preparing', states: ['draft', 'submitted', 'changes_requested', 'approved'] },
  { key: 'live', states: ['open', 'selection', 'active', 'under_review'] },
  { key: 'closed', states: ['completed', 'rejected', 'cancelled', 'archived'] },
];

const STATE_COLORS = {
  draft: '#98A1BA', submitted: '#5B5BD6', changes_requested: '#F9A01F', approved: '#2E9B6B',
  open: '#1667E0', selection: '#7C4DDB', active: '#15925A', under_review: '#0F8FA8',
  completed: '#0D1A4A', rejected: '#D13B3B', cancelled: '#B04A4A', archived: '#C3C9D8',
};

const STATE_PILL = {
  draft: 'p-gray', submitted: 'p-violet', changes_requested: 'p-amber', approved: 'p-green',
  open: 'p-blue', selection: 'p-violet', active: 'p-green', under_review: 'p-blue',
  completed: 'p-gray', rejected: 'p-red', cancelled: 'p-red', archived: 'p-gray',
};

export default function ProjectsByState({ projectStates = {}, recentProjects = [], onNavigate, canPublish = true }) {
  const { t, lang } = useCompanyI18n();
  const total = Object.values(projectStates).reduce((a, b) => a + (b || 0), 0);
  const empty = total === 0;

  return (
    <section className="cw-card" aria-labelledby="cw-states-title">
      <div className="cw-ch">
        <div>
          <h2 id="cw-states-title">{t('company.ws.byState')}</h2>
          <div className="cw-sub">{t('company.ws.byStateSub', { n: total })}</div>
        </div>
        <div className="cw-sp" />
        {!empty && (
          <button type="button" className="cw-link" onClick={() => onNavigate?.('/company/projects')}>
            {t('company.ws.manageProjects')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="cw-states">
        {STATE_GROUPS.map((g) => {
          const groupTotal = g.states.reduce((a, s) => a + (projectStates[s] || 0), 0);
          return (
            <div key={g.key} className="cw-sg">
              <div className="cw-gh"><span>{t(`company.ws.group.${g.key}`)}</span><b>{groupTotal}</b></div>
              {g.states.map((s) => {
                const n = projectStates[s] || 0;
                return (
                  <div key={s} className={`cw-st${n === 0 ? ' z' : ''}`}>
                    <span className="cw-sd" style={{ background: n === 0 ? '#D7DCE6' : STATE_COLORS[s] }} />
                    {t(`company.ws.state.${s}`)}
                    <span className="cw-c">{n}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {empty ? (
        <EmptyState
          icon={FolderPlus}
          title={t('company.ws.noProjects')}
          body={t('company.ws.noProjectsBody')}
          action={canPublish ? (
            <button type="button" className="cw-btn ghost" onClick={() => onNavigate?.('/company/projects/new')}>
              <Plus size={16} strokeWidth={2.2} aria-hidden="true" /> {t('company.ws.ql.create')}
            </button>
          ) : null}
        />
      ) : (
        <>
          <div className="cw-sub2">
            {t('company.ws.recent')}
            <div className="cw-sp" />
            <button type="button" className="cw-link" onClick={() => onNavigate?.('/company/projects')}>
              {t('company.ws.allProjects')} <ArrowRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <div className="cw-table-wrap">
            <table className="cw-table">
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>{t('company.ws.col.project')}</th>
                  <th style={{ width: '25%' }}>{t('company.ws.col.state')}</th>
                  <th style={{ width: '15%' }} className="cw-col-deadline">{t('company.ws.col.deadline')}</th>
                  <th>{t('company.ws.col.capacity')}</th>
                  <th className="cw-go"><span className="sr-only" /></th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((p) => {
                  const pct = p.capacity ? Math.round((p.filled / p.capacity) * 100) : 0;
                  const full = p.capacity > 0 && p.filled >= p.capacity;
                  return (
                    <tr key={p.id} onClick={() => onNavigate?.('/company/projects')}>
                      <td>
                        <div className="cw-pn">{p.name}</div>
                        <div className="cw-ps">{t(`company.ws.kind.${p.kind}`)} · {p.track}</div>
                      </td>
                      <td><span className={`cw-pill ${STATE_PILL[p.state]}`}><span className="cw-d" />{t(`company.ws.state.${p.state}`)}</span></td>
                      <td className="cw-col-deadline">
                        {!p.deadline
                          ? t('company.ws.notSet')
                          : p.deadline.closed
                            ? t('company.ws.closedOn', { date: formatDate(p.deadline.date, lang, { year: false }) })
                            : formatDate(p.deadline.date, lang)}
                      </td>
                      <td>
                        <div className="cw-cap">
                          <div className="cw-bar"><i style={{ width: `${pct}%`, background: full ? '#15925A' : undefined }} /></div>
                          <span>{p.filled} / {p.capacity}</span>
                        </div>
                      </td>
                      <td className="cw-go"><ChevronRight className="cw-flip" size={18} strokeWidth={1.8} aria-hidden="true" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
