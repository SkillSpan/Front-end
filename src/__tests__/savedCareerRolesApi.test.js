import { afterEach, expect, it, vi } from 'vitest';
import { getSavedCareerRoles, saveSession, clearSession, setCareerRoleSaved } from '../api';

afterEach(() => { clearSession(); vi.unstubAllGlobals(); });

it('uses authenticated GET/PUT/DELETE requests for persistent bookmarks', async () => {
  saveSession({ token: 'bookmark-test-token', user: { id: 1 } });
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true, status: 200, json: async () => ({ success: true, data: [] }),
  });
  vi.stubGlobal('fetch', fetchMock);
  await getSavedCareerRoles();
  await setCareerRoleSaved(99, true);
  await setCareerRoleSaved(99, false);
  await getSavedCareerRoles();
  expect(fetchMock).toHaveBeenCalledTimes(4);
  const calls = fetchMock.mock.calls;
  expect(calls[0][0]).toMatch(/\/api\/v1\/saved-career-roles$/);
  expect(calls[1][0]).toMatch(/\/api\/v1\/saved-career-roles\/99$/);
  expect(calls.map(([, options]) => options.method)).toEqual(['GET', 'PUT', 'DELETE', 'GET']);
  for (const [, options] of calls) {
    expect(options.headers.Authorization).toBe('Bearer bookmark-test-token');
  }
});
