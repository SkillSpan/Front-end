import { companyRequest, unwrapApiData } from '../../../../api';
import { invalidateAfterMutation } from '../../../../cache/queryCache';

/*
 * Shared plumbing for the four Sprint 4 API modules
 * (projectPublicationApi · projectLifecycleApi · applicationReviewApi · teamFormationApi).
 *
 * live    → companyRequest() in src/api.js (Bearer token, 401 → session
 *           expired, error shape { status, code, message, errors, details },
 *           cache invalidation from src/cache/cacheConfig.js)
 * preview → the in-memory mock backend (projects/mockBackend.js), same answer
 *           shape, same cache invalidation — design-preview builds and tests only.
 */

export { unwrapApiData };

/** One key per user action, reused when that same action is retried (NFR-REL-03). */
export function newIdempotencyKey(prefix = 'act') {
  const rnd = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${rnd}`;
}

// TODO(api): header name for safe retries is not in any guide yet; Laravel
// projects commonly read "Idempotency-Key". Confirm with the backend.
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export function idempotencyHeaders(key) {
  return key ? { [IDEMPOTENCY_HEADER]: key } : undefined;
}

const PREVIEW_DELAY_MS = 220;
const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

/**
 * Run a mock-backend call like a request: async, a short delay so loading
 * states are real, and the same cache invalidation a live mutation gets.
 */
export async function previewCall(fn, { method = 'GET', path, delay = PREVIEW_DELAY_MS } = {}) {
  if (delay) await wait(delay);
  const result = fn();
  if (method !== 'GET' && path) invalidateAfterMutation(method, path);
  return JSON.parse(JSON.stringify(result));
}

export function liveCall(path, options) {
  return companyRequest(path, options);
}

/** Laravel paginator (with or without `meta`) → { items, page, perPage, total, lastPage, meta }. */
export function normalizePage(payload, map = (x) => x, { page = 1, perPage = 10 } = {}) {
  const body = payload?.data && !Array.isArray(payload.data) && Array.isArray(payload.data.data) ? payload.data : payload;
  const rows = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
  const meta = body?.meta || payload?.meta || {};
  const size = Number(meta.per_page) || perPage;
  const total = Number(meta.total ?? rows.length) || 0;
  return {
    items: rows.map(map),
    page: Number(meta.current_page) || page,
    perPage: size,
    total,
    lastPage: Number(meta.last_page) || Math.max(1, Math.ceil(total / size)),
    meta,
  };
}

export function toQuery(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}
