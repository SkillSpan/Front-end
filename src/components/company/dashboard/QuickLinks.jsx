import { ChevronRight, Lock } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import EmptyState from './EmptyState';
import { QUICK_LINKS } from './quickLinks';

// Section 6 — Quick Links (US-COMP-03, BR-07 / AC-12). Renders only the links
// the representative may use; which ones is decided in quickLinks.js
// (one config, each link with its required permission/condition).
export default function QuickLinks({ links = QUICK_LINKS, drafts = 0, onNavigate }) {
  const { t } = useCompanyI18n();
  return (
    <section className="cw-card" aria-labelledby="cw-ql-title">
      <div className="cw-ch" style={{ marginBottom: 14 }}>
        <h2 id="cw-ql-title">{t('company.ws.quickLinks')}</h2>
      </div>
      {links.length === 0 && (
        <EmptyState mini icon={Lock} title={t('company.ws.ql.none')} body={t('company.ws.ql.noneBody')} />
      )}
      {links.map(({ key, route, Icon, highlight }) => (
        <button key={key} type="button" className={`cw-qrow${highlight ? ' hl' : ''}`} onClick={() => onNavigate?.(route)}>
          <span className="cw-b"><Icon size={18} strokeWidth={highlight ? 2.2 : 1.8} aria-hidden="true" /></span>
          <span>
            <span className="cw-t" style={{ display: 'block' }}>{t(`company.ws.ql.${key}`)}</span>
            <span className="cw-s" style={{ display: 'block' }}>{t(`company.ws.ql.${key}Sub`, { n: drafts })}</span>
          </span>
          <ChevronRight className="cw-c cw-flip" size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ))}
    </section>
  );
}
