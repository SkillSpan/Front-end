import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/*
 * A learner who has never calculated readiness or intelligence has no snapshot,
 * and the API answers `GET /readiness/latest` and `GET /intelligence/latest`
 * with 404 (READINESS_NOT_FOUND / INTELLIGENCE_NOT_FOUND). That is the normal
 * first-run state.
 *
 * Two things broke on that path:
 *   1. The role list stores `demand: role.demand ?? null` because the career-roles
 *      payload carries no demand block, and the cards read
 *      `role.demand.demandLevel` -> "Cannot read properties of null (reading
 *      'demandLevel')".
 *   2. `role.skillRequirements` is never in the list payload either (it comes
 *      from /career-roles/{id}/skills), so the same crash waited one line lower.
 *
 * The page must render the roles regardless, and degrade the missing data to an
 * explicit "not available" label rather than blanking or crashing.
 */
vi.mock('../../../api', () => ({
  unwrapApiData: (payload) => payload?.data ?? payload,
  // The detail panel now fetches these; these tests cover the list and the
  // no-data fallbacks, so a role with no published requirements is the case.
  getCareerRoleSkills: vi.fn().mockResolvedValue({ data: { skills: [] } }),
  getSkillsMatrix: vi.fn().mockResolvedValue({ data: [] }),
}));

import CareerRolesView from '../CareerRolesView.jsx';

// Exactly what CareerRoleController::index sends: id/title/version, no demand,
// no skillRequirements.
const ROLE = { id: 3, title: 'Backend Engineer', version: 1 };

describe('learner career roles without readiness/intelligence snapshots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the role list when the role payload has no demand block', () => {
    render(<CareerRolesView initialRoles={[ROLE]} />);

    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    // Not a fake "Low"/"Medium" reading, and not a crash.
    expect(screen.getAllByText('No demand data').length).toBeGreaterThan(0);
  });

  it('renders the generic initialRoles alias too (name instead of title)', () => {
    render(<CareerRolesView initialRoles={[{ id: 9, name: 'Data Analyst', demand: null }]} />);

    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
  });

  it('opens the detail panel and shows fallbacks instead of throwing', async () => {
    render(<CareerRolesView initialRoles={[ROLE]} />);

    fireEvent.click(screen.getByRole('button', { name: /View Role Details/ }));

    await waitFor(() => expect(screen.getByTestId('requirements-unavailable')).toBeInTheDocument());
    expect(screen.getByTestId('demand-unavailable')).toBeInTheDocument();
    expect(screen.getByText('Labor-Market Demand')).toBeInTheDocument();
  });

  it('still shows a real demand reading when the payload does provide one', () => {
    render(
      <CareerRolesView
        initialRoles={[
          {
            ...ROLE,
            demand: { demandLevel: 'High', demandValue: 82, source: 'Market', collectionDate: '2026-01-01', validUntil: '2026-12-31' },
          },
        ]}
      />,
    );

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.queryByText('No demand data')).not.toBeInTheDocument();
  });

  it('shows an empty state instead of a blank panel when there are no roles', () => {
    render(<CareerRolesView initialRoles={[]} />);

    expect(screen.getByTestId('career-roles-empty')).toBeInTheDocument();
    expect(screen.getByText('No career roles to show yet')).toBeInTheDocument();
  });
});
