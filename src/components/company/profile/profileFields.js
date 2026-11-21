import { isValidEmail, isValidPhone, isValidUrl } from '../../../utils/companyValidation';

/*
 * Organization Profile schema (US-COMP-04). Form keys reuse the Company
 * Registration form (US-COMP-01, CompanyStep2 + payloadMapping.js) so the two
 * screens talk about the same data.
 *
 *  key            — form field name (same as the registration form)
 *  api            — backend field name on GET/PATCH /api/v1/profile/me
 *                   (US-COMP-04 frontend guide, §1/§2)
 *  section        — which card it sits in
 *  required       — validated as required on the client (the server re-checks, BR-04)
 *  format         — 'email' | 'url' | 'phone' (BR-05)
 *  readOnly       — shown, never sent. The guide's read-only fields are
 *                   type · verification_status · verified_at (sending a
 *                   different value answers 422 FIELD_NOT_EDITABLE)
 *  verification   — verification-relevant: changing it follows the
 *                   re-verification policy (BR-09). The server says which
 *                   fields it watches in reverification.fields (sample: ["name"]).
 *
 * Editable on the server: name · industry · company_size · website ·
 * description · country · city · address · postal_code · contact_email ·
 * contact_phone. Extra server rule: contact_email and contact_phone cannot
 * both be empty (422 PROFILE_CONTACT_REQUIRED) — validated here as
 * 'contactRequired'. `website` may be sent without https:// (the server adds it).
 *
 * Representative account details (Contact Full Name, Work Email, Password)
 * are deliberately NOT here (BR-11) — they belong to account settings.
 * Verification status is read-only and never sent (BR-03).
 */
export const PROFILE_FIELDS = [
  { key: 'companyName', api: 'name', section: 'info', required: true, verification: true, maxLength: 120, autoComplete: 'organization' },
  { key: 'organizationType', api: 'type', section: 'info', readOnly: true, control: 'select', options: 'types' },
  { key: 'industry', api: 'industry', section: 'info', control: 'select', options: 'industries' },
  { key: 'companySize', api: 'company_size', section: 'info', control: 'select', options: 'sizes' },
  { key: 'website', api: 'website', section: 'info', format: 'url', maxLength: 255, inputMode: 'url', autoComplete: 'url', wide: true },
  { key: 'companyDescription', api: 'description', section: 'info', control: 'textarea', maxLength: 1000, wide: true },
  { key: 'country', api: 'country', section: 'location', maxLength: 80, autoComplete: 'country-name' },
  { key: 'city', api: 'city', section: 'location', maxLength: 80, autoComplete: 'address-level2' },
  { key: 'address', api: 'address', section: 'location', maxLength: 255, autoComplete: 'street-address', wide: true },
  { key: 'postalCode', api: 'postal_code', section: 'location', maxLength: 20, autoComplete: 'postal-code' },
  { key: 'contactEmail', api: 'contact_email', section: 'contact', format: 'email', maxLength: 255, inputMode: 'email', autoComplete: 'email', type: 'email' },
  { key: 'contactPhone', api: 'contact_phone', section: 'contact', format: 'phone', maxLength: 20, inputMode: 'tel', autoComplete: 'tel', type: 'tel' },
];

export const PROFILE_SECTIONS = ['info', 'location', 'contact'];
export const FIELD_BY_KEY = Object.fromEntries(PROFILE_FIELDS.map((f) => [f.key, f]));
export const VERIFICATION_FIELDS = PROFILE_FIELDS.filter((f) => f.verification).map((f) => f.key);

// Other names the backend may use for the same field (snake_case of the form
// key, older aliases). Used when reading a response and when mapping 422 errors.
const ALIASES = {
  companyName: ['organization_name', 'company_name'],
  organizationType: ['organization_type', 'company_type'],
  industry: ['organization_industry'],
  companySize: ['organization_size', 'size'],
  companyDescription: ['company_description'],
  contactEmail: ['organization_contact_email', 'company_contact_email', 'email'],
  contactPhone: ['organization_contact_phone', 'company_contact_phone', 'phone'],
};

export const API_TO_FIELD = (() => {
  const map = {};
  PROFILE_FIELDS.forEach((f) => {
    map[f.api] = f.key;
    map[f.key] = f.key;
    (ALIASES[f.key] || []).forEach((a) => { if (!map[a]) map[a] = f.key; });
  });
  return map;
})();

// Two fixed document slots (US-COMP-04 guide): `api` is the server's slot /
// multipart `type` value; `kind` stays the UI's key (translations, preview data).
export const DOCUMENT_KINDS = [
  { kind: 'trade_license', api: 'business_registration', required: true, verification: true },
  { kind: 'additional', api: 'additional', required: false, verification: false },
];
export const DOCUMENT_API_TO_KIND = Object.fromEntries(DOCUMENT_KINDS.map((d) => [d.api, d.kind]));

/**
 * Verification statuses the UI knows. The server only sends pending · verified ·
 * rejected (guide: there is no "approved" and no "reverification_pending" —
 * a new review is read from the separate `reverification` object and the
 * badge stays Verified under the default "flag" policy). The two
 * reverification_* values are kept for the design-preview states only.
 */
export const VERIFICATION_STATUSES = ['verified', 'pending', 'rejected', 'reverification_required', 'reverification_pending'];

/*
 * Profile completeness (BR-08). The real value comes from the server
 * (profile_completeness / completeness.percent, rules version
 * completeness.version) with profile_fields [{ key, level, done }] — one
 * entry per GROUP of fields. Group keys = the company.ws.field.* translations.
 * The server percent matches done groups ÷ all groups (guide samples: 4/6 =
 * 67, 5/6 = 83). This table is only used to (a) point a missing group at the
 * form fields that fill it, and (b) give an estimate while the form is being
 * edited / in preview builds. TODO(api): the exact per-group rules are the
 * server's ("v1"); the `done` checks below are our reading of them.
 */
export const COMPLETENESS_GROUPS = {
  info: ['companyName', 'organizationType', 'industry'],
  contact: ['contactEmail', 'contactPhone'],
  address: ['country', 'city', 'address', 'postalCode'],
  size: ['companySize'],
  website: ['website'],
  description: ['companyDescription'],
  license: ['doc:trade_license'],
};

// Used when the server sent no profile_fields (preview builds).
export const DEFAULT_COMPLETENESS_FIELDS = [
  { key: 'info', level: 'required' },
  { key: 'contact', level: 'required' },
  { key: 'address', level: 'required' },
  { key: 'size', level: 'recommended' },
  { key: 'website', level: 'recommended' },
  { key: 'description', level: 'recommended' },
];

const filled = (v) => v != null && String(v).trim() !== '';

const hasValue = (key, values, documents) => (key.startsWith('doc:') ? Boolean(documents?.[key.slice(4)]) : filled(values?.[key]));

/** Client reading of "is this group done". */
export function groupDone(group, values = {}, documents = {}) {
  const has = (k) => hasValue(k, values, documents);
  switch (group) {
    case 'info': return has('companyName') && has('industry');
    case 'contact': return has('contactEmail') || has('contactPhone');
    case 'address': return has('country') && has('city') && has('address');
    default: return (COMPLETENESS_GROUPS[group] || []).every(has);
  }
}

/** The empty form fields of a group (where "Add" sends the user), first = focus target. */
export function emptyFieldsOf(group, values = {}, documents = {}) {
  const keys = COMPLETENESS_GROUPS[group] || [];
  const empty = keys.filter((k) => !hasValue(k, values, documents) && k !== 'organizationType');
  return empty.length ? empty : keys.slice(0, 1);
}

/** A missing group → the item CompletenessCard shows. */
export function missingItem(group, level, values, documents) {
  const fields = emptyFieldsOf(group, values, documents);
  return { key: group, group: true, level: level === 'required' ? 'required' : 'recommended', fields, target: fields[0] || group };
}

/**
 * Estimate from the form values: `groups` = the server's profile_fields
 * ({ key, level }) when known, otherwise DEFAULT_COMPLETENESS_FIELDS.
 */
export function computeCompleteness(values = {}, documents = {}, groups = DEFAULT_COMPLETENESS_FIELDS) {
  const list = (groups && groups.length ? groups : DEFAULT_COMPLETENESS_FIELDS);
  const missing = list
    .filter((g) => !groupDone(g.key, values, documents))
    .map((g) => missingItem(g.key, g.level, values, documents))
    .sort((a, b) => (a.level === b.level ? 0 : a.level === 'required' ? -1 : 1));
  const percent = Math.round(((list.length - missing.length) / list.length) * 100);
  return { percent, missing };
}

/**
 * Client-side validation (AC-04). Returns { fieldKey: { code } } — codes are
 * 'required' | 'email' | 'url' | 'phone' | 'maxLength'.
 */
// The server accepts a website without a scheme and stores it with https://.
export const withScheme = (v) => (v && !/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? `https://${v}` : v);

export function validateProfile(values = {}) {
  const errors = {};
  PROFILE_FIELDS.forEach((f) => {
    if (f.readOnly) return;
    const raw = values[f.key];
    const v = raw == null ? '' : String(raw).trim();
    if (f.required && !v) { errors[f.key] = { code: 'required' }; return; }
    if (!v) return;
    if (f.maxLength && v.length > f.maxLength) { errors[f.key] = { code: 'maxLength', max: f.maxLength }; return; }
    if (f.format === 'email' && !isValidEmail(v)) errors[f.key] = { code: 'email' };
    else if (f.format === 'url' && !isValidUrl(withScheme(v))) errors[f.key] = { code: 'url' };
    else if (f.format === 'phone' && !isValidPhone(v)) errors[f.key] = { code: 'phone' };
  });
  // PROFILE_CONTACT_REQUIRED: email and phone cannot both be empty.
  if (!filled(values.contactEmail) && !filled(values.contactPhone)) {
    if (!errors.contactEmail) errors.contactEmail = { code: 'contactRequired' };
    if (!errors.contactPhone) errors.contactPhone = { code: 'contactRequired' };
  }
  return errors;
}

/** Verification-relevant fields whose value differs from the saved profile (BR-09). */
export function changedVerificationFields(values = {}, saved = {}) {
  return VERIFICATION_FIELDS.filter((k) => String(values[k] ?? '').trim() !== String(saved[k] ?? '').trim());
}

/** Fields whose value differs from the saved profile — the PATCH body. */
export function changedFields(values = {}, saved = {}) {
  return PROFILE_FIELDS.filter((f) => !f.readOnly).map((f) => f.key).filter((k) => String(values[k] ?? '').trim() !== String(saved[k] ?? '').trim());
}
