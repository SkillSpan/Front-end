// Talent comparison against the LIVE `/api/v1/talent/compare` contract.
//
// The compare screen read `data.candidates`, but the endpoint returns
// `{ students, skills, unavailable }`. `people` was therefore always `[]`, so
// choosing two candidates and opening the comparison showed "pick at least two
// candidates" — with a 200 and full data sitting in the response.
//
// Verified against the real server:
//   POST /api/v1/talent/compare {"student_ids":[68,25]}  -> 200
//   { students: [...], skills: [{ name, category, levels: {"68":2,"25":null}, verified: {...} }], unavailable: [] }
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { clearQueryCache } from '../../../cache/queryCache';
import { compareCandidates } from '../talent/talentApi';
import TalentCompare from '../talent/TalentCompare';

// A trimmed copy of a real response.
const LIVE = {
  data: {
    students: [
      {
        id: 68,
        name: 'asda',
        career_role: null,
        specialization: 'AI Automation',
        university_name: 'Afghan University',
        readiness: { score: 29.35, band: null },
        completeness_percent: 71,
        contactable: true,
        skills: [
          { name: 'Cloud Computing Fundamentals', category: 'Cloud', level: 3.5, max_level: 5, verified: false, evidence_count: 0 },
          { name: 'REST APIs', category: 'Web Development', level: 3, max_level: 5, verified: false, evidence_count: 0 },
        ],
      },
      {
        id: 25,
        name: 'New User',
        career_role: null,
        specialization: '1',
        university_name: 'palesine',
        readiness: { score: null, band: null },
        completeness_percent: 71,
        contactable: true,
        skills: [{ name: 'JavaScript', category: null, level: 5, max_level: 5, verified: false, evidence_count: 0 }],
      },
    ],
    skills: [
      { name: 'Cloud Computing Fundamentals', category: 'Cloud', levels: { 68: 3.5, 25: null }, verified: { 68: false, 25: false } },
      { name: 'JavaScript', category: null, levels: { 25: 5, 68: null }, verified: { 25: false, 68: false } },
      { name: 'REST APIs', category: 'Web Development', levels: { 68: 3, 25: null }, verified: { 68: false, 25: false } },
    ],
    unavailable: [],
  },
};

beforeEach(() => {
  api.companyRequest.mockReset();
  clearQueryCache();
  window.localStorage.clear();
});

describe('compareCandidates — live response shape', () => {
  it('reads `students`, not the never-sent `candidates`', async () => {
    api.companyRequest.mockResolvedValue(LIVE);

    const r = await compareCandidates([68, 25]);

    expect(r.candidates.map((c) => c.name)).toEqual(['asda', 'New User']);
    expect(r.candidates.map((c) => c.id)).toEqual([68, 25]);
  });

  it('joins each student to their own levels from the skills matrix', async () => {
    api.companyRequest.mockResolvedValue(LIVE);

    const r = await compareCandidates([68, 25]);
    const [asda, newUser] = r.candidates;

    expect(asda.skills.map((s) => [s.name, s.level])).toEqual([
      ['Cloud Computing Fundamentals', 3.5],
      ['REST APIs', 3],
    ]);
    // A skill the student does not have must NOT appear as a zero.
    expect(newUser.skills.map((s) => s.name)).toEqual(['JavaScript']);
    expect(newUser.skills[0].level).toBe(5);
  });

  it('keeps readiness, including a candidate with no snapshot', async () => {
    api.companyRequest.mockResolvedValue(LIVE);

    const r = await compareCandidates([68, 25]);

    expect(r.candidates[0].readiness).toEqual({ score: 29.35, band: null });
    expect(r.candidates[1].readiness).toEqual({ score: null, band: null });
  });

  it('reports candidates the caller may not see via `unavailable`', async () => {
    api.companyRequest.mockResolvedValue({ data: { students: LIVE.data.students, skills: LIVE.data.skills, unavailable: [90] } });

    const r = await compareCandidates([68, 25, 90]);

    expect(r.removedCount).toBe(1);
    expect(r.candidates).toHaveLength(2);
  });

  it('still accepts the legacy `candidates` shape', async () => {
    api.companyRequest.mockResolvedValue({ data: { candidates: [{ id: 1, name: 'A' }], removed_count: 2 } });

    const r = await compareCandidates([1, 2]);

    expect(r.candidates.map((c) => c.name)).toEqual(['A']);
    expect(r.removedCount).toBe(2);
  });
});

describe('TalentCompare page — live payload', () => {
  const mount = () =>
    render(
      <PreferencesProvider>
        <MemoryRouter initialEntries={['/company/talent/compare?ids=68,25']}>
          <Routes>
            <Route path="/company/talent/compare" element={<TalentCompare />} />
          </Routes>
        </MemoryRouter>
      </PreferencesProvider>,
    );

  it('renders both candidates instead of the "pick two" empty state', async () => {
    api.companyRequest.mockResolvedValue(LIVE);

    mount();

    expect(await screen.findByText('asda')).toBeInTheDocument();
    expect(screen.getByText('New User')).toBeInTheDocument();
  });

  it('shows the skill levels side by side', async () => {
    api.companyRequest.mockResolvedValue(LIVE);

    mount();

    await screen.findByText('asda');
    expect(screen.getAllByText('Cloud Computing Fundamentals').length).toBeGreaterThan(0);
    expect(screen.getAllByText('JavaScript').length).toBeGreaterThan(0);
  });
});

/*
 * A shortlist row carries TWO ids: the list item's (`id`) and the student it
 * points at (`student_id`). The normaliser took `id`, so "view" on a saved
 * candidate linked to /company/talent/4 — the list item — and the API answered
 * 404 "No discoverable student with that id."
 *
 * Verified live: GET /api/v1/talent/lists/4 -> candidates [{id:4, student_id:68},
 * {id:5, student_id:25}], and GET /api/v1/talent/4 -> 404.
 */
describe('shortlist rows use the STUDENT id, not the list-item id', () => {
  it('maps student_id to the row id', async () => {
    const { normalizeCandidateRow } = await import('../talent/talentApi');

    const row = normalizeCandidateRow({ id: 4, student_id: 68, name: 'asda' });

    expect(row.id).toBe(68);
  });

  it('leaves a search row alone (no student_id present)', async () => {
    const { normalizeCandidateRow } = await import('../talent/talentApi');

    expect(normalizeCandidateRow({ id: 68, name: 'asda' }).id).toBe(68);
  });

  it('a list detail page links to the student profile', async () => {
    api.companyRequest.mockResolvedValue({
      data: { id: 4, name: 'Test shortlist', candidates_count: 2, candidates: [{ id: 4, student_id: 68, name: 'asda' }] },
    });
    const { getList } = await import('../talent/talentApi');

    const list = await getList(4);

    expect(list.candidates.map((c) => c.id)).toEqual([68]);
  });
});
