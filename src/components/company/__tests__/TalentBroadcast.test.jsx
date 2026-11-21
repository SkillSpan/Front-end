// Company → "Message all" (broadcast to every visible candidate).
//
// The old backend refused a second message to the same candidate with
// TALENT_CONTACT_PENDING, and there was no way to write to more than one
// candidate at a time. Both are gone: POST /api/v1/talent/contact-all sends
// the same message to every candidate the company can see and answers
// { data: { sent_to: n } }.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../../api', async (importOriginal) => ({ ...(await importOriginal()), companyRequest: vi.fn() }));

import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import { clearQueryCache } from '../../../cache/queryCache';
import TalentSearch from '../talent/TalentSearch';
import { resetTalentMock } from '../talent/talentApi';
import { compareSelection } from '../talent/selection';
import { resetMockBackend } from '../projects/mockBackend';

function mount() {
  return render(
    <PreferencesProvider>
      <MemoryRouter initialEntries={['/company/talent']}>
        <Routes>
          <Route path="/company/talent" element={<TalentSearch demo="full" />} />
        </Routes>
      </MemoryRouter>
    </PreferencesProvider>,
  );
}

beforeEach(() => {
  resetTalentMock();
  resetMockBackend();
  clearQueryCache();
  compareSelection.clear();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('message every candidate', () => {
  it('opens the broadcast dialog from the page header', async () => {
    mount();
    const trigger = await screen.findByRole('button', { name: /message all/i });
    fireEvent.click(trigger);

    expect(await screen.findByText(/message every candidate/i)).toBeTruthy();
    expect(screen.getByLabelText(/message/i, { selector: 'textarea' })).toBeTruthy();
  });

  it('refuses an empty message and sends nothing', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /message all/i }));
    await screen.findByText(/message every candidate/i);

    fireEvent.click(screen.getByRole('button', { name: /send to all/i }));

    // Still open, nothing sent.
    expect(screen.getByText(/message every candidate/i)).toBeTruthy();
    expect(screen.queryByText(/message sent to/i)).toBeNull();
  });

  it('sends one message to every visible candidate and reports the count', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: /message all/i }));
    await screen.findByText(/message every candidate/i);

    fireEvent.change(screen.getByLabelText(/message/i, { selector: 'textarea' }), {
      target: { value: 'We are hiring interns next month.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send to all/i }));

    // previewCall simulates 220 ms of latency; under a full-suite run that can
    // exceed the default 1 s waitFor budget.
    await waitFor(() => expect(screen.getByText(/message sent to \d+ candidates/i)).toBeTruthy(), { timeout: 5000 });
    expect(screen.queryByText(/message every candidate/i)).toBeNull();
  });

  it('hides the broadcast control from a company that cannot search talent', async () => {
    render(
      <PreferencesProvider>
        <MemoryRouter initialEntries={['/company/talent']}>
          <Routes>
            <Route path="/company/talent" element={<TalentSearch demo="full" previewState="readonly" />} />
          </Routes>
        </MemoryRouter>
      </PreferencesProvider>,
    );

    // The no-permission screen still renders its header, but writing to
    // candidates is gated by the same permission as reading them.
    expect(await screen.findByText(/talent search isn’t available/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /message all/i })).toBeNull();
    expect(screen.queryByText(/message every candidate/i)).toBeNull();
  });
});
