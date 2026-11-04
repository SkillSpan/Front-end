import { AlertTriangle, RotateCw } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

/*
 * Per-section loading and error states (US-COMP-03 BR-14 / AC-14). Both keep
 * the section's card frame and roughly its height, so the page does not jump
 * when the data arrives, and a failing section sits next to the ones that
 * loaded fine (Scenario 6).
 */

const Line = ({ w = '100%', h = 10, r = 6, style }) => (
  <span className="cw-sk" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function Rows({ n = 4, tile = 34 }) {
  return Array.from({ length: n }, (_, i) => (
    <div className="cw-sk-row" key={i}>
      <span className="cw-sk" style={{ width: tile, height: tile, borderRadius: 10, flex: 'none' }} />
      <div className="cw-sk-col">
        <Line w={`${72 - (i % 3) * 12}%`} h={11} />
        <Line w={`${38 + (i % 2) * 10}%`} h={9} />
      </div>
    </div>
  ));
}

function Body({ variant }) {
  if (variant === 'org') {
    return (
      <>
        <div className="cw-sk-row" style={{ border: 0, paddingTop: 0 }}>
          <span className="cw-sk" style={{ width: 60, height: 60, borderRadius: 16, flex: 'none' }} />
          <div className="cw-sk-col">
            <Line w="28%" h={9} />
            <Line w="54%" h={16} />
            <Line w="40%" h={9} />
          </div>
        </div>
        <div className="cw-sk-box">
          <Line w="36%" h={9} />
          <Line w="100%" h={8} r={99} style={{ marginTop: 14 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Line w={84} h={24} r={99} /><Line w={96} h={24} r={99} /><Line w={72} h={24} r={99} />
          </div>
        </div>
      </>
    );
  }
  if (variant === 'projects') {
    return (
      <>
        <div className="cw-sk-grid">
          {[0, 1, 2].map((i) => (
            <div className="cw-sk-box" key={i}>
              <Line w="46%" h={9} />
              <Line w="30%" h={18} style={{ marginTop: 10 }} />
              <Line w="100%" h={8} style={{ marginTop: 14 }} />
              <Line w="100%" h={8} style={{ marginTop: 10 }} />
              <Line w="80%" h={8} style={{ marginTop: 10 }} />
            </div>
          ))}
        </div>
        <Rows n={3} />
      </>
    );
  }
  if (variant === 'funnel') {
    return (
      <>
        <Line w="34%" h={22} style={{ marginBottom: 16 }} />
        {[92, 64, 40, 70, 52, 30, 18].map((w, i) => (
          <div className="cw-sk-bar" key={i}>
            <Line w={72} h={9} /><Line w={`${w}%`} h={10} r={99} /><Line w={18} h={9} />
          </div>
        ))}
      </>
    );
  }
  if (variant === 'links') return <Rows n={4} tile={38} />;
  return <Rows n={variant === 'tasks' ? 5 : 4} tile={variant === 'tasks' ? 40 : 34} />;
}

export function SectionSkeleton({ variant = 'list', title, className = '' }) {
  const { t } = useCompanyI18n();
  return (
    <section className={`cw-card cw-sk-card is-${variant} ${className}`} aria-busy="true" aria-label={title ? `${title} · ${t('company.ws.loading')}` : t('company.ws.loading')}>
      <div className="cw-ch">
        <Line w={variant === 'org' ? 0 : 132} h={14} style={variant === 'org' ? { display: 'none' } : undefined} />
      </div>
      <Body variant={variant} />
    </section>
  );
}

export function SectionError({ title, variant = 'list', onRetry, error, className = '' }) {
  const { t } = useCompanyI18n();
  const offline = error?.status === 0;
  return (
    <section className={`cw-card cw-sec-err is-${variant} ${className}`} aria-label={title}>
      {title && (
        <div className="cw-ch">
          <h2>{title}</h2>
          <span className="cw-pill p-red"><span className="cw-d" />{t('company.ws.errorPill')}</span>
        </div>
      )}
      <div className="cw-sec-err-body" role="alert">
        <span className="cw-tb red"><AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" /></span>
        <h4>{t('company.ws.sectionError')}</h4>
        <p>{t(offline ? 'company.ws.sectionErrorOffline' : 'company.ws.sectionErrorBody')}</p>
        <button type="button" className="cw-btn sec sm" onClick={onRetry}>
          <RotateCw size={14} strokeWidth={2} aria-hidden="true" /> {t('company.ws.retry')}
        </button>
      </div>
    </section>
  );
}
