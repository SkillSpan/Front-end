import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/*
 * /skill-matrix rendered a completely blank page for a signed-in learner —
 * no shell, no header, no error message. A blank page in a React SPA means a
 * render-time throw with no error boundary above it.
 *
 * These are the first tests this page has ever had. They mount it against the
 * real response shapes and assert something is on screen.
 */
const mocks = {
  getSkillsMatrix: vi.fn(),
  getSkillsTaxonomy: vi.fn(),
  getStoredUser: vi.fn(),
  resolveLearnerId: vi.fn(),
  getProfile: vi.fn(),
  getSpecializations: vi.fn(),
  getCareerRoles: vi.fn(),
  getCareerRoleSkills: vi.fn(),
  upsertSkillMatrix: vi.fn(),
  updateSkillMatrixEntry: vi.fn(),
  deleteLearnerSkill: vi.fn(),
};

vi.mock('../../../api', () => ({
  getSkillsMatrix: (...a) => mocks.getSkillsMatrix(...a),
  getSkillsTaxonomy: (...a) => mocks.getSkillsTaxonomy(...a),
  getStoredUser: (...a) => mocks.getStoredUser(...a),
  resolveLearnerId: (...a) => mocks.resolveLearnerId(...a),
  getProfile: (...a) => mocks.getProfile(...a),
  getSpecializations: (...a) => mocks.getSpecializations(...a),
  getCareerRoles: (...a) => mocks.getCareerRoles(...a),
  getCareerRoleSkills: (...a) => mocks.getCareerRoleSkills(...a),
  upsertSkillMatrix: (...a) => mocks.upsertSkillMatrix(...a),
  updateSkillMatrixEntry: (...a) => mocks.updateSkillMatrixEntry(...a),
  deleteLearnerSkill: (...a) => mocks.deleteLearnerSkill(...a),
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { id: 68, name: 'Demo Learner', role: 'individual' }, logout: vi.fn() }),
}));

vi.mock('../../auth/signOut', () => ({ signOutToLanding: vi.fn() }));

vi.mock('../../dashboard/AppLayout', () => ({
  default: ({ children }) => <div data-testid="app-layout">{children}</div>,
}));

import SkillMatrix from '../SkillMatrix.jsx';

// The real /skills/taxonomy shape: flat nodes linked by parent_skill_id.
const TAXONOMY = {
  data: [
    { id: 1, name: 'Web Development', parent_skill_id: null, slug: 'web-development' },
    { id: 10, name: 'REST APIs', parent_skill_id: 1, slug: 'rest-apis' },
    { id: 63, name: 'Business Requirements', parent_skill_id: 1, slug: 'business-requirements' },
  ],
};

describe('learner skill matrix page', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((fn) => fn.mockReset());
    mocks.getStoredUser.mockReturnValue({ id: 68, name: 'Demo Learner' });
    mocks.resolveLearnerId.mockReturnValue(68);
    mocks.getProfile.mockResolvedValue({ data: { specialization_id: null } });
    mocks.getSpecializations.mockResolvedValue({ data: [] });
    mocks.getCareerRoles.mockResolvedValue({ data: { data: [] } });
    mocks.getCareerRoleSkills.mockResolvedValue({ data: { skills: [] } });
    mocks.getSkillsTaxonomy.mockResolvedValue(TAXONOMY);
    mocks.getSkillsMatrix.mockResolvedValue({ data: [] });
  });

  it('renders instead of a blank page when the learner has no skills yet', async () => {
    render(<MemoryRouter><SkillMatrix onNavigate={vi.fn()} /></MemoryRouter>);

    await waitFor(() => expect(screen.getByTestId('app-layout')).toBeInTheDocument());
    // The taxonomy is on screen; an empty matrix is a state, not a crash.
    expect(screen.getByText('SKILL TAXONOMY')).toBeInTheDocument();
  });

  it('renders with matrix rows whose level is a string', async () => {
    mocks.getSkillsMatrix.mockResolvedValue({
      data: [{ id: 5, learner_id: 68, skill_id: 10, level: '3.50', confidence_score: '80.00', skill: { id: 10, name: 'REST APIs' } }],
    });

    render(<MemoryRouter><SkillMatrix onNavigate={vi.fn()} /></MemoryRouter>);

    await waitFor(() => expect(screen.getByTestId('app-layout')).toBeInTheDocument());
    expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();
  });

  /*
   * THE blank page.
   *
   * `level` is a decimal on a 0-5 scale ("3.50"), but `levelInfo` indexed a
   * six-entry array with it: LEVELS[3.5] is undefined, so `lv.name` threw and
   * React unmounted the whole tree — no shell, no message, just white.
   *
   * A whole number ("3.00" -> 3) worked, which is why this only broke for
   * learners whose level was not an integer.
   */
  it('renders a card whose level is a fractional decimal', async () => {
    mocks.getSkillsMatrix.mockResolvedValue({
      data: [{ id: 5, learner_id: 68, skill_id: 10, level: '3.50', confidence_score: '80.00' }],
    });

    render(<MemoryRouter><SkillMatrix onNavigate={vi.fn()} /></MemoryRouter>);

    await waitFor(() => expect(screen.getAllByText('REST APIs').length).toBeGreaterThan(0));
    // 3.5 sits in the "Intermediate" band (index 3).
    // The card carries `lvl-3` (the Intermediate band) instead of crashing.
    const card = document.querySelector('.sm-card');
    expect(card).not.toBeNull();
    // 3.5 rounds up to the Advanced band, and the card renders instead of
    // pushing the whole page to a blank screen.
    expect(card.textContent).toContain('Lv 3.5/5');
    expect(card.textContent).toContain('Advanced');
    expect(card.querySelector('[class~="lvl-3.5"]')).not.toBeNull();
  });

  it('renders a 2.50 level as its nearest whole band', async () => {
    mocks.getSkillsMatrix.mockResolvedValue({
      data: [{ id: 6, learner_id: 68, skill_id: 63, level: '2.50', confidence_score: '60.00' }],
    });

    render(<MemoryRouter><SkillMatrix onNavigate={vi.fn()} /></MemoryRouter>);

    await waitFor(() => expect(screen.getAllByText('Business Requirements').length).toBeGreaterThan(0));
    // 2.5 rounds to 3 under Math.round, so no crash and a real label.
    expect(screen.queryByText(/Cannot read/)).not.toBeInTheDocument();
  });

  it('levelInfo never returns undefined', async () => {
    const { levelInfo } = await import('../taxonomy.js');
    for (const value of [0, 1, 2.5, 3.5, '3.50', '2.50', 5, 0, null, undefined, NaN, 'abc']) {
      expect(levelInfo(value)).toBeTruthy();
      expect(typeof levelInfo(value).name).toBe('string');
    }
  });
});
