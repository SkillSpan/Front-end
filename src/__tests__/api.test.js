import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// api.js reads document.cookie via utils/cookies.js, which needs a DOM -
// vitest.config.js runs tests under the jsdom environment for that reason.

describe('api.js', () => {
  beforeEach(() => {
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (name) document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is not authenticated when there is no session cookie', async () => {
    const { isAuthenticated, getStoredUser } = await import('../api');
    expect(isAuthenticated()).toBe(false);
    expect(getStoredUser()).toBeNull();
  });

  it('saveSession persists the token and user, and isAuthenticated reflects it', async () => {
    const { saveSession, isAuthenticated, getStoredUser, clearSession } = await import('../api');

    saveSession({
      token: 'abc123',
      user: { id: 1, name: 'Alex' },
      organizations: [],
    });

    expect(isAuthenticated()).toBe(true);
    expect(getStoredUser()).toEqual({ id: 1, name: 'Alex', organizations: [] });

    clearSession();
    expect(isAuthenticated()).toBe(false);
    expect(getStoredUser()).toBeNull();
  });

  it('surfaces Laravel 422 validation errors (status, message, errors) on failed requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          message: 'The given data was invalid.',
          errors: { email: ['The email has already been taken.'] },
        }),
      })
    );

    const { registerUser } = await import('../api');

    await expect(registerUser({ email: 'taken@example.com' })).rejects.toMatchObject({
      status: 422,
      message: 'The given data was invalid.',
      errors: { email: ['The email has already been taken.'] },
    });
  });

  it('surfaces a network error distinctly from a validation error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    const { loginUser } = await import('../api');

    await expect(loginUser('a@b.com', 'pw')).rejects.toMatchObject({
      status: 0,
    });
  });

  it('sends registerOrganization requests as multipart/form-data (no JSON Content-Type)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { registerOrganization } = await import('../api');
    const fd = new FormData();
    fd.append('organization_name', 'Acme');

    await registerOrganization(fd);

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBe(fd);
  });

  it('loginWithGoogle posts credential + terms/privacy flags to /api/auth/login/google', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: { token: 't', user: { id: 1 } } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { loginWithGoogle, API_BASE_URL } = await import('../api');
    await loginWithGoogle('the-id-token', true, true);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/auth/login/google`);
    expect(JSON.parse(options.body)).toEqual({
      credential: 'the-id-token',
      terms_accepted: true,
      privacy_accepted: true,
    });
  });

  it('loginWithGoogle defaults terms/privacy to false when omitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { loginWithGoogle } = await import('../api');
    await loginWithGoogle('the-id-token');

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      credential: 'the-id-token',
      terms_accepted: false,
      privacy_accepted: false,
    });
  });

  it('loginOrganizationWithGoogle posts only the credential (login-only, no org creation)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: {} }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { loginOrganizationWithGoogle, API_BASE_URL } = await import('../api');
    await loginOrganizationWithGoogle('org-id-token');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/auth/login/organization/google`);
    expect(JSON.parse(options.body)).toEqual({ credential: 'org-id-token' });
  });

  it('loginWithGoogle merges extra fields (e.g. academic_status) when finalizing a redirected sign-up', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ data: { token: 't' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const { loginWithGoogle } = await import('../api');
    await loginWithGoogle('the-id-token', true, true, { academic_status: 'student' });

    const [, options] = fetchMock.mock.calls[0];
    expect(JSON.parse(options.body)).toEqual({
      credential: 'the-id-token',
      terms_accepted: true,
      privacy_accepted: true,
      academic_status: 'student',
    });
  });
});
