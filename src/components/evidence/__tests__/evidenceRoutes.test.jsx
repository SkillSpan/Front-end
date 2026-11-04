import './setupReact';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';

vi.mock('../../../api', () => ({
  getMyEvidence: vi.fn(),
  getSkillsTaxonomy: vi.fn(),
  submitEvidence: vi.fn(),
  reviewEvidence: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { name: 'Ahmed Mazen' }, logout: vi.fn() }),
}));

import { getMyEvidence, getSkillsTaxonomy } from '../../../api';
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

beforeEach(() => {
  vi.clearAllMocks();
  getSkillsTaxonomy.mockResolvedValue({ data: [{ id: 3, name: 'React' }, { id: 4, name: 'SQL' }] });
});

describe('evidence screens inside the app shell', () => {
  it('keeps the Evidence Status page, its empty state and both Add Evidence buttons when the learner has no evidence', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    renderAt('/evidence');
    expect(await screen.findByText('Evidence Status')).toBeTruthy();
    expect(screen.getByText('No evidence submitted yet.')).toBeTruthy();
    // dashboard shell is present (sidebar + top bar), with My Record always listed
    expect(screen.getByText('My Skill Matrix')).toBeTruthy();
    expect(screen.getByText('Ahmed Mazen')).toBeTruthy();
    expect(screen.getByText('My Record')).toBeTruthy();
    const addButtons = screen.getAllByRole('button', { name: /Add Evidence/ }).filter((el) => !el.closest('nav'));
    expect(addButtons.length).toBe(2);
  });

  it('ignores the rows the baseline assessment writes, so they never show up as evidence', async () => {
    getMyEvidence.mockResolvedValue({ data: [
      { id: 1, skill: { id: 3, name: 'React' }, source: 'assessment_test', verification_status: 'verified', reference: 'Baseline assessment v1' },
      { id: 2, skill: { id: 4, name: 'SQL' }, source: 'assessment_test', verification_status: 'verified', reference: 'Baseline assessment v1' },
    ] });
    renderAt('/evidence');
    expect(await screen.findByText('No evidence submitted yet.')).toBeTruthy();
    expect(screen.queryByText('React')).toBeNull();
  });

  it('lists a certificate the learner added', async () => {
    getMyEvidence.mockResolvedValue({ data: [
      { id: 1, skill: { id: 3, name: 'React' }, source: 'assessment_test', verification_status: 'verified' },
      { id: 9, skill: { id: 4, name: 'SQL' }, source: 'certificate', reference: 'https://example.com/cert.pdf', verification_status: 'pending' },
    ] });
    renderAt('/evidence');
    expect(await screen.findByText('Evidence Status')).toBeTruthy();
    expect(screen.getByText('SQL')).toBeTruthy();
    expect(screen.queryByText('React')).toBeNull();
    expect(screen.getByText('https://example.com/cert.pdf')).toBeTruthy();
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

  it('shows one friendly error line with Retry (no raw server text) when the API call fails', async () => {
    getMyEvidence.mockRejectedValue({ status: 503, message: 'down', errors: {} });
    renderAt('/evidence');
    expect(await screen.findByText("Couldn't load your evidence.")).toBeTruthy();
    expect(screen.queryByText(/down/)).toBeNull();
    expect(screen.queryByText(/preview/i)).toBeNull();
    getMyEvidence.mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('No evidence submitted yet.')).toBeTruthy();
  });

  it('shows a friendly skills error with Retry on the add form', async () => {
    getMyEvidence.mockResolvedValue({ data: [] });
    getSkillsTaxonomy.mockRejectedValueOnce({ status: 500, message: 'Server Error', errors: {} });
    renderAt('/evidence/add');
    expect(await screen.findByText(/Couldn't load the skills list/)).toBeTruthy();
    expect(screen.queryByText('Server Error')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Select the skill this evidence proves')).toBeTruthy();
  });

  it('renders a reviewed card from real API fields (ISO dates, reviewer, note, resubmit)', async () => {
    getMyEvidence.mockResolvedValue({ data: [{
      id: 12, skill: { id: 4, name: 'SQL' }, source: 'experience', reference: 'https://example.com/work',
      description: 'Query tuning at an internship', verification_status: 'rejected',
      created_at: '2026-10-20T09:12:00.000000Z', reviewed_at: '2026-10-22T10:00:00.000000Z',
      reviewer: { name: 'Sara Ali' }, reviewer_notes: 'Please add the query plan.',
    }] });
    renderAt('/evidence');
    expect(await screen.findByText('SQL')).toBeTruthy();
    expect(screen.getByText(/Submitted Oct 20, 2026/)).toBeTruthy();
    expect(screen.getByText(/Reviewed Oct 22, 2026 by Sara Ali/)).toBeTruthy();
    expect(screen.getByText('Please add the query plan.')).toBeTruthy();
    expect(screen.getByText('Resubmit Evidence')).toBeTruthy();
    expect(screen.queryByText(/Invalid Date/)).toBeNull();
  });

  it('opens the detail page and the add form', async () => {
    getMyEvidence.mockResolvedValue({ data: [{ id: 'ev-react', skill: { id: 1, name: 'React' }, verification_status: 'pending' }] });
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

  it('add form starts empty: no source, no skill, nothing borrowed from other records', async () => {
    getMyEvidence.mockResolvedValue({ data: [
      { id: 9, skill: { id: 4, name: 'SQL' }, source: 'certificate', description: 'An old certificate description', verification_status: 'pending' },
    ] });
    renderAt('/evidence/add');
    expect(await screen.findByText('Evidence details')).toBeTruthy();
    for (const label of ['Certificate', 'Experience', 'Project']) {
      expect(screen.getByRole('radio', { name: label }).getAttribute('aria-checked')).toBe('false');
    }
    expect(await screen.findByText('Select the skill this evidence proves')).toBeTruthy();
    expect(screen.queryByText(/SQL/)).toBeNull();
    expect(screen.getByLabelText(/Evidence description/).value).toBe('');
  });

  it('reviewer dashboard renders the queue', async () => {
    getMyEvidence.mockResolvedValue({ data: [{ id: 'ev-1', skill: { id: 1, name: 'React' }, verification_status: 'pending' }] });
    renderAt('/review');
    await waitFor(() => expect(screen.getByText('Review queue')).toBeTruthy());
  });
});
