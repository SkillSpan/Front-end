import './setupReact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getMyEvidence: vi.fn(),
  submitEvidence: vi.fn(),
  reviewEvidence: vi.fn(),
}));
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { name: 'Ahmed Mazen' }, logout: vi.fn() }),
}));

import { getMyEvidence } from '../../../api';
import { EvidenceProvider } from '../EvidenceContext';
import { EvidenceStatusPage, AddEvidencePage, EvidenceDetailPage, ReviewerPage } from '../EvidencePages';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<EvidenceProvider><Outlet /></EvidenceProvider>}>
          <Route path="/evidence" element={<EvidenceStatusPage />} />
          <Route path="/evidence/add" element={<AddEvidencePage />} />
          <Route path="/evidence/:id" element={<EvidenceDetailPage />} />
          <Route path="/review" element={<ReviewerPage />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('evidence screens inside the app shell', () => {
  it('renders Evidence Status inside the dashboard layout with preview data when API is empty', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    renderAt('/evidence');
    expect(await screen.findByText('Evidence Status')).toBeTruthy();
    // dashboard shell is present (sidebar + top bar)
    expect(screen.getByText('My Skill Matrix')).toBeTruthy();
    expect(screen.getByText('Ahmed Mazen')).toBeTruthy();
    expect(screen.getByText(/Showing preview data/)).toBeTruthy();
    expect(screen.getAllByText('Python').length).toBeGreaterThan(0);
  });

  it('shows real records from the API (mapped) without the preview banner', async () => {
    getMyEvidence.mockResolvedValue({ data: [{
      id: 7, skill: { id: 3, name: 'Go' }, evidence_url: 'https://github.com/a/b',
      description: 'x'.repeat(60), verification_status: 'verified', evidence_date: '2026-08-01',
    }] });
    renderAt('/evidence');
    expect(await screen.findByText('Go')).toBeTruthy();
    expect(screen.queryByText(/Showing preview data/)).toBeNull();
    expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
  });

  it('falls back to preview (not a blank screen) when the API call fails', async () => {
    getMyEvidence.mockRejectedValue({ status: 503, message: 'down', errors: {} });
    renderAt('/evidence');
    expect(await screen.findByText(/Couldn't load your evidence/)).toBeTruthy();
  });

  it('opens the detail page and the add form', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    renderAt('/evidence/ev-react');
    expect(await screen.findByText('Evidence review')).toBeTruthy();
  });

  it('add form validates description length', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    renderAt('/evidence/add');
    expect(await screen.findByText('Evidence details')).toBeTruthy();
    const submit = screen.getByText('Submit for review').closest('button');
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Evidence description/), { target: { value: 'too short' } });
    expect(submit.disabled).toBe(true);
  });

  it('reviewer dashboard renders the queue', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    renderAt('/review');
    await waitFor(() => expect(screen.getByText('Review queue')).toBeTruthy());
  });
});
