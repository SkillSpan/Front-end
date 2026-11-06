import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/*
 * The Career Roles search used to filter the rows already on screen. The list
 * arrives one page at a time (`?page=1&per_page=15`), so typing a term sent no
 * request and only ever searched those 15 rows — a role on page 2 was
 * unreachable.
 *
 * The term now goes to the API, before pagination. These tests pin that:
 * the request is made, it carries `search`, and a role that only exists on a
 * later page is found.
 */
const getCareerRoles = vi.fn();

vi.mock('../../../api', () => ({
  getCareerRoles: (...args) => getCareerRoles(...args),
  unwrapApiData: (payload) => payload?.data ?? payload,
}));

import CareerRolesView from '../CareerRolesView.jsx';

// Page 1 of the catalog: 15 rows, none of them "Data Analyst".
const PAGE_ONE = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: `Placeholder Role ${String(i + 1).padStart(2, '0')}`,
}));

// Page 2 of the catalog — this is the row that used to be invisible.
const LATER_PAGE_ROLE = { id: 99, title: 'Data Analyst' };

const searchFirstPage = (term) => ({ data: { data: [{ id: 99, title: term }], total: 1 } });

describe('learner career roles — server-side search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the search term to the API instead of filtering in memory', async () => {
    getCareerRoles.mockResolvedValue({ data: { data: [LATER_PAGE_ROLE], total: 1 } });

    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    fireEvent.change(screen.getByPlaceholderText('Search career roles...'), {
      target: { value: 'Data Analyst' },
    });

    await waitFor(() => expect(getCareerRoles).toHaveBeenCalled());
    expect(getCareerRoles).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Data Analyst', page: 1 }),
    );
  });

  it('finds a role that is only on a later page', async () => {
    getCareerRoles.mockResolvedValue({ data: { data: [LATER_PAGE_ROLE], total: 1 } });

    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    // Not on the loaded page at all.
    expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Search career roles...'), {
      target: { value: 'Data Analyst' },
    });

    await waitFor(() => expect(screen.getByText('Data Analyst')).toBeInTheDocument());
  });

  it('resets to page 1 when the term changes', async () => {
    getCareerRoles.mockImplementation(async ({ search, page }) => ({
      data: { data: [{ id: 1, title: `${search} p${page}` }], total: 40 },
    }));

    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    const input = screen.getByPlaceholderText('Search career roles...');

    fireEvent.change(input, { target: { value: 'Data' } });
    await waitFor(() => expect(screen.getByText(/Page 1 of/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText(/Page 2 of/)).toBeInTheDocument());

    // A new term must not keep page 2 from the previous query.
    fireEvent.change(input, { target: { value: 'Analyst' } });
    await waitFor(() => expect(screen.getByText(/Page 1 of/)).toBeInTheDocument());
    expect(getCareerRoles).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'Analyst', page: 1 }),
    );
  });

  it('shows the empty state only when the backend returns no rows', async () => {
    getCareerRoles.mockResolvedValue({ data: { data: [], total: 0 } });

    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    fireEvent.change(screen.getByPlaceholderText('Search career roles...'), {
      target: { value: 'Nuclear Physicist' },
    });

    await waitFor(() => expect(screen.getByTestId('career-roles-no-results')).toBeInTheDocument());
    expect(screen.getByText(/Nothing matched/)).toBeInTheDocument();
  });

  it('does not refetch on mount when no search has been typed', () => {
    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    expect(getCareerRoles).not.toHaveBeenCalled();
  });

  it('keeps the previous results when the search request fails', async () => {
    getCareerRoles.mockRejectedValue({ status: 500 });

    render(<CareerRolesView initialRoles={PAGE_ONE} searchDebounceMs={0} />);

    fireEvent.change(screen.getByPlaceholderText('Search career roles...'), {
      target: { value: 'Data' },
    });

    await waitFor(() => expect(screen.getByText(/Search could not be completed/)).toBeInTheDocument());
    // A failed search is not "no results".
    expect(screen.queryByTestId('career-roles-no-results')).not.toBeInTheDocument();
  });
});
