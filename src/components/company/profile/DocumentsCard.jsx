import { useEffect, useRef, useState } from 'react';
import { FileText, FileImage, UploadCloud, RefreshCw, CircleAlert, CircleCheck, ShieldCheck, History, FolderLock, Download } from 'lucide-react';
import { useCompanyI18n } from '../useCompanyI18n';
import { COMPANY_DOCUMENT_EXTENSIONS, COMPANY_DOCUMENT_MAX_MB } from '../../../config';
import { validateCompanyDocument } from '../../../utils/companyValidation';
import { DOCUMENT_KINDS } from './profileFields';
import { documentErrorCode, downloadDocument, uploadDocument } from './companyProfileApi';
import { formatBytes, formatDay } from './profileFormat';
import ReverificationNotice from './ReverificationNotice';

/*
 * Document upload & replacement (US-COMP-04 Scenario 4, BR-06/07, AC-06/07/08).
 *  - drag & drop or browse; PDF/JPG/PNG up to COMPANY_DOCUMENT_MAX_MB (src/config.js)
 *  - unsupported / oversized files are rejected before upload with a message
 *  - server rejections (422 type/size/malware) are shown on the same row
 *  - replacing the trade license asks first: it follows the re-verification policy
 *  - files are never linked publicly: "Download" fetches documents.*.url with the
 *    Bearer token (GET /api/v1/company/profile/documents/{id}); available:false
 *    shows "Not available" instead (the URL would answer 404 DOCUMENT_UNAVAILABLE)
 *  - documents.*.status (pending · approved · rejected) is shown as text; any
 *    replacement goes back to pending (US-COMP-04 guide)
 */

const DOC_STATUS_TONE = { approved: 'p-green', pending: 'p-amber', rejected: 'p-red' };

const typeLabel = (doc) => {
  const m = String(doc?.mime || '').toLowerCase();
  if (m.includes('pdf') || /\.pdf$/i.test(doc?.name || '')) return 'PDF';
  if (m.includes('png') || /\.png$/i.test(doc?.name || '')) return 'PNG';
  return 'JPG';
};

function DocRow({ kind, required, verification, doc, preview, status, forced, onUploaded, autoFocus }) {
  const { t, lang } = useCompanyI18n();
  const inputRef = useRef(null);
  const browseRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [pending, setPending] = useState(null); // file waiting for "upload and send for review"
  const [progress, setProgress] = useState(forced?.progress ?? null);
  const [uploadingName, setUploadingName] = useState(forced?.uploadingName || '');
  const [error, setError] = useState(forced?.error || null);
  const [done, setDone] = useState('');
  const [downloading, setDownloading] = useState(false);
  const errId = `pf-doc-${kind}-err`;
  const rulesId = `pf-doc-${kind}-rules`;
  const busy = progress != null;

  useEffect(() => {
    if (autoFocus) browseRef.current?.focus();
  }, [autoFocus]);

  const start = async (file) => {
    setError(null);
    setDone('');
    setPending(null);
    setUploadingName(file.name);
    setProgress(0);
    try {
      const profile = await uploadDocument(kind, file, { preview, onProgress: setProgress });
      setProgress(null);
      setDone(t('company.pf.doc.uploadedMsg', { doc: t(`company.pf.doc.${kind}`) }));
      onUploaded?.(profile, kind);
    } catch (err) {
      setProgress(null);
      if (err?.status === 401) return;
      setError({ code: documentErrorCode(err) || 'server', name: file.name, size: file.size });
    }
  };

  const choose = (file) => {
    if (!file || busy) return;
    setDone('');
    const problem = validateCompanyDocument(file);
    if (problem) {
      setPending(null);
      setError({ code: problem, name: file.name, size: file.size });
      return;
    }
    setError(null);
    const reviewed = verification && doc && (status === 'verified' || status === 'reverification_required');
    if (reviewed) setPending(file);
    else start(file);
  };

  const onInput = (e) => {
    choose(e.target.files?.[0]);
    e.target.value = '';
  };

  const dropProps = {
    onDragOver: (e) => { e.preventDefault(); if (!busy) setDrag(true); },
    onDragLeave: () => setDrag(false),
    onDrop: (e) => { e.preventDefault(); setDrag(false); choose(e.dataTransfer?.files?.[0]); },
  };

  const errorText = error && t(`company.pf.doc.err.${error.code}`, {
    name: error.name, size: formatBytes(error.size, lang), mb: COMPANY_DOCUMENT_MAX_MB,
  });
  const Icon = doc && typeLabel(doc) !== 'PDF' ? FileImage : FileText;
  const browse = () => inputRef.current?.click();
  const download = async () => {
    if (!doc?.url || downloading) return;
    setError(null);
    setDownloading(true);
    try {
      await downloadDocument(doc);
    } catch (err) {
      if (err?.status !== 401) setError({ code: err?.status === 404 ? 'unavailable' : 'download', name: doc.name, size: doc.size });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={`cw-pf-doc${drag ? ' is-drag' : ''}${error ? ' has-err' : ''}`} {...dropProps}>
      <div className="cw-pf-doc-h">
        <h3 id={`pf-doc-${kind}-title`}>{t(`company.pf.doc.${kind}`)}</h3>
        <span className={`cw-pill ${required ? 'p-blue' : 'p-gray'}`}>{t(required ? 'company.pf.doc.requiredTag' : 'company.pf.doc.optionalTag')}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="cw-vh"
        tabIndex={-1}
        accept={COMPANY_DOCUMENT_EXTENSIONS.join(',')}
        aria-hidden="true"
        onChange={onInput}
        data-testid={`pf-doc-input-${kind}`}
      />

      {doc && !busy ? (
        <div className="cw-pf-file">
          <span className="cw-pf-file-ic"><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span>
          <div className="cw-pf-file-b">
            <bdi className="cw-pf-file-n">{doc.name}</bdi>
            <div className="cw-pf-file-m">
              <span>{typeLabel(doc)}</span><i>•</i>
              <span>{formatBytes(doc.size, lang)}</span><i>•</i>
              <span>{t('company.pf.doc.uploaded', { date: formatDay(doc.uploadedAt, lang) })}</span>
              {doc.version > 1 && (<><i>•</i><span>{t('company.pf.doc.version', { n: doc.version })}</span></>)}
              {doc.status && (<><i>•</i><span className={`cw-pill ${DOC_STATUS_TONE[doc.status] || 'p-gray'}`}><span className="cw-d" />{t(`company.pf.doc.st.${doc.status}`)}</span></>)}
              {doc.available === false && (<><i>•</i><span>{t('company.pf.doc.unavailable')}</span></>)}
            </div>
          </div>
          {doc.url && doc.available !== false && (
            <button type="button" className="cw-btn sec sm" onClick={download} disabled={downloading} aria-busy={downloading || undefined}>
              <Download size={14} strokeWidth={2} aria-hidden="true" />
              {t('company.pf.doc.download')}<span className="cw-vh"> — {t(`company.pf.doc.${kind}`)}</span>
            </button>
          )}
          <button
            ref={browseRef}
            id={`pf-doc-${kind}`}
            type="button"
            className="cw-btn sec sm"
            onClick={browse}
            aria-describedby={`${rulesId}${error ? ` ${errId}` : ''}`}
          >
            <RefreshCw size={14} strokeWidth={2} aria-hidden="true" />
            {t('company.pf.doc.replace')}<span className="cw-vh"> — {t(`company.pf.doc.${kind}`)}</span>
          </button>
        </div>
      ) : busy ? (
        <div className="cw-pf-file is-busy" role="status" aria-live="polite">
          <span className="cw-pf-file-ic"><UploadCloud size={20} strokeWidth={1.7} aria-hidden="true" /></span>
          <div className="cw-pf-file-b">
            <bdi className="cw-pf-file-n">{uploadingName}</bdi>
            <div className="cw-pf-prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label={t('company.pf.doc.uploadingLabel', { name: uploadingName })}>
              <i style={{ width: `${progress}%` }} />
            </div>
            <div className="cw-pf-file-m"><span>{t('company.pf.doc.uploading', { pct: progress })}</span></div>
          </div>
        </div>
      ) : (
        <div className="cw-pf-drop">
          <span className="cw-pf-drop-ic"><UploadCloud size={22} strokeWidth={1.7} aria-hidden="true" /></span>
          <p>
            <span className="cw-pf-drop-t">{t('company.pf.doc.drop')}{' '}</span>
            <button
              ref={browseRef}
              id={`pf-doc-${kind}`}
              type="button"
              className="cw-pf-browse"
              onClick={browse}
              aria-describedby={`${rulesId}${error ? ` ${errId}` : ''}`}
            >
              <span className="cw-pf-drop-t">{t('company.pf.doc.browse')}</span>
              <span className="cw-pf-drop-m">{t('company.pf.doc.choose')}</span>
              <span className="cw-vh"> — {t(`company.pf.doc.${kind}`)}</span>
            </button>
          </p>
        </div>
      )}

      <p className="cw-pf-doc-rules" id={rulesId}>{t('company.pf.doc.rules', { mb: COMPANY_DOCUMENT_MAX_MB })}</p>

      {pending && (
        <div className="cw-pf-pending">
          <ReverificationNotice variant="document" />
          <div className="cw-pf-pending-file">
            <FileText size={16} strokeWidth={1.8} aria-hidden="true" />
            <bdi>{pending.name}</bdi>
            <span className="cw-pf-muted">{formatBytes(pending.size, lang)}</span>
          </div>
          <div className="cw-pf-pending-act">
            <button type="button" className="cw-btn sec sm" onClick={() => setPending(null)}>{t('company.pf.doc.cancel')}</button>
            <button type="button" className="cw-btn pri sm" onClick={() => start(pending)}>{t('company.pf.doc.confirmReplace')}</button>
          </div>
        </div>
      )}

      {error && (
        <div className="cw-pf-doc-err" id={errId} role="alert">
          <CircleAlert size={15} strokeWidth={2} aria-hidden="true" />
          <span>{errorText}</span>
        </div>
      )}
      {done && (
        <div className="cw-pf-doc-ok" role="status">
          <CircleCheck size={15} strokeWidth={2} aria-hidden="true" />
          <span>{done}</span>
        </div>
      )}
      {doc && !busy && (
        <p className="cw-pf-doc-hist"><History size={13} strokeWidth={1.8} aria-hidden="true" />{t('company.pf.doc.history')}</p>
      )}
    </div>
  );
}

export default function DocumentsCard({ documents = {}, status, preview, previewState, onUploaded, focusKind, inForm = false }) {
  const { t } = useCompanyI18n();
  const forced = {};
  if (previewState === 'upload-error') {
    forced.trade_license = { error: { code: 'type', name: 'license-scan.heic', size: 2400000 } };
    forced.additional = { error: { code: 'size', name: 'company-brochure.pdf', size: 12800000 } };
  }
  if (previewState === 'uploading') forced.additional = { progress: 64, uploadingName: 'company-brochure.pdf' };

  return (
    <section className="cw-card cw-pf-sec cw-pf-docs" aria-labelledby="cw-pf-sec-documents" id="pf-section-documents">
      <div className="cw-pf-sec-h">
        <span className="cw-pf-sec-ic"><FolderLock size={18} strokeWidth={1.8} aria-hidden="true" /></span>
        <div>
          <h2 id="cw-pf-sec-documents">{t('company.pf.sec.documents')}</h2>
          <p className="cw-pf-muted">{t('company.pf.sec.documentsSub')}</p>
        </div>
      </div>
      <div className="cw-pf-docs-list">
        {DOCUMENT_KINDS.map(({ kind, required, verification }) => (
          <DocRow
            key={`${kind}-${previewState || ''}`}
            kind={kind}
            required={required}
            verification={verification}
            doc={documents[kind]}
            preview={preview}
            status={status}
            forced={forced[kind]}
            onUploaded={onUploaded}
            autoFocus={focusKind === kind}
          />
        ))}
      </div>
      <p className="cw-pf-docs-foot">
        <ShieldCheck size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{t('company.pf.doc.privacy')}{inForm ? ` ${t('company.pf.doc.immediate')}` : ''}</span>
      </p>
    </section>
  );
}
