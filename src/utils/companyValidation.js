// Format checks shared by Company Registration (US-COMP-01) and the
// Organization Profile edit form (US-COMP-04, BR-05). The backend validates
// again before saving (BR-04); these only give the user an early, inline
// message. TODO(api, to be confirmed): align the phone rule with the backend.
import {
  COMPANY_DOCUMENT_EXTENSIONS,
  COMPANY_DOCUMENT_MAX_BYTES,
  COMPANY_DOCUMENT_MIME_TYPES,
} from '../config';

/** http(s) URL. Empty is allowed — callers decide whether the field is required. */
export function isValidUrl(str) {
  if (!str) return true;
  try {
    const url = new URL(str);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.');
  } catch {
    return false;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export function isValidEmail(str) {
  if (!str) return true;
  return EMAIL_RE.test(String(str).trim());
}

// International format: optional leading +, digits with spaces, dashes,
// dots or brackets, 7–15 digits in total (E.164 allows up to 15).
const PHONE_CHARS_RE = /^\+?[\d\s\-().]+$/;
export function isValidPhone(str) {
  if (!str) return true;
  const value = String(str).trim();
  if (!PHONE_CHARS_RE.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Checks an organization document before upload (BR-06 / AC-07).
 * Returns null when the file is acceptable, otherwise 'type' or 'size'.
 */
export function validateCompanyDocument(file) {
  if (!file) return 'type';
  const name = String(file.name || '').toLowerCase();
  const extOk = COMPANY_DOCUMENT_EXTENSIONS.some((ext) => name.endsWith(ext));
  const typeOk = file.type ? COMPANY_DOCUMENT_MIME_TYPES.includes(file.type) : extOk;
  if (!typeOk || !extOk) return 'type';
  if (file.size > COMPANY_DOCUMENT_MAX_BYTES) return 'size';
  return null;
}
