import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

/*
 * The messages bell in the top bar.
 *
 * It sits beside the notifications bell and looks the same, but it has no
 * server-side read flag to work from: a message is read-only, and the backend
 * never records that the learner looked at it (that would be a read receipt
 * shown to the company). So "new" is "arrived since you last opened Messages",
 * remembered on this device. These tests pin that, plus the two ways the badge
 * clears — opening the popover and landing on /messages.
 */
vi.mock('../../../api', () => ({
  getLearnerMessages: vi.fn(),
  unwrapApiData: (payload) => payload?.data ?? payload,
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  logoutUser: vi.fn(),
  logoutAllDevices: vi.fn(),
}));

import { getLearnerMessages } from '../../../api';
import { PreferencesProvider } from '../../../preferences/PreferencesContext';
import { STORE_KEY } from '../../../preferences/constants';
import AppLayout from '../../dashboard/AppLayout.jsx';

const MESSAGES = [
  {
    id: 6,
    message: 'We are hiring interns next month.',
    status: 'pending',
    from: { organization_id: 10, organization_name: 'Taqat Academy', sender_name: 'Osama Saleh' },
    created_at: '2026-11-07T17:01:38+00:00',
  },
  {
    id: 4,
    message: 'A second note from the same company.',
    status: 'pending',
    from: { organization_id: 10, organization_name: 'Taqat Academy', sender_name: 'Osama Saleh' },
    created_at: '2026-11-07T17:01:18+00:00',
  },
];

function mount({ active = 'dashboard', onNavigate = vi.fn(), user = { id: 68, name: 'asda' } } = {}) {
  render(
    <PreferencesProvider>
      <AppLayout active={active} onNavigate={onNavigate} user={user}>
        <div>page</div>
      </AppLayout>
    </PreferencesProvider>,
  );
  return { onNavigate };
}

// The sidebar also has a "Messages" nav item, so the bell is addressed by its
// test id rather than by name.
const messagesButton = () => screen.getByTestId('topbar-messages');

describe('top bar messages bell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    getLearnerMessages.mockResolvedValue({ data: MESSAGES, meta: { total: 2 } });
  });

  it('sits in the top bar and counts the messages that arrived', async () => {
    mount();

    await waitFor(() => expect(within(messagesButton()).getByText('2')).toBeTruthy());
    expect(getLearnerMessages).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });

  it('opens a popover with the company and the message text', async () => {
    mount();
    await waitFor(() => expect(within(messagesButton()).getByText('2')).toBeTruthy());

    fireEvent.click(messagesButton());

    const dialog = await screen.findByRole('dialog', { name: 'Messages' });
    expect(within(dialog).getAllByText('Taqat Academy')).toHaveLength(2);
    expect(within(dialog).getByText('We are hiring interns next month.')).toBeTruthy();
    expect(within(dialog).getByText('A second note from the same company.')).toBeTruthy();
  });

  it('clears the badge and goes to the inbox from "Open Messages"', async () => {
    const { onNavigate } = mount();
    await waitFor(() => expect(within(messagesButton()).getByText('2')).toBeTruthy());

    fireEvent.click(messagesButton());
    const dialog = await screen.findByRole('dialog', { name: 'Messages' });
    fireEvent.click(within(dialog).getByRole('button', { name: /Open Messages/ }));

    expect(onNavigate).toHaveBeenCalledWith('messages');
    expect(within(messagesButton()).queryByText('2')).toBeNull();
    // The marker is per account, so a second account on the same browser is
    // not told its messages were already read.
    expect(window.localStorage.getItem('skillspan.messages.seenAt.68')).toBeTruthy();
  });

  it('does not count messages that were already seen', async () => {
    window.localStorage.setItem('skillspan.messages.seenAt.68', String(Date.now()));
    mount();

    await waitFor(() => expect(getLearnerMessages).toHaveBeenCalled());
    expect(within(messagesButton()).queryByText('2')).toBeNull();
  });

  it('shows no badge and an empty state when no company has written', async () => {
    getLearnerMessages.mockResolvedValue({ data: [], meta: { total: 0 } });
    mount();

    await waitFor(() => expect(getLearnerMessages).toHaveBeenCalled());
    expect(within(messagesButton()).queryByText(/\d/)).toBeNull();

    fireEvent.click(messagesButton());
    const dialog = await screen.findByRole('dialog', { name: 'Messages' });
    expect(within(dialog).getByText('No company has written to you yet.')).toBeTruthy();
  });

  it('is already read when the learner is standing on the messages page', async () => {
    mount({ active: 'messages' });

    await waitFor(() => expect(getLearnerMessages).toHaveBeenCalled());
    // The page itself stamps the marker, so the badge never shows a count for
    // messages the learner is looking at right now.
    await waitFor(() => expect(window.localStorage.getItem('skillspan.messages.seenAt.68')).toBeTruthy());
    expect(within(messagesButton()).queryByText('2')).toBeNull();
  });

  it('keeps the rest of the shell usable when the inbox request fails', async () => {
    getLearnerMessages.mockRejectedValue({ status: 500, message: 'boom' });
    mount();

    await waitFor(() => expect(getLearnerMessages).toHaveBeenCalled());
    expect(within(messagesButton()).queryByText(/\d/)).toBeNull();

    fireEvent.click(messagesButton());
    const dialog = await screen.findByRole('dialog', { name: 'Messages' });
    expect(within(dialog).getByText('No company has written to you yet.')).toBeTruthy();
  });
});
