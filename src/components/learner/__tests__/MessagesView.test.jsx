import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/*
 * The learner inbox is READ-ONLY. Companies write through
 * POST /talent/contact and POST /talent/contact-all; the learner only reads
 * GET /api/v1/learner/messages.
 *
 * The contract this file pins:
 *   - the payload shape the backend actually sends
 *     ({ success, data: [...], meta: { current_page, last_page, total } })
 *   - an empty inbox is an empty state, not an error
 *   - a failed fetch is an error with a retry, not a blank screen
 *   - there is no reply/accept/decline control anywhere on the screen,
 *     because the API has none
 */
vi.mock('../../../api', () => ({
  unwrapApiData: (payload) => payload?.data ?? payload,
  getLearnerMessages: vi.fn(),
}));

import { getLearnerMessages } from '../../../api';
import MessagesView from '../MessagesView.jsx';

const MESSAGE = {
  id: 12,
  message: 'We reviewed your profile and would like to talk about a junior backend role.',
  status: 'pending',
  from: {
    organization_id: 4,
    organization_name: 'Nile Systems',
    sender_name: 'Ahmed Hassan',
  },
  created_at: '2026-11-06T10:15:00+00:00',
};

function page(rows, meta = {}) {
  return {
    success: true,
    data: rows,
    meta: { current_page: 1, last_page: 1, per_page: 20, total: rows.length, ...meta },
  };
}

describe('learner read-only messages inbox', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the messages the backend returns, newest first as sent', async () => {
    getLearnerMessages.mockResolvedValue(page([MESSAGE]));

    render(<MessagesView />);

    expect(await screen.findByTestId('learner-message-body')).toHaveTextContent(
      'We reviewed your profile',
    );
    expect(screen.getByTestId('learner-message-company')).toHaveTextContent('Nile Systems');
    expect(getLearnerMessages).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });

  it('shows an empty state when the inbox has no rows', async () => {
    getLearnerMessages.mockResolvedValue(page([]));

    render(<MessagesView />);

    expect(await screen.findByTestId('learner-messages-empty')).toHaveTextContent('No messages yet');
    expect(screen.queryByTestId('learner-message')).toBeNull();
  });

  it('shows an error with a retry when the request fails', async () => {
    getLearnerMessages.mockRejectedValueOnce({ status: 500, message: 'boom' });
    getLearnerMessages.mockResolvedValueOnce(page([MESSAGE]));

    render(<MessagesView />);

    const error = await screen.findByTestId('learner-messages-error');
    expect(error).toHaveTextContent('We could not load your messages.');

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.getByTestId('learner-message-company')).toHaveTextContent('Nile Systems'),
    );
    expect(screen.queryByTestId('learner-messages-error')).toBeNull();
  });

  it('offers no reply, accept or decline control — the inbox is read-only', async () => {
    getLearnerMessages.mockResolvedValue(page([MESSAGE]));

    render(<MessagesView />);

    await screen.findByTestId('learner-message');

    for (const label of [/reply/i, /accept/i, /decline/i, /mark as read/i]) {
      expect(screen.queryByRole('button', { name: label })).toBeNull();
    }
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('loads older messages only when there is another page', async () => {
    getLearnerMessages.mockResolvedValueOnce(
      page([MESSAGE], { current_page: 1, last_page: 2, total: 2 }),
    );

    render(<MessagesView />);
    await screen.findByTestId('learner-message');

    getLearnerMessages.mockResolvedValueOnce(
      page([{ ...MESSAGE, id: 11, message: 'Earlier note.' }], {
        current_page: 2,
        last_page: 2,
        total: 2,
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Load older messages' }));

    await waitFor(() => expect(screen.getAllByTestId('learner-message')).toHaveLength(2));
    expect(getLearnerMessages).toHaveBeenLastCalledWith({ page: 2, perPage: 20 });
  });

  it('does not show a load-more button when there is a single page', async () => {
    getLearnerMessages.mockResolvedValue(page([MESSAGE]));

    render(<MessagesView />);
    await screen.findByTestId('learner-message');

    expect(screen.queryByRole('button', { name: 'Load older messages' })).toBeNull();
  });
});
