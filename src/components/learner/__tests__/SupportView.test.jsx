import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

vi.mock('../../../api', () => ({
  getSupportRequests: vi.fn(),
  getSupportRequest: vi.fn(),
  sendSupportMessage: vi.fn(),
  createSupportRequest: vi.fn(),
  // Same unwrapping rule as the real helper: `data` first, then the payload.
  unwrapApiData: (payload) => payload?.data?.data ?? payload?.data ?? payload,
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { id: 5, name: 'Learner One' } }),
}));

import { getSupportRequest, getSupportRequests, sendSupportMessage, createSupportRequest } from '../../../api';
import SupportView from '../SupportView';
import { SUPPORT_CREATED_EVENT } from '../SupportWaitingToast';

const LIST = {
  data: [
    {
      id: 12,
      subject: 'Roadmap is missing',
      status: 'assigned',
      created_at: '2026-10-17T09:00:00+00:00',
      last_message_at: '2026-10-17T10:00:00+00:00',
    },
  ],
};

const THREAD = {
  data: {
    id: 12,
    subject: 'Roadmap is missing',
    status: 'assigned',
    assignee_name: 'Sara Admin',
    created_at: '2026-10-17T09:00:00+00:00',
    last_message_at: '2026-10-17T10:00:00+00:00',
    transcript: [{ role: 'learner', body: 'Where is my roadmap?' }],
    messages: [
      {
        id: 1,
        sender_id: 5,
        sender_name: 'Learner One',
        body: 'Hello, my roadmap is empty.',
        message_type: 'text',
        created_at: '2026-10-17T09:01:00+00:00',
      },
      {
        id: 2,
        sender_id: 99,
        sender_name: 'Sara Admin',
        body: 'We fixed your roadmap, please reload.',
        message_type: 'text',
        created_at: '2026-10-17T10:00:00+00:00',
      },
    ],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  getSupportRequests.mockResolvedValue(LIST);
  getSupportRequest.mockResolvedValue(THREAD);
});

describe('learner support thread', () => {
  it('shows the support team reply that used to be invisible', async () => {
    render(<SupportView />);

    expect(await screen.findByText('Roadmap is missing')).toBeTruthy();
    await waitFor(() => expect(getSupportRequest).toHaveBeenCalledWith(12));

    // The administrator's answer is the whole point: it must be on screen.
    expect(await screen.findByText('We fixed your roadmap, please reload.')).toBeTruthy();
    expect(screen.getByText('Sara Admin')).toBeTruthy();
    expect(screen.getByText('Hello, my roadmap is empty.')).toBeTruthy();
  });

  it('sends a reply and appends it to the thread', async () => {
    sendSupportMessage.mockResolvedValue({
      data: {
        id: 3,
        sender_id: 5,
        sender_name: 'Learner One',
        body: 'Thanks, it works now.',
        message_type: 'text',
        created_at: '2026-10-17T11:00:00+00:00',
      },
    });

    render(<SupportView />);
    await screen.findByText('We fixed your roadmap, please reload.');

    fireEvent.change(screen.getByPlaceholderText(/Write a reply/), { target: { value: 'Thanks, it works now.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(sendSupportMessage).toHaveBeenCalledWith(12, 'Thanks, it works now.'));
    expect(await screen.findByText('Thanks, it works now.')).toBeTruthy();
  });

  it('stops offering a reply once the request is resolved', async () => {
    getSupportRequest.mockResolvedValue({
      data: { ...THREAD.data, status: 'resolved' },
    });

    render(<SupportView />);
    await screen.findByText('We fixed your roadmap, please reload.');

    expect(screen.queryByPlaceholderText(/Write a reply/)).toBeNull();
    expect(screen.getByText(/This request is resolved/)).toBeTruthy();
  });

  it('renders the handoff notice as a system line, not as a person', async () => {    getSupportRequest.mockResolvedValue({
      data: {
        ...THREAD.data,
        messages: [
          {
            id: 9,
            sender_id: 5,
            body: 'Transferring you to technical support.',
            message_type: 'system',
            created_at: '2026-10-17T09:00:30+00:00',
          },
        ],
      },
    });

    render(<SupportView />);
    expect(await screen.findByText('Transferring you to technical support.')).toBeTruthy();
    // A system line is not attributed to a sender, so no sender label appears.
    expect(screen.queryByText('Learner One')).toBeNull();
  });

  it('marks an assigned thread as waiting for the learner', async () => {
    render(<SupportView />);
    await screen.findByText('We fixed your roadmap, please reload.');

    expect(screen.getAllByText('Waiting for you').length).toBeGreaterThan(0);
  });

  it('announces a created request with the mentor the handoff assigned', async () => {
    getSupportRequests.mockResolvedValue({ data: [] });
    getSupportRequest.mockResolvedValue({ data: { ...THREAD.data, id: 21 } });
    createSupportRequest.mockResolvedValue({
      data: { id: 21, status: 'assigned', assignee_name: 'Sara Admin' },
    });
    sendSupportMessage.mockResolvedValue({
      data: { id: 30, sender_id: 5, body: 'Need help', message_type: 'text', created_at: '2026-10-17T11:00:00+00:00' },
    });

    const heard = vi.fn();
    window.addEventListener(SUPPORT_CREATED_EVENT, heard);

    try {
      render(<SupportView />);

      fireEvent.click(await screen.findByRole('button', { name: 'New request' }));
      fireEvent.change(screen.getByPlaceholderText(/Describe what you need help with/), {
        target: { value: 'I need help with my roadmap' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Send request' }));

      await waitFor(() => expect(heard).toHaveBeenCalledTimes(1));
      // The banner greets the learner by the name the API returned.
      expect(heard.mock.calls[0][0].detail).toMatchObject({ id: 21, name: 'Sara Admin' });
    } finally {
      window.removeEventListener(SUPPORT_CREATED_EVENT, heard);
    }
  });
});
