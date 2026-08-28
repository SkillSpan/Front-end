import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Session expiry / logout wiring', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
    vi.resetModules();
    vi.unstubAllGlobals();
  });

  it('clearSessionAndRevoke hits /api/v1/auth/logout, drops the local session, and notifies subscribers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const api = await import('../api');
    api.saveSession({ token: 'tk', user: { id: 1, name: 'Alex' }, organizations: [] });
    expect(api.isAuthenticated()).toBe(true);

    const listener = vi.fn();
    const unsubscribe = api.onSessionExpired(listener);

    await api.clearSessionAndRevoke();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/auth\/logout$/);
    expect(options.method).toBe('POST');
    expect(api.isAuthenticated()).toBe(false);
    expect(api.getStoredUser()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('clearSessionAndRevoke still drops the local session if the backend call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    const api = await import('../api');
    api.saveSession({ token: 'tk', user: { id: 1 }, organizations: [] });

    const listener = vi.fn();
    api.onSessionExpired(listener);

    await api.clearSessionAndRevoke();

    expect(api.isAuthenticated()).toBe(false);
    expect(api.getStoredUser()).toBeNull();
    expect(listener).toHaveBeenCalled();
  });

  it('401 from /api/v1/auth/logout fires session-expired and clears the local session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthenticated.' }),
      })
    );

    const api = await import('../api');
    api.saveSession({ token: 'tk', user: { id: 1 }, organizations: [] });

    const listener = vi.fn();
    api.onSessionExpired(listener);

    await expect(api.logoutUser()).rejects.toMatchObject({ status: 401 });

    expect(api.isAuthenticated()).toBe(false);
    expect(listener).toHaveBeenCalled();
  });
});
