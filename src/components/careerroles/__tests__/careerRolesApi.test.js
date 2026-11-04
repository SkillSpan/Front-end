import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../api', () => ({
  getCareerRoles: vi.fn(),
  getCareerRoleById: vi.fn(),
  getCareerRoleSkills: vi.fn(),
  getSkillsMatrix: vi.fn(),
  getStoredUser: vi.fn(),
  resolveLearnerId: (user) => user?.id ?? null,
}));

import { getCareerRoles, getCareerRoleSkills, getSkillsMatrix, getStoredUser } from '../../../api';
import { fetchCareerRoleList, fetchCareerRoleSkills, fetchMySkillLevels } from '../careerRolesApi';

// Shapes copied from CareerRoleController@index / @skills and
// SkillsController@matrix on the deployed backend.
const skillsResponse = {
  success: true,
  message: 'Career role decision snapshot prepared successfully.',
  data: {
    career_role: { id: 3, title: 'Frontend Developer', version: 1, effective_date: '2026-01-01', status: 'approved' },
    skills: [
      {
        skill_id: 11,
        skill_name: 'React',
        slug: 'react',
        required_level: 4,
        importance_weight: 0.9,
        is_critical: true,
        prerequisites: [{ skill_id: 10, slug: 'javascript', name: 'JavaScript' }],
      },
      {
        skill_id: 12,
        skill_name: 'CSS',
        slug: 'css',
        required_level: 3,
        importance_weight: 0.5,
        is_critical: false,
        prerequisites: [],
      },
    ],
    statistics: { total_skills: 2, critical_skills_count: 1, average_importance_weight: 0.7 },
    snapshot: { is_valid: true, generated_at: '2026-10-27T10:00:00+00:00' },
  },
};

describe('careerRolesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads the role skills out of the decision snapshot', async () => {
    getCareerRoleSkills.mockResolvedValue(skillsResponse);

    const skills = await fetchCareerRoleSkills(3);

    expect(skills).toHaveLength(2);
    expect(skills[0]).toMatchObject({
      skillId: 11,
      name: 'React',
      required: 4,
      weight: 90,
      critical: true,
      prerequisites: ['JavaScript'],
    });
    expect(skills[1]).toMatchObject({ skillId: 12, name: 'CSS', weight: 50, critical: false });
  });

  it('reads career roles from the paginator rows', async () => {
    getCareerRoles.mockResolvedValue({
      success: true,
      data: {
        current_page: 1,
        data: [{ id: 3, title: 'Frontend Developer', version: 2, status: 'approved', effective_date: '2026-01-01', skills_count: 2 }],
        total: 1,
      },
    });

    const roles = await fetchCareerRoleList();

    expect(roles).toEqual([
      expect.objectContaining({ id: 3, title: 'Frontend Developer', version: 'v2', status: 'approved' }),
    ]);
  });

  it('maps the learner skill levels whatever type the learner id comes back as', async () => {
    getStoredUser.mockReturnValue({ id: 7 });
    getSkillsMatrix.mockResolvedValue({
      success: true,
      data: [
        { learner_id: '7', skill_id: 11, level: '3.50' },
        { learner_id: 7, skill_id: 12, level: 2 },
        { learner_id: 8, skill_id: 13, level: 5 },
      ],
    });

    expect(await fetchMySkillLevels()).toEqual({ 11: 3.5, 12: 2 });
  });

  it('skips the matrix request when nobody is signed in', async () => {
    getStoredUser.mockReturnValue(null);

    expect(await fetchMySkillLevels()).toEqual({});
    expect(getSkillsMatrix).not.toHaveBeenCalled();
  });
});
