import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// api.js + the frontend API cache together: GET reuse, mutation invalidation,
// and clearing on 401 / logout / user change.

const ok = (body) => ({ ok: true, status: 200, json: async () => body });

async function load() {
  const api = await import('../api');
  const cache = await import('../cache/queryCache');
  return { api, cache };
}

describe('api.js + cache', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
    vi.resetModules();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reuses a fresh GET and dedupes identical calls in flight', async () => {
    const fetch = vi.fn().mockResolvedValue(ok({ data: [{ id: 1 }] }));
    vi.stubGlobal('fetch', fetch);
    const { api } = await load();
    const [a, b] = await Promise.all([api.getProjects(), api.getProjects()]);
    const c = await api.getProjects();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(a).toEqual(c);
    // every caller gets its own copy, so editing one cannot change the cache
    a.data[0].id = 99;
    expect(b.data[0].id).toBe(1);
    expect((await api.getProjects()).data[0].id).toBe(1);
  });

  it('a successful mutation clears related GETs (apply → projects refetched)', async () => {
    const fetch = vi.fn().mockResolvedValue(ok({ data: [] }));
    vi.stubGlobal('fetch', fetch);
    const { api } = await load();
    await api.getProjects();
    await api.applyToProject(5, {});
    await api.getProjects();
    const gets = fetch.mock.calls.filter(([url, init]) => url.endsWith('/api/v1/projects') && init.method === 'GET');
    expect(gets).toHaveLength(2);
  });

  it('a failed mutation clears nothing', async () => {
    const { api, cache } = await load();
    const key = cache.apiKey('/api/v1/profile/me');
    await cache.fetchQuery(key, async () => 'profile');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 422, json: async () => ({ errors: { website: ['bad'] } }) }));
    await expect(api.updateCompanyProfile({ website: 'x' })).rejects.toMatchObject({ status: 422 });
    expect(cache.getQueryData(key)).toBe('profile');
  });

  it('PATCH /profile/me clears profile + dashboard answers', async () => {
    const { api, cache } = await load();
    const profile = cache.apiKey('/api/v1/profile/me');
    const summary = cache.apiKey('/api/v1/company/dashboard');
    await cache.fetchQuery(profile, async () => 'p');
    await cache.fetchQuery(summary, async () => 's');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: {} })));
    await api.updateCompanyProfile({ website: 'https://nova.example' });
    expect(cache.getQueryData(profile)).toBeUndefined();
    expect(cache.getQueryData(summary)).toBeUndefined();
  });

  it('a 401 (session expired) empties the cache', async () => {
    const { api, cache } = await load();
    api.saveSession({ token: 't', user: { id: 1 } });
    const key = cache.apiKey('/api/v1/organization/profile');
    await cache.fetchQuery(key, async () => 'org');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({}) }));
    await expect(api.getCompanyProfile()).rejects.toMatchObject({ status: 401 });
    expect(cache.getQueryData(key)).toBeUndefined();
    expect(cache.cacheSize()).toBe(0);
  });

  it('logout empties the cache', async () => {
    const { api, cache } = await load();
    api.saveSession({ token: 't', user: { id: 1 } });
    await cache.fetchQuery(cache.apiKey('/api/v1/profile/me'), async () => 'p');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({})));
    await api.clearSessionAndRevoke();
    expect(cache.cacheSize()).toBe(0);
  });

  it('signing in as another user empties the cache', async () => {
    const { api, cache } = await load();
    api.saveSession({ token: 't', user: { id: 1 }, organizations: [{ id: 10 }] });
    await cache.fetchQuery(cache.apiKey('/api/v1/profile/me'), async () => 'p');
    api.saveSession({ token: 't2', user: { id: 2 }, organizations: [{ id: 20 }] });
    expect(cache.cacheSize()).toBe(0);
  });

  it('never caches auth endpoints', async () => {
    const fetch = vi.fn().mockResolvedValue(ok({ data: { token: 'x' } }));
    vi.stubGlobal('fetch', fetch);
    const { api, cache } = await load();
    await api.loginUser('a@b.co', 'pw').catch(() => {});
    expect(cache.cacheSize()).toBe(0);
  });
});
