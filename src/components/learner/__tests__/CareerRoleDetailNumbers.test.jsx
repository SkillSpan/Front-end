import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/*
 * A role detail page opened with every number at zero: 0/100 readiness,
 * "Skills Met 0/0", "Critical 0/0", 0%.
 *
 * The cause was that `/career-roles/{id}/skills` was never called
 * (`getCareerRoleSkills` was defined in api.js and unused), so
 * `skillRequirements` was always empty and every count derived from it was
 * 0/0. The list payload has no requirement rows at all.
 *
 * These tests pin the join: requirements come from the role, the learner's own
 * levels come from /skills/matrix keyed on skill_id, and the panel reports real
 * percentages instead of a wall of zeroes.
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

const ROLE = { id: 146, title: 'Digital Solutions Specialist' };

// What GET /career-roles/146/skills actually returns.
const ROLE_SKILLS = {
  data: {
    career_role: { id: 146, title: 'Digital Solutions Specialist' },
    skills: [
      { skill_id: 10, skill_name: 'REST APIs', required_level: 2.5, importance_weight: 0.6, is_critical: false, prerequisites: [] },
      { skill_id: 164, skill_name: 'Digital Transformation', required_level: 3, importance_weight: 0.9, is_critical: true, prerequisites: [] },
    ],
  },
};

// GET /skills/matrix — rows nest the skill under `skill`.
const MATRIX = {
  data: [
    { skill_id: 10, skill: { id: 10, name: 'REST APIs' }, level: '3.00' },
    { skill_id: 164, skill: { id: 164, name: 'Digital Transformation' }, level: '1.00' },
  ],
};

describe('learner career roles — role detail numbers', () => {
  beforeEach(() => {
    getCareerRoleSkills.mockReset().mockResolvedValue(ROLE_SKILLS);
    getSkillsMatrix.mockReset().mockResolvedValue(MATRIX);
  });

  const openDetail = async () => {
    render(<CareerRolesView initialRoles={[ROLE]} />);
    fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));
    await waitFor(() => expect(screen.getByText('REST APIs')).toBeInTheDocument());
  };

  it('loads the requirements instead of showing an empty table', async () => {
    await openDetail();

    expect(getCareerRoleSkills).toHaveBeenCalledWith(146);
    expect(screen.getByText('REST APIs')).toBeInTheDocument();
    expect(screen.getByText('Digital Transformation')).toBeInTheDocument();
    expect(screen.queryByTestId('requirements-unavailable')).not.toBeInTheDocument();
  });

  it('reports how many skills are actually met, not 0/0', async () => {
    await openDetail();

    // Level 3.00 >= 2.5 met, level 1.00 < 3 not met.
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('/0')).not.toBeInTheDocument();
    expect(screen.getByText('/2')).toBeInTheDocument();
  });

  it('shows a readiness percentage derived from the join', async () => {
    await openDetail();

    // (0.6*1 + 0.9*(1/3)) / (0.6+0.9) = 0.9/1.5 = 60%
    await waitFor(() => expect(screen.getByTestId('role-readiness')).toHaveTextContent('60'));
    expect(screen.getAllByText('60%').length).toBeGreaterThan(0);
  });

  it('does not report a misleading 0 when the role has no requirements', async () => {
    getCareerRoleSkills.mockResolvedValue({ data: { skills: [] } });

    render(<CareerRolesView initialRoles={[ROLE]} />);
    fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));

    await waitFor(() => expect(screen.getByTestId('requirements-unavailable')).toBeInTheDocument());
    // Nothing to measure against = no score, not "0/100".
    expect(screen.getByTestId('role-readiness')).toHaveTextContent('—');
  });

  it('counts a learner with no matrix row for a skill as level 0, not a crash', async () => {
    getSkillsMatrix.mockResolvedValue({ data: [] });

    render(<CareerRolesView initialRoles={[ROLE]} />);
    fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));

    await waitFor(() => expect(screen.getByText('REST APIs')).toBeInTheDocument());
    expect(screen.getByTestId('role-readiness')).toHaveTextContent('0');
  });

  it('still shows the requirements when the matrix call fails', async () => {
    getSkillsMatrix.mockRejectedValue({ status: 500 });

    render(<CareerRolesView initialRoles={[ROLE]} />);
    fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));

    await waitFor(() => expect(screen.getByText('REST APIs')).toBeInTheDocument());
    expect(screen.queryByTestId('requirements-unavailable')).not.toBeInTheDocument();
  });

  it('does not let a duplicated skill row overwrite the real level', async () => {
    // The backend used to return every learner's rows to an admin, so the same
    // skill arrived several times at different levels.
    getSkillsMatrix.mockResolvedValue({
      data: [
        { skill: { id: 10 }, level: '1.00' },
        { skill: { id: 10 }, level: '5.00' },
        { skill: { id: 164 }, level: '0.00' },
      ],
    });

    await openDetail();

    // Highest wins, deterministically: REST APIs = 5 (met), Digital
    // Transformation = 0 (not met). (0.6*1 + 0.9*0) / 1.5 = 40%.
    expect(screen.getByTestId('role-readiness')).toHaveTextContent('40');
  });
});
