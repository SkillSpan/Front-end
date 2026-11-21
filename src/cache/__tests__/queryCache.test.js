import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  apiKey,
  cacheSize,
  clearQueryCache,
  fetchQuery,
  getQueryData,
  invalidateAfterMutation,
  setCacheScope,
  setQueryData,
  settingsFor,
  subscribe,
} from '../queryCache';
import { CACHE_DEFAULTS, invalidationFor } from '../cacheConfig';

const PROFILE = apiKey('/api/v1/profile/me');
const ORG = apiKey('/api/v1/organization/profile');
const SUMMARY = apiKey('/api/v1/company/dashboard');
const NOTIFS = apiKey('/api/v1/notifications', { page: 1, per_page: 10 });
const COUNT = apiKey('/api/v1/notifications/unread-count');

afterEach(() => {
  vi.useRealTimers();
  clearQueryCache();
  setCacheScope(null);
});

describe('cache keys', () => {
  it('are method + path + sorted params, with an optional variant', () => {
    expect(apiKey('/api/v1/notifications', { per_page: 10, page: 2 })).toBe('GET /api/v1/notifications?page=2&per_page=10');
    expect(apiKey('/api/v1/notifications?per_page=10&page=2')).toBe('GET /api/v1/notifications?page=2&per_page=10');
    expect(apiKey('/api/v1/notifications', { page: 1, unread: null })).toBe('GET /api/v1/notifications?page=1');
    expect(apiKey('/api/v1/profile/me', null, { variant: 'preview:pending' })).toBe('GET /api/v1/profile/me [preview:pending]');
  });

  it('carry the language when one is given, so EN and AR answers never mix', () => {
    const en = apiKey('/api/v1/projects', null, { locale: 'en' });
    const ar = apiKey('/api/v1/projects', null, { locale: 'ar' });
    expect(en).not.toBe(ar);
    expect(ar).toContain('|lang=ar');
  });

  it('take their TTLs and tags from cacheConfig.js', () => {
    expect(settingsFor(PROFILE)).toMatchObject({ staleTime: 60000, maxAge: 600000, tags: ['profile'] });
    expect(settingsFor(NOTIFS).tags).toContain('notifications');
    expect(settingsFor('GET /api/v1/unknown')).toMatchObject(CACHE_DEFAULTS);
  });

  it('never cache auth endpoints', async () => {
    const key = apiKey('/api/v1/auth/me');
    expect(settingsFor(key).neverCache).toBe(true);
    const fetcher = vi.fn().mockResolvedValue({ token: 'secret' });
    await fetchQuery(key, fetcher);
    await fetchQuery(key, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(getQueryData(key)).toBeUndefined();
  });
});

describe('fetchQuery', () => {
  it('cache hit: a fresh answer is reused without a request', async () => {
    const fetcher = vi.fn().mockResolvedValue({ name: 'Nova Tech' });
    expect(await fetchQuery(PROFILE, fetcher)).toEqual({ name: 'Nova Tech' });
    expect(await fetchQuery(PROFILE, fetcher)).toEqual({ name: 'Nova Tech' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('dedupes identical requests that are in flight', async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise((r) => { resolve = r; }));
    const a = fetchQuery(SUMMARY, fetcher);
    const b = fetchQuery(SUMMARY, fetcher, { force: true });
    await Promise.resolve();
    resolve({ tasks: [] });
    expect(await a).toEqual({ tasks: [] });
    expect(await b).toEqual({ tasks: [] });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('TTL: refetches once stale, and drops the answer after max age', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-03T10:00:00Z'));
    const fetcher = vi.fn().mockResolvedValueOnce('v1').mockResolvedValueOnce('v2');
    await fetchQuery(SUMMARY, fetcher); // dashboard: fresh 30 s, max 5 min
    vi.setSystemTime(new Date('2026-11-03T10:00:20Z'));
    expect(await fetchQuery(SUMMARY, fetcher)).toBe('v1');
    expect(fetcher).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-11-03T10:00:31Z'));
    expect(getQueryData(SUMMARY)).toBe('v1'); // stale but still showable
    expect(await fetchQuery(SUMMARY, fetcher)).toBe('v2');
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.setSystemTime(new Date('2026-11-03T10:06:00Z'));
    expect(getQueryData(SUMMARY)).toBeUndefined(); // past max age
  });

  it('does not cache errors', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce('ok');
    await expect(fetchQuery(ORG, fetcher)).rejects.toEqual({ status: 500 });
    expect(await fetchQuery(ORG, fetcher)).toBe('ok');
  });
});

describe('invalidation after a mutation', () => {
  it('maps mutations to tags in one place', () => {
    expect(invalidationFor('PATCH', '/api/v1/profile/me').tags).toEqual(expect.arrayContaining(['profile', 'org', 'dashboard']));
    expect(invalidationFor('POST', '/api/v1/company/profile/documents').tags).toEqual(expect.arrayContaining(['profile', 'org', 'dashboard']));
    expect(invalidationFor('PATCH', '/api/v1/notifications/7/read')).toEqual({ tags: ['notifications', 'unread-count'], refetchActive: false });
    expect(invalidationFor('GET', '/api/v1/profile/me')).toBeNull();
  });

  it('profile update → profile + dashboard answers are dropped, notifications kept', async () => {
    await fetchQuery(PROFILE, async () => 'p');
    await fetchQuery(ORG, async () => 'o');
    await fetchQuery(SUMMARY, async () => 's');
    await fetchQuery(NOTIFS, async () => 'n');
    invalidateAfterMutation('PATCH', '/api/v1/profile/me');
    expect(getQueryData(PROFILE)).toBeUndefined();
    expect(getQueryData(ORG)).toBeUndefined();
    expect(getQueryData(SUMMARY)).toBeUndefined();
    expect(getQueryData(NOTIFS)).toBe('n');
  });

  it('mark notification read → notification lists + unread count are dropped', async () => {
    await fetchQuery(NOTIFS, async () => 'n');
    await fetchQuery(COUNT, async () => 3);
    await fetchQuery(PROFILE, async () => 'p');
    invalidateAfterMutation('PATCH', '/api/v1/notifications/7/read');
    expect(getQueryData(NOTIFS)).toBeUndefined();
    expect(getQueryData(COUNT)).toBeUndefined();
    expect(getQueryData(PROFILE)).toBe('p');
  });

  it('an answer on screen stays and is refetched in the background', async () => {
    const { registerFetcher } = await import('../queryCache');
    await fetchQuery(PROFILE, async () => 'old');
    const unsub = subscribe(PROFILE, () => {});
    const fetcher = vi.fn().mockResolvedValue('new');
    const unreg = registerFetcher(PROFILE, fetcher);
    invalidateAfterMutation('PATCH', '/api/v1/profile/me');
    expect(getQueryData(PROFILE)).toBe('old');
    await vi.waitFor(() => expect(getQueryData(PROFILE)).toBe('new'));
    expect(fetcher).toHaveBeenCalledTimes(1);
    unsub();
    unreg();
  });
});

describe('clearing', () => {
  it('clearQueryCache empties everything (logout / 401)', async () => {
    await fetchQuery(PROFILE, async () => 'p');
    setQueryData(NOTIFS, { items: [] });
    expect(cacheSize()).toBe(2);
    clearQueryCache();
    expect(cacheSize()).toBe(0);
  });

  it('a request that started before the clear never writes after it', async () => {
    let resolve;
    const p = fetchQuery(PROFILE, () => new Promise((r) => { resolve = r; }));
    await vi.waitFor(() => expect(resolve).toBeTypeOf('function'));
    clearQueryCache();
    resolve({ name: 'previous user' });
    await p;
    expect(getQueryData(PROFILE)).toBeUndefined();
  });

  it('a different user or organization starts from an empty cache', async () => {
    setCacheScope({ id: 1, organizations: [{ id: 10 }] });
    await fetchQuery(PROFILE, async () => 'p');
    setCacheScope({ id: 1, organizations: [{ id: 10 }] });
    expect(getQueryData(PROFILE)).toBe('p');
    setCacheScope({ id: 1, organizations: [{ id: 11 }] });
    expect(getQueryData(PROFILE)).toBeUndefined();
    await fetchQuery(PROFILE, async () => 'q');
    setCacheScope({ id: 2, organizations: [{ id: 11 }] });
    expect(getQueryData(PROFILE)).toBeUndefined();
  });
});
