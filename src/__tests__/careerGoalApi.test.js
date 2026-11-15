import { afterEach, expect, it, vi } from 'vitest';
import { getLatestIntelligence, getLatestReadiness, updateProfile } from '../api';

afterEach(() => vi.unstubAllGlobals());

it('persists only the primary goal field and scopes both latest queries to its id', async () => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: {} }) });
  vi.stubGlobal('fetch', fetchMock);
  await updateProfile({ primary_career_role_id: 99 });
  await getLatestReadiness({ careerRoleId: 99 });
  await getLatestIntelligence({ careerRoleId: 99 });
  const calls = fetchMock.mock.calls;
  expect(calls[0][0]).toMatch(/\/api\/v1\/profile$/);
  expect(calls[0][1].method).toBe('PUT');
  expect(JSON.parse(calls[0][1].body)).toEqual({ primary_career_role_id: 99 });
  expect(calls[1][0]).toMatch(/readiness\/latest\?career_role_id=99$/);
  expect(calls[2][0]).toMatch(/intelligence\/latest\?career_role_id=99$/);
});
