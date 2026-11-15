import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/*
 * POST /projects/{id}/match is the only source of a score and an eligibility
 * state — the list endpoint sends neither. The screen used to fire that call
 * and drop the answer, so every card stayed on "Not evaluated" and the header
 * read "0 eligible" no matter what the learner did.
 */
const matchProject = vi.fn();

vi.mock('../../../api', () => ({
  applyToProject: vi.fn(),
  matchProject: (...args) => matchProject(...args),
  unwrapApiData: (payload) => payload?.data ?? payload,
}));

import ProjectsView from '../ProjectsView.jsx';

const PROJECT = {
  id: 15,
  title: 'Fleet Tracking Dashboard',
  status: 'open',
  type: 'company_sponsored',
  difficulty: 3,
};

describe('learner projects — Check match', () => {
  beforeEach(() => matchProject.mockReset());

  it('shows the score and eligibility the matching service returns', async () => {
    matchProject.mockResolvedValue({
      data: {
        score: 55,
        eligibility_state: 'eligible',
        explanation: ['Strong skill compatibility at 100.00%.'],
      },
    });

    render(<ProjectsView initialProjects={[PROJECT]} />);

    expect(screen.getByText(/0 eligible/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check match' }));

    await waitFor(() => expect(screen.getByText(/1 eligible/)).toBeInTheDocument());
    expect(matchProject).toHaveBeenCalledWith('15');
  });

  it('reports a not-eligible answer without claiming a match', async () => {
    matchProject.mockResolvedValue({
      data: { score: 0, eligibility_state: 'not_eligible', explanation: [] },
    });

    render(<ProjectsView initialProjects={[PROJECT]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check match' }));

    await waitFor(() => expect(screen.getByText(/0 eligible/)).toBeInTheDocument());
  });
});

describe('project skill comparison details', () => {
  it('maps returned skills into matched and gap counts', async () => {
    matchProject.mockResolvedValue({ data: { score: 21.67, eligibility_state: 'eligible', skill_results: [
      { skill_id: 1, skill_name: 'SQL', current_level: 5, minimum_level: 2, gap: 0, status: 'met' },
      { skill_id: 2, skill_name: 'UX Research', current_level: 0, minimum_level: 2, gap: 2, status: 'missing_non_critical' },
      { skill_id: 3, skill_name: 'Wireframing', current_level: 0, minimum_level: 2, gap: 2, status: 'missing_non_critical' },
    ] } });
    render(<ProjectsView initialProjects={[PROJECT]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check match' }));
    await waitFor(() => expect(screen.getByText('1/3')).toBeInTheDocument());
    expect(screen.queryByText('0/0')).toBeNull();
  });
  it('does not claim zero gaps when comparison details are missing', async () => {
    matchProject.mockResolvedValue({ data: { score: 21.67, eligibility_state: 'eligible', skill_results: [] } });
    render(<ProjectsView initialProjects={[PROJECT]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check match' }));
    await waitFor(() => expect(screen.getByText(/1 eligible/)).toBeInTheDocument());
    expect(screen.queryByText('0/0')).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });
});
