import {
  API_BASE_URL,
  downloadCompanyDocument,
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyProfileDocument,
  unwrapApiData,
} from '../../../api';
import { apiKey, invalidateAfterMutation } from '../../../cache/queryCache';
import {
  API_TO_FIELD,
  COMPLETENESS_GROUPS,
  DOCUMENT_API_TO_KIND,
  DOCUMENT_KINDS,
  PROFILE_FIELDS,
  VERIFICATION_STATUSES,
  changedFields,
  changedVerificationFields,
  computeCompleteness,
  missingItem,
  withScheme,
} from './profileFields';
import { SAMPLE_PROFILE, SAMPLE_PROFILE_INCOMPLETE } from './companyProfileMock';
import { validateCompanyDocument } from '../../../utils/companyValidation';

/*
 * Organization Profile data (US-COMP-04). Requests go through the app's own
 * client (src/api.js), so the Bearer token and the 401 → SessionExpired path
 * are the same as everywhere else; 403 is classified by classifyCompanyError()
 * (dashboard/companyDashboardApi.js) — pending org → /company/pending,
 * anyone else → access denied, no data shown (Scenario 6).
 *
 * Endpoints (US-COMP-04 frontend guide — company_admin + verified organization):
 *   GET   /api/v1/profile/me                       → the whole profile (data)
 *   PATCH /api/v1/profile/me                       → changed fields only →
 *         data: { profile, changed[], reverification_triggered, reverification }
 *   POST  /api/v1/company/profile/documents        → multipart: type + file →
 *         data: { document, replaced, profile, reverification_triggered, reverification }
 *   GET   /api/v1/company/profile/documents/{id}   → the file (use documents.*.url as sent)
 * GET /api/v1/organization/profile still answers the same payload (the
 * dashboard's org card reads it); this page uses /profile/me as the guide asks.
 *
 * `preview` (VITE_COMPANY_PREVIEW builds): sample data kept in localStorage,
 * so edits and uploads survive a refresh.
 */

export const PREVIEW_PROFILE_KEY = 'skillspan.company.preview.profile';

const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] != null) return obj[k];
  return undefined;
};

function normalizeDocument(raw) {
  if (!raw) return null;
  // US-COMP-04 guide: { id, type, name, mime_type, size, version, status,
  // uploaded_at, available, url }. Older aliases kept for the preview data.
  return {
    id: pick(raw, 'id', 'uuid'),
    type: pick(raw, 'type', 'document_type') || null,
    name: pick(raw, 'name', 'file_name', 'original_name') || '',
    size: Number(pick(raw, 'size', 'file_size', 'bytes')) || 0,
    mime: pick(raw, 'mime_type', 'mime') || '',
    uploadedAt: pick(raw, 'uploaded_at', 'uploadedAt', 'created_at') || null,
    version: Number(pick(raw, 'version')) || 1,
    // pending · approved · rejected — any replacement goes back to pending.
    status: pick(raw, 'status') || null,
    // false = the record exists but the file is not in storage: show
    // "not available" instead of a link (the URL would answer 404).
    available: raw.available !== false,
    // Ready to use — never build it ourselves.
    url: pick(raw, 'url') || null,
  };
}

function normalizeStatus(raw) {
  const s = String(raw || '').toLowerCase();
  if (VERIFICATION_STATUSES.includes(s)) return s;
  if (s === 'approved') return 'verified';
  if (s === 'pending_reverification' || s === 'reverification') return 'reverification_pending';
  if (s === 'under_review' || s === 'submitted') return 'pending';
  return 'pending';
}

/** reverification: { required, requested_at, policy, fields, message } (guide §1). */
function normalizeReverification(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    required: Boolean(raw.required),
    requestedAt: raw.requested_at || null,
    policy: raw.policy || null,
    // server field names → form keys (e.g. "name" → companyName)
    fields: (Array.isArray(raw.fields) ? raw.fields : []).map((f) => API_TO_FIELD[f] || f),
    message: raw.message || null,
  };
}

const groupLevel = (fields, key) => fields.find((f) => f.key === key)?.level;

/** Turns a GET/PATCH/upload response into the shape the screens use. */
export function normalizeProfile(payload) {
  const row = unwrapApiData(payload) || {};
  // PATCH and document upload answer { profile, … }; GET answers the profile itself.
  const org = row.profile || row.organization || row.company || row;
  const values = {};
  PROFILE_FIELDS.forEach((f) => {
    let v = org.values?.[f.key];
    if (v == null) v = org[f.api];
    if (v == null) v = org[f.key];
    if (v == null) {
      const alias = Object.keys(API_TO_FIELD).find((k) => API_TO_FIELD[k] === f.key && org[k] != null);
      if (alias) v = org[alias];
    }
    values[f.key] = v == null ? '' : String(v);
  });
  // documents: two fixed slots keyed by the server type (business_registration,
  // additional); an empty slot is null. Preview data uses the UI kinds.
  const docsRaw = org.documents || {};
  const docList = Array.isArray(docsRaw) ? docsRaw : null;
  const docOf = ({ kind, api }) => normalizeDocument(
    docList
      ? docList.find((d) => [api, kind].includes(d.type || d.document_type || d.kind))
      : (docsRaw[api] ?? docsRaw[kind] ?? null),
  );
  const documents = {};
  DOCUMENT_KINDS.forEach((d) => { documents[d.kind] = docOf(d); });
  // A just-uploaded document (upload answer) wins over a stale profile copy.
  if (row.document) {
    const kind = DOCUMENT_API_TO_KIND[row.document.type] || row.document.type;
    if (kind) documents[kind] = normalizeDocument(row.document);
  }
  const status = normalizeStatus(org.verificationStatus || org.verification_status || org.status);

  // Completeness: server value (profile_completeness / completeness.percent);
  // missing groups from completeness.missing [{ field, level }] (field =
  // profile_fields[].key), else from profile_fields [{ key, level, done }].
  const profileFields = Array.isArray(org.profile_fields) ? org.profile_fields : [];
  const c = org.completeness || row.completeness;
  const serverPercent = c?.percent ?? c?.value ?? org.profile_completeness;
  let completeness;
  if (serverPercent != null) {
    let missing;
    if (Array.isArray(c?.missing) || Array.isArray(c?.missing_fields)) {
      missing = (c.missing || c.missing_fields).map((m) => {
        const key = typeof m === 'string' ? m : m.field;
        const level = (typeof m === 'object' && m.level) || groupLevel(profileFields, key) || 'required';
        if (COMPLETENESS_GROUPS[key]) return missingItem(key, level, values, documents);
        const formKey = API_TO_FIELD[key] || key; // an older field-level answer
        return { key: formKey, level: level === 'recommended' ? 'recommended' : 'required', target: formKey };
      });
    } else {
      missing = profileFields.filter((f) => !f.done).map((f) => missingItem(f.key, f.level || 'required', values, documents));
    }
    completeness = {
      percent: Math.max(0, Math.min(100, Number(serverPercent) || 0)),
      missing,
      version: c?.version || null,
      groups: profileFields.map((f) => ({ key: f.key, level: f.level || 'required' })),
      server: true,
    };
  } else {
    completeness = computeCompleteness(values, documents);
  }
  return {
    id: org.id ?? null,
    values,
    documents,
    logo: org.logo || null,
    verificationStatus: status,
    verificationNote: org.verificationNote || org.verification_note || org.rejection_reason || '',
    verifiedAt: org.verifiedAt || org.verified_at || null,
    updatedAt: org.profile_updated_at || org.updatedAt || org.updated_at || null,
    reverification: normalizeReverification(org.reverification || row.reverification),
    completeness,
  };
}

/** The PATCH body: changed fields only, under the backend's names. Never the status (BR-03). */
export function toPatchPayload(values, saved) {
  const keys = saved ? changedFields(values, saved) : PROFILE_FIELDS.filter((f) => !f.readOnly).map((f) => f.key);
  const body = {};
  keys.forEach((k) => {
    const f = PROFILE_FIELDS.find((x) => x.key === k);
    if (!f || f.readOnly) return; // type is read-only (422 FIELD_NOT_EDITABLE)
    const v = String(values[k] ?? '').trim();
    // An emptied optional field is sent as null (the GET shows null for empty).
    body[f.api] = v === '' ? null : v;
  });
  return body;
}

/**
 * 422 → field errors (AC-05). Laravel answers { errors: { field: [message] } };
 * a message may also be { code } (the shape the preview uses). Returns
 * { fieldErrors: { formKey: { code } | { message } }, other: [messages] }.
 */
export function mapServerErrors(err) {
  const fieldErrors = {};
  const other = [];
  const code = String(err?.code || '').toUpperCase();
  // 422 PROFILE_CONTACT_REQUIRED: email and phone emptied together.
  if (code === 'PROFILE_CONTACT_REQUIRED') {
    fieldErrors.contactEmail = { code: 'contactRequired' };
    fieldErrors.contactPhone = { code: 'contactRequired' };
  }
  // 422 FIELD_NOT_EDITABLE: a read-only field changed (should not happen from this form).
  if (code === 'FIELD_NOT_EDITABLE' && !Object.keys(err?.errors || {}).length) other.push(err.message);
  Object.entries(err?.errors || {}).forEach(([apiKey, list]) => {
    const first = Array.isArray(list) ? list[0] : list;
    const entry = first && typeof first === 'object' ? first : { message: String(first || '') };
    const key = API_TO_FIELD[apiKey];
    if (key) fieldErrors[key] = entry;
    else other.push(entry.message || err.message);
  });
  return { fieldErrors, other };
}

export const isValidationError = (err) => err?.status === 422;

/* ------------------------------------------------------------------ */
/* Preview store                                                       */
/* ------------------------------------------------------------------ */

const clone = (o) => JSON.parse(JSON.stringify(o));

function readStore() {
  try {
    const raw = window.localStorage.getItem(PREVIEW_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // storage unavailable: fall back to the sample
  }
  return clone(SAMPLE_PROFILE);
}

function writeStore(p) {
  try {
    window.localStorage.setItem(PREVIEW_PROFILE_KEY, JSON.stringify(p));
  } catch {
    // private mode / storage full: the change still shows until a refresh
  }
}

export function resetPreviewProfile() {
  try { window.localStorage.removeItem(PREVIEW_PROFILE_KEY); } catch { /* ignore */ }
}

function previewProfile(variant) {
  let p;
  if (variant === 'incomplete') p = clone(SAMPLE_PROFILE_INCOMPLETE);
  else p = readStore();
  if (variant === 'pending') p.verificationStatus = 'pending';
  if (variant === 'rejected') {
    p.verificationStatus = 'rejected';
    p.verificationNote = 'rejected_unreadable';
  }
  // Guide: the badge stays Verified; the new review is the reverification object.
  if (variant === 'reverification') {
    p.verificationStatus = 'verified';
    p.reverification = { required: true, requestedAt: '2026-11-03T14:10:00Z', policy: 'flag', fields: ['companyName'], message: 'A field that identifies your organization changed, so its verification is being reviewed again.' };
  }
  return { ...p, completeness: computeCompleteness(p.values, p.documents) };
}

const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

/* ------------------------------------------------------------------ */
/* Calls                                                               */
/* ------------------------------------------------------------------ */

/**
 * Cache key of the organization profile (src/cache). Preview variants
 * (?state=pending …) are separate answers, so each gets its own key.
 */
export function profileQueryKey({ preview, variant } = {}) {
  return apiKey('/api/v1/profile/me', null, { variant: preview ? `preview:${variant || 'default'}` : null });
}

export async function getProfile({ preview, variant } = {}) {
  if (preview) {
    await wait(250);
    return previewProfile(variant);
  }
  return normalizeProfile(await getCompanyProfile());
}

/**
 * Saves the profile. `saved` is the last loaded profile (for the changed-only
 * body and the re-verification check). Throws the client's error object; a 422
 * carries `errors` for mapServerErrors().
 */
export async function updateProfile(values, { preview, saved } = {}) {
  if (preview) {
    await wait(600);
    const store = readStore();
    const relevantFields = changedVerificationFields(values, store.values);
    const relevant = relevantFields.length > 0;
    store.values = { ...store.values, ...values };
    store.updatedAt = new Date().toISOString();
    // Preview stand-in for the server's "flag" policy (BR-09): the badge stays
    // Verified and a separate reverification flag is raised.
    if (relevant && store.verificationStatus === 'verified') {
      store.reverification = { required: true, requestedAt: store.updatedAt, policy: 'flag', fields: relevantFields, message: null };
    }
    writeStore(store);
    // Same cache clean-up a real PATCH gets in api.js (dashboard org card …).
    invalidateAfterMutation('PATCH', '/api/v1/profile/me');
    const next = { ...store, completeness: computeCompleteness(store.values, store.documents) };
    next.reverificationTriggered = Boolean(relevant && store.reverification?.required);
    return next;
  }
  const body = toPatchPayload(values, saved?.values);
  if (body.website) body.website = withScheme(body.website);
  const res = await updateCompanyProfile(body);
  const next = normalizeProfile(res);
  // data.changed lists what was written ([] = nothing changed, not an error).
  const data = unwrapApiData(res) || {};
  next.changed = Array.isArray(data.changed) ? data.changed : [];
  next.reverificationTriggered = Boolean(data.reverification_triggered);
  return next;
}

/**
 * Uploads or replaces a document (Scenario 4). The file is checked here first
 * (type + size, AC-07); the server checks again and may answer 422.
 * Returns the updated profile.
 */
export async function uploadDocument(kind, file, { preview, onProgress, signal } = {}) {
  const problem = validateCompanyDocument(file);
  if (problem) {
    const e = { status: 422, client: true, errors: { file: [{ code: problem }] }, message: problem };
    throw e;
  }
  if (preview) {
    for (let p = 10; p <= 100; p += 18) {
      onProgress?.(Math.min(100, p));
      await wait(110);
    }
    onProgress?.(100);
    const store = readStore();
    const prev = store.documents?.[kind];
    store.documents = {
      ...store.documents,
      [kind]: {
        name: file.name, size: file.size, mime: file.type,
        uploadedAt: new Date().toISOString(),
        version: (prev?.version || 0) + 1,
      },
    };
    if (kind === 'trade_license' && prev && store.verificationStatus === 'verified') {
      store.reverification = { required: true, requestedAt: new Date().toISOString(), policy: 'flag', fields: [], message: null };
    }
    writeStore(store);
    invalidateAfterMutation('POST', '/api/v1/company/profile/documents');
    return { ...store, completeness: computeCompleteness(store.values, store.documents) };
  }
  const form = new FormData();
  // multipart/form-data: type = business_registration | additional, file = the file.
  form.append('type', DOCUMENT_KINDS.find((d) => d.kind === kind)?.api || kind);
  form.append('file', file);
  const res = await uploadCompanyProfileDocument(form, { onProgress, signal });
  const next = normalizeProfile(res);
  const data = unwrapApiData(res) || {};
  next.reverificationTriggered = Boolean(data.reverification_triggered);
  return next;
}

/**
 * Opens / saves a document through its `url` (GET /api/v1/company/profile/documents/{id},
 * Bearer token, binary attachment). 404 DOCUMENT_NOT_FOUND / DOCUMENT_UNAVAILABLE
 * are thrown as the client's error object.
 */
export async function downloadDocument(doc) {
  if (!doc?.url) throw { status: 404, code: 'DOCUMENT_UNAVAILABLE', message: 'Document not available.' };
  const { blob, filename } = await downloadCompanyDocument(doc.url);
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename || doc.name || 'document';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 30000);
}

/** Absolute URL of the organization logo when the server sends one (GET shows "logo": null today). */
export function logoUrl(logo) {
  if (!logo || typeof logo !== 'string') return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  return logo.startsWith('/') && API_BASE_URL ? `${API_BASE_URL}${logo}` : null;
}

/** First error code of a document upload failure: 'type' | 'size' | 'malware' | null. */
export function documentErrorCode(err) {
  const first = err?.errors?.file?.[0] ?? err?.errors?.document?.[0];
  if (first && typeof first === 'object' && first.code) return first.code;
  // US-COMP-04 guide codes: DOCUMENT_TYPE_NOT_SUPPORTED / DOCUMENT_TYPE_UNKNOWN,
  // DOCUMENT_TOO_LARGE, DOCUMENT_REJECTED_BY_SCAN, DOCUMENT_MISSING.
  const code = String(err?.code || '').toUpperCase();
  if (code.includes('TYPE') || code.includes('MIME')) return 'type';
  if (code.includes('SIZE') || code.includes('TOO_LARGE') || err?.status === 413) return 'size';
  if (code.includes('MALWARE') || code.includes('VIRUS') || code.includes('SCAN')) return 'malware';
  return null;
}
