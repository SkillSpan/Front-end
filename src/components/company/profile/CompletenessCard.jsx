import { ChevronRight, CircleCheck } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

// Profile completeness indicator + missing-field list (US-COMP-04 BR-08,
// AC-09). Every missing item is a button: it opens the field in the edit form
// (or focuses it, when the form is already open).
export function Ring({ percent, size = 92, label }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  return (
    <div className="cw-pf-ring" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2EEFC" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#cw-pf-ring-g)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="cw-pf-ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1667E0" />
            <stop offset="100%" stopColor="#5FA2FF" />
          </linearGradient>
        </defs>
      </svg>
      <span className="cw-pf-ring-v" aria-hidden="true" dir="ltr">{pct}<small>%</small></span>
    </div>
  );
}

export default function CompletenessCard({ completeness, onPick, live = false }) {
  const { t } = useCompanyI18n();
  const { percent = 0, missing = [] } = completeness || {};
  const required = missing.filter((m) => m.level === 'required');
  const recommended = missing.filter((m) => m.level !== 'required');
  // Server items are field GROUPS (profile_fields keys: info, contact, address,
  // size, website, description — the company.ws.field.* labels); preview /
  // older items are single form fields (company.pf.f.*).
  const label = (m) => (m.group ? t(`company.ws.field.${m.key}`) : t(`company.pf.f.${m.key}`));

  const group = (items, level) => items.length > 0 && (
    <div className="cw-pf-miss">
      <div className="cw-pf-miss-h">
        <span className={`cw-pill ${level === 'required' ? 'p-red' : 'p-amber'}`}>
          <span className="cw-d" />{t(`company.pf.cmp.${level}`)}
        </span>
        <span className="cw-pf-miss-n">{t('company.pf.cmp.countMissing', { n: items.length })}</span>
      </div>
      <ul>
        {items.map((m) => (
          <li key={m.key}>
            <button type="button" className="cw-pf-miss-item" onClick={() => onPick?.(m.target || m.key)}>
              <span>{label(m)}</span>
              <span className="cw-pf-miss-go">{t('company.pf.cmp.add')}<ChevronRight className="cw-flip" size={14} strokeWidth={2} aria-hidden="true" /></span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <section className="cw-card cw-pf-cmp" aria-labelledby="cw-pf-cmp-title">
      <div className="cw-pf-cmp-top">
        <Ring percent={percent} label={t('company.pf.cmp.ringLabel', { n: percent })} />
        <div>
          <h2 id="cw-pf-cmp-title">{t('company.pf.cmp.title')}</h2>
          <p className="cw-pf-muted">{live ? t('company.pf.cmp.liveNote') : t('company.pf.cmp.calcNote')}</p>
          {/* completeness.version: "show it in diagnostics only" (US-COMP-04 guide) */}
          {completeness?.version && <span hidden data-completeness-version={completeness.version} />}
        </div>
      </div>
      <div className="cw-pbar cw-pf-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={t('company.pf.cmp.title')}>
        <i style={{ width: `${percent}%` }} />
      </div>
      {missing.length === 0 ? (
        <p className="cw-pf-done"><CircleCheck size={16} strokeWidth={2} aria-hidden="true" />{t('company.pf.cmp.complete')}</p>
      ) : (
        <>
          <p className="cw-pf-muted cw-pf-cmp-help">{t('company.pf.cmp.help')}</p>
          {group(required, 'required')}
          {group(recommended, 'recommended')}
        </>
      )}
    </section>
  );
}
