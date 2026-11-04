import { useCallback, useEffect, useState } from 'react';
import { useCachedQuery } from '../../../cache/useCachedQuery';

/*
 * State of one dashboard section: { status: 'loading' | 'ready' | 'error',
 * data, error, retry, update, isRefreshing }. Each section owns its own
 * request, so one failing section never blanks the others (US-COMP-03
 * Scenario 6, BR-14).
 *
 * `spec` comes from createDashboardSections():
 *   live:    { key, load({ force }), select? } → cached (src/cache): a revisit
 *            shows the last answer at once and refreshes it in the background;
 *            `update` (optimistic "mark as read") writes into the cache too.
 *   preview: { initial(), load({ fresh }) } → sample data, no cache.
 */
export function useDashboardSection(spec) {
  const cachedSpec = Boolean(spec.key);
  const cached = useCachedQuery(cachedSpec ? spec.key : null, (ctx) => spec.load({ fresh: Boolean(ctx?.force), force: ctx?.force }), {
    enabled: cachedSpec,
    select: spec.select,
    tags: spec.tags,
  });

  const [initial] = useState(() => (cachedSpec ? null : spec.initial?.() || null));
  const [state, setState] = useState(() => initial || { status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (cachedSpec) return undefined;
    // Preview builds hand us a finished state synchronously; only a Retry reloads it.
    if (attempt === 0 && initial) return undefined;
    let cancelled = false;
    Promise.resolve()
      .then(() => spec.load({ fresh: attempt > 0 }))
      .then((data) => { if (!cancelled) setState({ status: 'ready', data }); })
      .catch((error) => { if (!cancelled) setState({ status: 'error', error }); });
    return () => { cancelled = true; };
  }, [spec, attempt, initial, cachedSpec]);

  const { refetch, setData } = cached;
  const retry = useCallback(() => {
    if (cachedSpec) {
      refetch().catch(() => {});
      return;
    }
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, [cachedSpec, refetch]);

  // Local edits (e.g. optimistic "mark as read") without a refetch.
  const update = useCallback((fn) => {
    if (cachedSpec) {
      setData((d) => (d === undefined ? d : fn(d)));
      return;
    }
    setState((s) => (s.status === 'ready' ? { ...s, data: fn(s.data) } : s));
  }, [cachedSpec, setData]);

  if (cachedSpec) {
    return {
      status: cached.status,
      data: cached.data,
      error: cached.status === 'error' ? cached.error : undefined,
      isRefreshing: cached.isRefreshing,
      retry,
      update,
    };
  }
  return { ...state, retry, update };
}
