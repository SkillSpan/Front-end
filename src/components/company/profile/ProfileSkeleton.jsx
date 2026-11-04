import { useCompanyI18n } from '../useCompanyI18n';

const Line = ({ w = '100%', h = 10, r = 6, style }) => (
  <span className="cw-sk" style={{ width: w, height: h, borderRadius: r, ...style }} />
);

function SecSkel({ rows = 3 }) {
  return (
    <div className="cw-card cw-pf-sec">
      <div className="cw-pf-sec-h">
        <span className="cw-sk" style={{ width: 36, height: 36, borderRadius: 10, flex: 'none' }} />
        <div className="cw-sk-col"><Line w="34%" h={13} /><Line w="52%" h={9} /></div>
      </div>
      <div className="cw-pf-dl">
        {Array.from({ length: rows * 2 }, (_, i) => (
          <div key={i}><Line w="40%" h={9} /><Line w={`${70 - (i % 3) * 14}%`} h={12} style={{ marginTop: 8 }} /></div>
        ))}
      </div>
    </div>
  );
}

// Loading state of the Organization Profile (view + edit): keeps the page's frame.
export default function ProfileSkeleton({ mode = 'view' }) {
  const { t } = useCompanyI18n();
  return (
    <div className="cw-pf" style={{ display: 'contents' }} aria-busy="true">
      <p className="cw-vh" role="status">{t('company.pf.loading')}</p>
      <div className="cw-ph">
        <div>
          <h1>{t(mode === 'edit' ? 'company.pf.editTitle' : 'company.pf.title')}</h1>
          <p>{t('company.pf.sub')}</p>
        </div>
      </div>
      {mode === 'view' && (
        <div className="cw-card cw-pf-id">
          <div className="cw-pf-id-main">
            <span className="cw-sk" style={{ width: 72, height: 72, borderRadius: 18, flex: 'none' }} />
            <div className="cw-sk-col"><Line w="38%" h={18} /><Line w="56%" h={10} /><Line w="30%" h={9} /></div>
          </div>
          <div className="cw-sk-box" style={{ marginTop: 0 }}><Line w="30%" h={9} /><Line w="60%" h={22} r={99} style={{ marginTop: 10 }} /><Line w="80%" h={9} style={{ marginTop: 12 }} /></div>
        </div>
      )}
      <div className="cw-grid cw-pf-grid">
        <div className="cw-pf-col"><SecSkel rows={3} /><SecSkel rows={2} /><SecSkel rows={1} /></div>
        <div className="cw-pf-col cw-pf-side">
          <div className="cw-card cw-pf-cmp">
            <div className="cw-pf-cmp-top">
              <span className="cw-sk" style={{ width: 92, height: 92, borderRadius: '50%', flex: 'none' }} />
              <div className="cw-sk-col"><Line w="70%" h={13} /><Line w="90%" h={9} /></div>
            </div>
            <Line w="100%" h={8} r={99} style={{ marginTop: 18 }} />
            {[0, 1, 2, 3].map((i) => <Line key={i} w="100%" h={34} r={10} style={{ marginTop: 10 }} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
