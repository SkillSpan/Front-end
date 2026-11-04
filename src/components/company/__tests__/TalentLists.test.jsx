// US-COMP-07 — Saved Lists, Internal Notes & Consent-Aware Contact (COMP-05/06/07, BR-09, AC-01..09).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import * as api from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import TalentSearch from '../talent/TalentSearch';
import CandidateSummary from '../talent/CandidateSummary';
import TalentCompare from '../talent/TalentCompare';
import TalentLists from '../talent/TalentLists';
import { resetTalentMock } from '../talent/talentApi';
import { compareSelection } from '../talent/selection';
import { resetMockBackend } from '../projects/mockBackend';

function mount(path, { lang, previewState } = {}) {
  if (lang) window.localStorage.setItem(STORE_KEY, JSON.stringify({ lang }));
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/company/talent" element={<TalentSearch demo="full" previewState={previewState} />} />
          <Route path="/company/talent/compare" element={<TalentCompare demo="full" previewState={previewState} />} />
          <Route path="/company/talent/lists" element={<TalentLists demo="full" previewState={previewState} />} />
          <Route path="/company/talent/lists/:listId" element={<TalentLists demo="full" previewState={previewState} />} />
          <Route path="/company/talent/:id" element={<CandidateSummary demo="full" previewState={previewState} />} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => { resetTalentMock(); resetMockBackend(); clearQueryCache(); compareSelection.clear(); window.localStorage.clear(); window.sessionStorage.clear(); api.companyRequest.mockReset(); });

describe('Sprint-document routes (TODO until the guide lists them)', () => {
  it('lists, list candidates, notes and contact use the sprint names with idempotency keys', async () => {
    const { createList, addToList, addNote, contactCandidate } = await import('../talent/talentApi');
    api.companyRequest.mockResolvedValue({ data: { id: 'L9', name: 'X', candidates: [] } });
    await createList('X', [31], { idempotencyKey: 'k1' });
    // The list's own fields only; candidates are added one call each, because
    // that is the endpoint that exists.
    expect(api.companyRequest.mock.calls[0]).toEqual(['/api/v1/talent/lists', expect.objectContaining({ method: 'POST', body: { name: 'X' }, headers: { 'Idempotency-Key': 'k1' } })]);
    expect(api.companyRequest.mock.calls[1]).toEqual(['/api/v1/talent/lists/L9/candidates', expect.objectContaining({ method: 'POST', body: { student_id: 31 } })]);
    await addToList('L9', [32]);
    const add = api.companyRequest.mock.calls.find(([p, o]) => p === '/api/v1/talent/lists/L9/candidates' && o.body.student_id === 32);
    expect(add).toBeTruthy();
    api.companyRequest.mockResolvedValue({ data: { id: 'n1', body: 'hi' } });
    await addNote(31, 'hi', { idempotencyKey: 'k2' });
    const note = api.companyRequest.mock.calls.find(([p]) => p === '/api/v1/talent/candidates/31/notes');
    expect(note[1]).toEqual(expect.objectContaining({ method: 'POST', body: { body: 'hi' } }));
    api.companyRequest.mockResolvedValue({ data: { id: 'c1', status: 'sent' } });
    await contactCandidate(31, { type: 'invite', message: 'Join', projectId: 'p2' }, { idempotencyKey: 'k3' });
    const contact = api.companyRequest.mock.calls.find(([p]) => p === '/api/v1/talent/candidates/31/contact');
    expect(contact[1]).toEqual(expect.objectContaining({ method: 'POST', body: { type: 'invite', message: 'Join', project_id: 'p2' }, headers: { 'Idempotency-Key': 'k3' } }));
  });
});

describe('Saved lists', () => {
  it('overview shows lists with counts and the aggregate funnel (AC-09: counts only)', async () => {
    mount('/company/talent/lists');
    expect(await screen.findByText('Clinic follow-up — designers')).toBeInTheDocument();
    expect(screen.getByText('Backend pipeline 2027')).toBeInTheDocument();
    const funnel = document.querySelector('.cw-tl-funnel');
    await waitFor(() => expect(within(funnel).getByText('Saved').previousSibling.textContent).toBe('5'));
    expect(within(funnel).getByText('Contacted').previousSibling.textContent).toBe('1');
  });
  it('create, rename and delete a list (AC-01)', async () => {
    mount('/company/talent/lists');
    await screen.findByText('Backend pipeline 2027');
    fireEvent.click(screen.getByRole('button', { name: 'New list' }));
    let dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText(/List name/), { target: { value: 'Data 2027' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Create list' }));
    expect(await screen.findByText('List “Data 2027” created')).toBeInTheDocument();
    expect(screen.getByText('Data 2027')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Rename Data 2027' }));
    dlg = await screen.findByRole('dialog');
    fireEvent.change(within(dlg).getByLabelText(/List name/), { target: { value: 'Data 2028' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('List renamed to “Data 2028”')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Data 2028' }));
    dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Delete list' }));
    expect(await screen.findByText('List “Data 2028” deleted')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: /Data 2028/ })).not.toBeInTheDocument());
  });
  it('empty state', async () => {
    mount('/company/talent/lists', { previewState: 'empty' });
    expect(await screen.findByText('No saved lists yet')).toBeInTheDocument();
  });
  it('a candidate who withdrew consent is hidden from a list and only counted (BR-09)', async () => {
    mount('/company/talent/lists/L1');
    expect(await screen.findByRole('heading', { level: 1, name: 'Clinic follow-up — designers' })).toBeInTheDocument();
    expect(screen.getByText('Hidden candidates: 1')).toBeInTheDocument();
    expect(screen.getByText('Sara Nasser')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Sara Nasser from list' }));
    await waitFor(() => expect(screen.queryByText('Sara Nasser')).not.toBeInTheDocument());
  });
  it('an unknown list is "not found"', async () => {
    mount('/company/talent/lists/NOPE');
    expect(await screen.findByText('List not found')).toBeInTheDocument();
  });
});

describe('Notes and contact', () => {
  it('internal notes: private, newest first (AC-02)', async () => {
    mount('/company/talent/32');
    expect(await screen.findByText(/Strong interviewer/)).toBeInTheDocument();
    expect(screen.getByText(/The candidate never sees them/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Add note'), { target: { value: 'Ask about availability in January.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add note' }));
    await waitFor(() => expect(document.querySelectorAll('.cw-pj-tl li')).toHaveLength(2));
    expect(document.querySelectorAll('.cw-pj-tl li')[0].textContent).toMatch(/January/);
    expect(screen.getByLabelText('Add note')).toHaveValue('');
  });
  it('contact is unavailable when the learner does not accept company contact (Scenario 4)', async () => {
    mount('/company/talent/37');
    await screen.findByRole('heading', { level: 1, name: 'Noor Saleh' });
    expect(screen.getByRole('button', { name: /Invite or message/ })).toBeDisabled();
    expect(screen.getByText('This learner doesn’t accept company contact.')).toBeInTheDocument();
  });
  it('sends an invitation, then the rate limit shows the server reason (Scenario 3–4, AC-05/06)', async () => {
    mount('/company/talent/31');
    await screen.findByRole('heading', { level: 1, name: 'Rami Haddad' });
    fireEvent.click(screen.getByRole('button', { name: /Invite or message/ }));
    let dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Send invitation' }));
    expect(await within(dlg).findByText('This is required.')).toBeInTheDocument();
    fireEvent.change(within(dlg).getByLabelText(/Your message/), { target: { value: 'Your API work fits our Inventory project.' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Send invitation' }));
    expect(await screen.findByText('Invitation sent to Rami Haddad')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Invite or message/ }));
    dlg = await screen.findByRole('dialog');
    fireEvent.click(within(dlg).getByLabelText('Message'));
    fireEvent.change(within(dlg).getByLabelText(/Your message/), { target: { value: 'Follow-up' } });
    fireEvent.click(within(dlg).getByRole('button', { name: 'Send message' }));
    expect(await within(dlg).findByText('Contact limit reached for this learner')).toBeInTheDocument();
    expect(within(dlg).getByText(/twice this week/)).toBeInTheDocument();
  });
});
