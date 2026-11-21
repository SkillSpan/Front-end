import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { pageWindow } from './pageWindow';

export default function Pagination({ page, lastPage, onChange }) {
  const { t } = useCompanyI18n();
  if (lastPage <= 1) return null;
  return (
    <nav className="cw-pager" aria-label={t('company.notif.pagination')}>
      <button type="button" className="cw-pg-btn cw-pg-step" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="cw-flip" size={16} strokeWidth={2} aria-hidden="true" />
        <span>{t('company.notif.prev')}</span>
      </button>
      <ul>
        {pageWindow(page, lastPage).map((p) => (typeof p === 'string'
          ? <li key={p} className="cw-pg-gap" aria-hidden="true">…</li>
          : (
            <li key={p}>
              <button
                type="button"
                className={`cw-pg-btn${p === page ? ' is-current' : ''}`}
                aria-current={p === page ? 'page' : undefined}
                aria-label={t('company.notif.pageN', { n: p })}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            </li>
          )))}
      </ul>
      <button type="button" className="cw-pg-btn cw-pg-step" disabled={page >= lastPage} onClick={() => onChange(page + 1)}>
        <span>{t('company.notif.next')}</span>
        <ChevronRight className="cw-flip" size={16} strokeWidth={2} aria-hidden="true" />
      </button>
    </nav>
  );
}
