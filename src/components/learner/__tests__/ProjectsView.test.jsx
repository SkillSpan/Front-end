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
