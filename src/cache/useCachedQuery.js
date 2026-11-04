import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  fetchQuery,
  getEntry,
  isExpired,
  isFresh,
  registerFetcher,
  setQueryData,
  settingsFor,
  subscribe,
} from './queryCache';

const noopSubscribe = () => () => {};
const NONE = Object.freeze({ data: undefined, error: null, updatedAt: 0, promise: null, invalidated: false });

/**
 * useCachedQuery(key, fetcher, options) — stale-while-revalidate for a screen.
 *
 *   const { data, error, isLoading, isRefreshing, refetch, setData } =
 *     useCachedQuery(apiKey('/api/v1/profile/me'), () => getProfile());
 *
 *   data          last answer (cached or fresh); undefined until there is one
 *   error         the last request's error (data stays on screen if we had some)
 *   isLoading     true ONLY when there is nothing to show yet → show the skeleton
 *   isRefreshing  true while a background request runs and data is shown
 *   status        'loading' | 'error' | 'ready' (same words as the dashboard sections)
 *   refetch()     ask the server again now (Retry buttons)
 *   setData(fn)   local change without a request (optimistic update / rollback)
 *   updatedAt     when the shown answer came from the server (ms)
 *
 * On mount / key change: a fresh cached answer is used as is; an older one (up
 * to maxAge) is shown at once and refreshed in the background; nothing usable
 * → the fetcher runs and isLoading is true. Identical requests in flight are
 * shared. TTLs and tags come from cacheConfig.js; `options` can override
 * { staleTime, maxAge, tags }, plus:
 *   enabled  false → no request (preview "loading"/"error" states)
 *   select   (data) => part of it (several sections can share one request);
 *            keep it stable (module-level / useMemo), like a useEffect dep
 *
 * `key` null/undefined behaves like enabled: false.
 */
export function useCachedQuery(key, fetcher, options = {}) {
  const { enabled = true, select, staleTime, maxAge, tags } = options;
  const active = Boolean(key) && enabled;

  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const overrides = useMemo(() => {
    const o = {};
    if (staleTime != null) o.staleTime = staleTime;
    if (maxAge != null) o.maxAge = maxAge;
    if (tags) o.tags = tags;
    return o;
    // tags compared by value so an inline array does not refetch every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleTime, maxAge, tags && tags.join('|')]);

  // One stable fetcher per key that always calls the latest `fetcher` prop.
  const stableFetcher = useCallback((ctx) => fetcherRef.current(ctx), []);

  const sub = useCallback((cb) => (key ? subscribe(key, cb) : () => {}), [key]);
  const entry = useSyncExternalStore(
    key ? sub : noopSubscribe,
    () => (key ? getEntry(key) : NONE),
    () => (key ? getEntry(key) : NONE),
  );

  // Revalidate on mount and whenever the key changes.
  useEffect(() => {
    if (!active) return undefined;
    const unregister = registerFetcher(key, stableFetcher);
    const settings = settingsFor(key, overrides);
    const e = getEntry(key);
    if (!isFresh(e, settings.staleTime)) {
      fetchQuery(key, stableFetcher, { ...overrides, force: e.data !== undefined }).catch(() => {});
    }
    return unregister;
  }, [active, key, stableFetcher, overrides]);

  const limit = settingsFor(key || '', overrides).maxAge;
  // Older than maxAge → not shown (the screen shows its loading state instead).
  const usable = entry.data !== undefined && !isExpired(entry, limit);
  const raw = usable ? entry.data : undefined;

  // Pass a stable `select` (module-level or memoized) to keep `data` stable.
  const data = useMemo(() => {
    if (raw === undefined) return undefined;
    return select ? select(raw) : raw;
  }, [raw, select]);

  const inFlight = Boolean(entry.promise);
  const hasData = data !== undefined;
  // Expired data is not shown; while its replacement loads, it is "loading".
  const isLoading = active && !hasData && (inFlight || !entry.error);
  const status = hasData ? 'ready' : isLoading || !active ? 'loading' : entry.error ? 'error' : 'loading';

  const refetch = useCallback(
    () => (key ? fetchQuery(key, stableFetcher, { ...overrides, force: true }) : Promise.resolve(undefined)),
    [key, stableFetcher, overrides],
  );
  const setData = useCallback((updater) => (key ? setQueryData(key, updater) : undefined), [key]);

  return {
    data,
    error: entry.error || null,
    isLoading,
    isRefreshing: hasData && inFlight,
    status,
    refetch,
    setData,
    updatedAt: usable ? entry.updatedAt : 0,
  };
}
