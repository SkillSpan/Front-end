import { useEffect, useRef } from 'react';
import { TriangleAlert } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';

// "Discard your changes?" — shown when Cancel is pressed on a dirty form.
export default function DiscardDialog({ onKeep, onDiscard }) {
  const { t } = useCompanyI18n();
  const keepRef = useRef(null);
  useEffect(() => {
    keepRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onKeep?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKeep]);
  return (
    <div className="cw-pf-modal" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onKeep?.(); }}>
      <div className="cw-pf-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cw-pf-dlg-t" aria-describedby="cw-pf-dlg-b">
        <span className="cw-pf-dialog-ic"><TriangleAlert size={20} strokeWidth={1.9} aria-hidden="true" /></span>
        <h2 id="cw-pf-dlg-t">{t('company.pf.discard.title')}</h2>
        <p id="cw-pf-dlg-b">{t('company.pf.discard.body')}</p>
        <div className="cw-pf-dialog-act">
          <button type="button" className="cw-btn sec" ref={keepRef} onClick={onKeep}>{t('company.pf.discard.keep')}</button>
          <button type="button" className="cw-btn danger" onClick={onDiscard}>{t('company.pf.discard.confirm')}</button>
        </div>
      </div>
    </div>
  );
}
