import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
  getProfile: vi.fn(),
  getSpecializations: vi.fn(),
  getCareerRoles: vi.fn(),
  unwrapApiData: (payload) => payload?.data ?? payload,
}));

import { getCareerRoles, getProfile, getSpecializations } from '../api';
import { filterTaxonomyByRoles, loadSpecializationRoles } from '../components/skillmatrix/specializationFilter';

const TAXONOMY = [
  { key: 'web', label: 'Web', skills: [
    { id: 1, name: 'React', roleIds: ['10'] },
    { id: 2, name: 'CSS', roleIds: ['10', '11'] },
  ] },
  { key: 'data', label: 'Data', skills: [
    { id: 3, name: 'SQL', roleIds: ['20'] },
    { id: 4, name: 'Pandas', roleIds: [] },
  ] },
];

describe('filterTaxonomyByRoles', () => {
  it('keeps only the skills linked to the roles and drops empty categories', () => {
    const out = filterTaxonomyByRoles(TAXONOMY, { roleIds: new Set(['10']) });
    expect(out).toHaveLength(1);
    expect(out[0].skills.map((s) => s.name)).toEqual(['React', 'CSS']);
  });

  it('always keeps skills the learner already has', () => {
    const out = filterTaxonomyByRoles(TAXONOMY, { roleIds: new Set(['10']) }, { 4: { level: 2 } });
    expect(out.map((c) => c.key)).toEqual(['web', 'data']);
    expect(out[1].skills.map((s) => s.name)).toEqual(['Pandas']);
  });

  it('returns the full taxonomy without a filter or when nothing would match', () => {
    expect(filterTaxonomyByRoles(TAXONOMY, null)).toBe(TAXONOMY);
    expect(filterTaxonomyByRoles(TAXONOMY, { roleIds: new Set(['99']) })).toBe(TAXONOMY);
  });
});

describe('loadSpecializationRoles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves the profile specialization name to its career role ids', async () => {
    getProfile.mockResolvedValue({ data: { specialization: 'software engineering' } });
    getSpecializations.mockResolvedValue({ data: [{ id: 7, name: 'Software Engineering' }] });
    getCareerRoles.mockResolvedValue({ data: { data: [{ id: 10 }, { id: 11 }] } });

    const out = await loadSpecializationRoles();
    expect(getCareerRoles).toHaveBeenCalledWith({ perPage: 100, specializationId: 7 });
    expect(out.specialization).toBe('Software Engineering');
    expect([...out.roleIds]).toEqual(['10', '11']);
  });

  it('returns null when the learner has no specialization', async () => {
    getProfile.mockResolvedValue({ data: { specialization: null } });
    expect(await loadSpecializationRoles()).toBeNull();
    expect(getSpecializations).not.toHaveBeenCalled();
  });
});
