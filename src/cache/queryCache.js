import {
  CACHE_DEFAULTS,
  PERSIST_TO_SESSION_STORAGE,
  SEND_ACCEPT_LANGUAGE,
  cacheRuleFor,
  invalidationFor,
  isNeverCached,
} from './cacheConfig';

/*
 * The store behind the frontend API cache (no library, ~250 lines).
 *
 * One entry per key: { data, error, updatedAt, promise, tags, invalidated }.
 * Entries are replaced (never mutated) on every change so React's
 * useSyncExternalStore sees the change. Keys are strings built by apiKey():
 *
 *   "GET /api/v1/notifications?page=1&per_page=10"
 *   "GET /api/v1/profile/me [preview:pending]"     (a variant of the same data)
 *   "GET /api/v1/projects |lang=ar"                 (only with SEND_ACCEPT_LANGUAGE)
 *
 * Safety:
 *  - clearQueryCache() (logout, 401, user/org change) drops everything and bumps
 *    a generation number: a request that started before the clear can never
 *    write its answer into the cache after it.
 *  - Errors are kept only until the next attempt; they are never "fresh".
 *  - Nothing is written to storage unless PERSIST_TO_SESSION_STORAGE is on,
 *    and then only rules marked `persist` (public reference lists).
 */

const entries = new Map();
const subscribers = new Map(); // key → Set<listener>
const activeFetchers = new Map(); // key → latest fetcher of a mounted hook
let generation = 0;

const STORAGE_PREFIX = 'skillspan.apiCache.v1:';
const EMPTY = Object.freeze({ data: undefined, error: null, updatedAt: 0, promise: null, tags: [], invalidated: false });

const now = () => Date.now();

/* ------------------------------------------------------------------ */
/* Keys                                                                */
/* ------------------------------------------------------------------ */

export function currentLocale() {
  try {
    const lang = typeof document !== 'undefined' ? document.documentElement.getAttribute('lang') : '';
    return lang === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

/** Path part of a key ("/api/v1/notifications"), used to find its config rule. */
export function pathOfKey(key) {
  const m = /^[A-Z]+ ([^?\s#|[]+)/.exec(String(key));
  return m ? m[1] : String(key);
}

/**
 * Builds a cache key: method + path + sorted params (+ variant) (+ language).
 *   apiKey('/api/v1/notifications', { page: 1, per_page: 10 })
 *   apiKey('/api/v1/profile/me', null, { variant: 'preview:pending' })
 * Query strings already in `path` are normalised (sorted) too.
 */
export function apiKey(path, params, { method = 'GET', variant, locale } = {}) {
  const [base, query = ''] = String(path).split('?');
  const q = new URLSearchParams(query);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    q.set(k, String(v));
  });
  const sorted = [...q.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const qs = new URLSearchParams(sorted).toString();
  let key = `${method.toUpperCase()} ${base}${qs ? `?${qs}` : ''}`;
  if (variant) key += ` [${variant}]`;
  const lang = locale || (SEND_ACCEPT_LANGUAGE ? currentLocale() : null);
  if (lang) key += ` |lang=${lang}`;
  return key;
}

/** TTLs + tags for a key, from cacheConfig.js. */
export function settingsFor(key, overrides = {}) {
  const rule = cacheRuleFor(pathOfKey(key));
  return {
    staleTime: overrides.staleTime ?? rule?.staleTime ?? CACHE_DEFAULTS.staleTime,
    maxAge: overrides.maxAge ?? rule?.maxAge ?? CACHE_DEFAULTS.maxAge,
    tags: overrides.tags ?? rule?.tags ?? [],
    persist: Boolean(rule?.persist),
    neverCache: isNeverCached(pathOfKey(key)),
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

function notify(key) {
  const set = subscribers.get(key);
  if (set) set.forEach((fn) => { try { fn(); } catch { /* one bad listener must not break the rest */ } });
}

function notifyAll() {
  subscribers.forEach((_, key) => notify(key));
}

function write(key, patch) {
  const prev = entries.get(key) || EMPTY;
  const next = { ...prev, ...patch };
  entries.set(key, next);
  notify(key);
  return next;
}

function persistWrite(key, entry, persist) {
  if (!PERSIST_TO_SESSION_STORAGE || !persist) return;
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify({ data: entry.data, updatedAt: entry.updatedAt }));
  } catch { /* storage full / unavailable: memory still works */ }
}

function persistRead(key) {
  if (!PERSIST_TO_SESSION_STORAGE) return null;
  const { persist, tags } = settingsFor(key);
  if (!persist) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const { data, updatedAt } = JSON.parse(raw);
    return write(key, { data, updatedAt, tags, error: null });
  } catch {
    return null;
  }
}

function persistRemove(key) {
  if (!PERSIST_TO_SESSION_STORAGE) return;
  try { window.sessionStorage.removeItem(STORAGE_PREFIX + key); } catch { /* ignore */ }
}

function persistClearAll() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    Object.keys(window.sessionStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}

/** The raw entry (or a frozen empty one). Stable reference until it changes. */
export function getEntry(key) {
  if (!key) return EMPTY;
  return entries.get(key) || persistRead(key) || EMPTY;
}

/** Cached data if it is still inside its max age, else undefined. */
export function getQueryData(key, { maxAge } = {}) {
  const e = getEntry(key);
  if (e.data === undefined) return undefined;
  const limit = maxAge ?? settingsFor(key).maxAge;
  return now() - e.updatedAt <= limit ? e.data : undefined;
}

/** True when the entry's answer is older than `maxAge` ms (never shown then). */
export function isExpired(entry, maxAge) {
  return !entry.updatedAt || now() - entry.updatedAt > maxAge;
}

export function isFresh(entry, staleTime) {
  return entry.data !== undefined && !entry.invalidated && now() - entry.updatedAt < staleTime;
}

export function subscribe(key, listener) {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(listener);
  return () => {
    const set = subscribers.get(key);
    if (!set) return;
    set.delete(listener);
    if (!set.size) subscribers.delete(key);
  };
}

const isActive = (key) => (subscribers.get(key)?.size || 0) > 0;

/** A mounted useCachedQuery registers its fetcher so invalidation can refetch it. */
export function registerFetcher(key, fetcher) {
  activeFetchers.set(key, fetcher);
  return () => { if (activeFetchers.get(key) === fetcher) activeFetchers.delete(key); };
}

/**
 * Returns the data for `key`:
 *   fresh cached answer → returned at once, no request
 *   same request already running → that same promise (dedupe)
 *   otherwise → `fetcher({ force })` runs and its answer is cached
 * `force: true` skips the freshness check (background revalidation, Retry);
 * it still joins a request that is already running.
 */
export function fetchQuery(key, fetcher, options = {}) {
  const { force = false } = options;
  const settings = settingsFor(key, options);
  const entry = getEntry(key);

  if (settings.neverCache) return Promise.resolve().then(() => fetcher({ force }));
  if (!force && isFresh(entry, settings.staleTime)) return Promise.resolve(entry.data);
  if (entry.promise) return entry.promise;

  const gen = generation;
  const promise = Promise.resolve()
    .then(() => fetcher({ force }))
    .then(
      (data) => {
        // Cleared (logout / 401 / user change) or replaced while in flight: never write.
        if (gen === generation && entries.get(key)?.promise === promise) {
          const next = write(key, { data, error: null, updatedAt: now(), promise: null, tags: settings.tags, invalidated: false });
          persistWrite(key, next, settings.persist);
        }
        return data;
      },
      (error) => {
        if (gen === generation && entries.get(key)?.promise === promise) {
          write(key, { error, promise: null });
        }
        throw error;
      },
    );
  write(key, { promise, tags: settings.tags });
  prune();
  return promise;
}

/**
 * Local change without a request (optimistic update / rollback / the answer
 * of a save). `updater` is a value or (old) => new. Keeps updatedAt unless
 * `{ touch: true }` (a server answer counts as fresh).
 */
export function setQueryData(key, updater, { touch = false } = {}) {
  const prev = getEntry(key);
  const data = typeof updater === 'function' ? updater(prev.data) : updater;
  const patch = { data, error: null };
  if (touch || !prev.updatedAt) {
    patch.updatedAt = now();
    patch.invalidated = false;
    patch.tags = prev.tags?.length ? prev.tags : settingsFor(key).tags;
  }
  return write(key, patch).data;
}

function entryMatches(key, entry, { tags, keyPrefix, predicate }) {
  if (keyPrefix && !key.startsWith(keyPrefix)) return false;
  if (tags && !tags.some((t) => entry.tags?.includes(t))) return false;
  if (predicate && !predicate(key, entry)) return false;
  return Boolean(tags || keyPrefix || predicate);
}

/**
 * Invalidates matching entries (by tags, key prefix or predicate):
 *   not on screen → dropped (next visit loads fresh)
 *   on screen     → marked stale and, if `refetchActive`, refetched in the
 *                   background (the screen keeps its data until then)
 * Returns the number of entries touched.
 */
export function invalidateQueries({ tags, keyPrefix, predicate, refetchActive = true } = {}) {
  let n = 0;
  [...entries.entries()].forEach(([key, entry]) => {
    if (!entryMatches(key, entry, { tags, keyPrefix, predicate })) return;
    n += 1;
    if (!isActive(key)) {
      entries.delete(key);
      persistRemove(key);
      return;
    }
    const fetcher = activeFetchers.get(key);
    if (refetchActive && fetcher) {
      // A request that started before the mutation may carry the old answer:
      // let it finish unseen and ask again.
      write(key, { invalidated: true, promise: null });
      fetchQuery(key, fetcher, { force: true }).catch(() => {});
    } else {
      write(key, { invalidated: true });
    }
  });
  return n;
}

/**
 * Central hook for mutations: looks the request up in INVALIDATION_MAP and
 * invalidates the tags it lists. api.js calls this after every successful
 * POST/PATCH/PUT/DELETE; preview-mode mock mutations call it themselves.
 */
export function invalidateAfterMutation(method, path) {
  const hit = invalidationFor(method, path);
  if (!hit) return 0;
  return invalidateQueries({ tags: hit.tags, refetchActive: hit.refetchActive });
}

/** Drops every entry (memory + session storage). Logout, 401, user/org change. */
export function clearQueryCache() {
  generation += 1;
  entries.clear();
  persistClearAll();
  notifyAll();
}

/** Entries past their max age that no screen uses are removed now and then. */
function prune() {
  if (entries.size < 150) return;
  const t = now();
  [...entries.entries()].forEach(([key, e]) => {
    if (isActive(key) || e.promise) return;
    if (t - e.updatedAt > settingsFor(key).maxAge) entries.delete(key);
  });
}

/* ------------------------------------------------------------------ */
/* Who is signed in                                                    */
/* ------------------------------------------------------------------ */

let scope = null;

/**
 * Called with the signed-in user (or null). When the user or their
 * organization changes, the whole cache is cleared so one account never sees
 * another's answers.
 */
export function setCacheScope(user) {
  const next = user
    ? `${user.id ?? user.user_id ?? user.uuid ?? user.email ?? '?'}:${user.organizations?.[0]?.id ?? user.organization_id ?? ''}`
    : null;
  if (scope !== null && next !== scope) clearQueryCache();
  scope = next;
}

/** For tests: number of entries in memory. */
export const cacheSize = () => entries.size;
