import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

/*
 * The role LIST showed 0% / "0 skills required" / "0/0 critical" for every
 * card, while opening the very same role showed 3/5 and 83%.
 *
 * The card read `role.readinessScore` and `role.skillRequirements`, and
 * `GET /career-roles` sends NEITHER — it returns only `id`, `title`, `version`.
 * The numbers were never missing on the server; the grid simply never asked
 * for them. So every card fell back to 0 and said "No requirements".
 *
 * These tests pin the fix: the grid fetches requirements + the learner's
 * matrix for the visible page, and each card scores itself with the SAME
 * function the detail panel uses.
 */
const getCareerRoleSkills = vi.fn();
const getSkillsMatrix = vi.fn();

vi.mock('../../../api', () => ({
  getCareerRoleSkills: (...a) => getCareerRoleSkills(...a),
  getSkillsMatrix: (...a) => getSkillsMatrix(...a),
  getCareerRoles: vi.fn(),
  unwrapApiData: (payload) => payload?.data ?? payload,
}));

import CareerRolesView from '../CareerRolesView.jsx';

// Exactly what GET /career-roles sends per row: no `demand`, no
// `skillRequirements`, no `readinessScore` — only `skills_count`.
const ROLES = [
  { id: 146, title: 'Digital Solutions Specialist', version: 1, skills_count: 2 },
  { id: 147, title: 'Automation Specialist', version: 1, skills_count: 0 },
];

const SKILLS_146 = {
  data: {
    skills: [
      { skill_id: 10, skill_name: 'REST APIs', required_level: 2.5, importance_weight: 0.6, is_critical: false },
      { skill_id: 164, skill_name: 'Digital Transformation', required_level: 3, importance_weight: 0.9, is_critical: true },
    ],
  },
};

// Nothing published for 147 — it must show "—", never a fake 0%.
const SKILLS_147 = { data: { skills: [] } };

const MATRIX = {
  data: [
    { skill: { id: 10 }, level: '3.00' },
    { skill: { id: 164 }, level: '1.50' },
  ],
};

const byRole = (id) =>
  getCareerRoleSkills.mockImplementation(async (roleId) =>
    Number(roleId) === 146 ? SKILLS_146 : SKILLS_147,
  );

describe('learner career roles — list card numbers', () => {
  beforeEach(() => {
    getCareerRoleSkills.mockReset();
    getSkillsMatrix.mockReset().mockResolvedValue(MATRIX);
    byRole(146);
  });

  it('shows the real readiness on the card, not 0%', async () => {
    render(<CareerRolesView initialRoles={ROLES} />);

    // (0.6*1 + 0.9*0.5) / 1.5 = 1.05/1.5 = 70%
    await waitFor(() =>
      expect(screen.getAllByTestId('card-readiness')[0]).toHaveTextContent('70%'),
    );
  });

  it('shows the real requirement count instead of 0', async () => {
    render(<CareerRolesView initialRoles={ROLES} />);

    await waitFor(() => expect(getCareerRoleSkills).toHaveBeenCalledTimes(2));
    // Card 1: two requirements loaded → "2", not the payload's bare 0.
    const counts = screen.getAllByTestId('card-skill-count');
    expect(counts[0]).toHaveTextContent('2');
    expect(counts[1]).toHaveTextContent('—');
  });

  it('counts the critical skills that are not met yet', async () => {
    render(<CareerRolesView initialRoles={ROLES} />);

    await waitFor(() => expect(screen.getByText('0/1')).toBeInTheDocument());
  });

  it('does not invent a percentage for a role with no published requirements', async () => {
    render(<CareerRolesView initialRoles={ROLES} />);

    await waitFor(() => expect(getCareerRoleSkills).toHaveBeenCalledWith(147));
    // The second card has nothing to measure against.
    await waitFor(() =>
      expect(screen.getAllByTestId('card-readiness')[1]).toHaveTextContent('—'),
    );
  });

  it('fetches the learner matrix once for the whole page, not once per card', async () => {
    render(<CareerRolesView initialRoles={ROLES} />);

    await waitFor(() => expect(getCareerRoleSkills).toHaveBeenCalledTimes(2));
    expect(getSkillsMatrix).toHaveBeenCalledTimes(1);
  });

  it('a failed requirements call leaves "—", never a fake 0%', async () => {
    getCareerRoleSkills.mockRejectedValue({ status: 500 });

    render(<CareerRolesView initialRoles={ROLES} />);

    await waitFor(() => expect(getCareerRoleSkills).toHaveBeenCalled());
    for (const badge of screen.getAllByTestId('card-readiness')) {
      expect(badge).toHaveTextContent('—');
    }
  });
});
