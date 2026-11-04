import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Global 401 handling in api.js request(): a stale or expired token clears the
// session once and sends the user to login with a returnTo.

function clearCookies() {
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim();
    if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
  });
}

function respond(status, body = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

async function loadApi() {
  const api = await import('../api');
  const redirect = vi.fn();
  api.setSessionExpiredRedirect(redirect);
  return { api, redirect };
}

describe('api.js 401 handling', () => {
  beforeEach(() => {
    clearCookies();
    vi.resetModules();
    window.history.replaceState({}, '', '/skill-matrix?tab=assessment');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState({}, '', '/');
  });

  it('clears the session and redirects to the session-expired screen with returnTo on a 401 from an authenticated request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, { message: 'Unauthenticated.' })));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'stale-token', user: { id: 7, name: 'Rawan' } });
    const listener = vi.fn();
    api.onSessionExpired(listener);

    await expect(api.getSkillsMatrix()).rejects.toMatchObject({ status: 401 });

    expect(api.isAuthenticated()).toBe(false);
    expect(api.getStoredUser()).toBeNull();
    expect(redirect).toHaveBeenCalledTimes(1);
    const url = new URL(redirect.mock.calls[0][0], 'http://localhost');
    expect(url.pathname).toBe('/session-expired');
    expect(url.searchParams.get('returnTo')).toBe('/skill-matrix?tab=assessment');
    expect(listener).toHaveBeenCalledTimes(1);

    const login = new URL(api.expiredLoginUrl(url.searchParams.get('returnTo')), 'http://localhost');
    expect(login.pathname).toBe('/login');
    expect(login.searchParams.get('returnTo')).toBe('/skill-matrix?tab=assessment');
    expect(login.searchParams.get(api.SESSION_EXPIRED_PARAM)).toBe('1');
  });

  it('redirects only once when several requests fail with 401 at the same time', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, { message: 'Unauthenticated.' })));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'stale-token', user: { id: 7 } });

    const results = await Promise.allSettled([
      api.getSkillsMatrix(),
      api.getSkillsTaxonomy(),
      api.getMyEvidence(),
      api.getProfile(),
    ]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('does not treat a 401 from login as an expired session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, { message: 'Invalid credentials' })));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'good-token', user: { id: 7 } });

    await expect(api.loginUser('a@b.co', 'wrong')).rejects.toMatchObject({ status: 401, message: 'Invalid credentials' });

    expect(api.isAuthenticated()).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('excludes the register, OTP and password-reset endpoints', async () => {
    const { isPublicAuthEndpoint } = await import('../api');
    ['/api/v1/auth/register', '/api/v1/auth/login/google', '/api/v1/auth/verify', '/api/v1/auth/resend-otp', '/api/v1/auth/forgot-password/verify', '/api/v1/auth/reset-password', '/api/v1/auth/register/organization'].forEach((path) => {
      expect(isPublicAuthEndpoint(path)).toBe(true);
    });
    ['/api/v1/profile', '/api/v1/skills/matrix', '/api/v1/evidence'].forEach((path) => {
      expect(isPublicAuthEndpoint(path)).toBe(false);
    });
  });

  it('ignores a late 401 for an old token after the user has logged in again', async () => {
    let resolveFetch;
    vi.stubGlobal('fetch', vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; })));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'old-token', user: { id: 7 } });

    const pending = api.getSkillsMatrix();
    api.saveSession({ token: 'new-token', user: { id: 7 } });
    resolveFetch(respond(401, { message: 'Unauthenticated.' }));

    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(api.getToken()).toBe('new-token');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('clears the session but does not redirect while already on the login page', async () => {
    window.history.replaceState({}, '', '/login');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, {})));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'stale-token', user: { id: 7 } });

    await expect(api.getProfile()).rejects.toMatchObject({ status: 401 });

    expect(api.isAuthenticated()).toBe(false);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('sends company pages back to the company login after the expired screen', async () => {
    window.history.replaceState({}, '', '/company/talent');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respond(401, {})));
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'stale-token', user: { id: 7 } });

    await expect(api.getTalentDiscovery()).rejects.toMatchObject({ status: 401 });

    const url = new URL(redirect.mock.calls[0][0], 'http://localhost');
    expect(url.pathname).toBe('/session-expired');
    const login = new URL(api.expiredLoginUrl(url.searchParams.get('returnTo')), 'http://localhost');
    expect(login.pathname).toBe('/company/login');
    expect(login.searchParams.get('returnTo')).toBe('/company/talent');
  });

  it('does not end the session on other errors such as 403 or 500', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(respond(403, {})).mockResolvedValueOnce(respond(500, {}));
    vi.stubGlobal('fetch', fetchMock);
    const { api, redirect } = await loadApi();
    api.saveSession({ token: 'good-token', user: { id: 7 } });

    await expect(api.getMentorStudents()).rejects.toMatchObject({ status: 403 });
    await expect(api.getSkillsMatrix()).rejects.toMatchObject({ status: 500 });

    expect(api.isAuthenticated()).toBe(true);
    expect(redirect).not.toHaveBeenCalled();
  });

  it('only accepts same-app paths as returnTo', async () => {
    const { safeReturnTo } = await import('../api');
    expect(safeReturnTo('/projects?id=3')).toBe('/projects?id=3');
    expect(safeReturnTo('//evil.example.com')).toBeNull();
    expect(safeReturnTo('https://evil.example.com')).toBeNull();
    expect(safeReturnTo('/login')).toBeNull();
    expect(safeReturnTo('/session-expired')).toBeNull();
    expect(safeReturnTo(null)).toBeNull();
  });
});
