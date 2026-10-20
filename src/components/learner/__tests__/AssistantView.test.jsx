import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../api', () => ({
  askAssistant: vi.fn(),
  reportAssistantInteraction: vi.fn(),
  createSupportRequest: vi.fn(),
  unwrapApiData: (payload) => payload?.data?.data ?? payload?.data ?? payload,
}));

vi.mock('../../auth/AuthContext', () => ({
  useAuth: () => ({ authUser: { id: 5, name: 'Learner One' } }),
}));

import AssistantView from '../AssistantView';
import { loadAssistantChat, saveAssistantChat } from '../assistantChatStorage';

const THREAD = [
  { id: 'u1', role: 'user', type: 'text', text: 'Where is my roadmap?', ts: '10:00' },
  { id: 'a1', role: 'assistant', type: 'text', text: 'Your roadmap is being generated.', ts: '10:00' },
];

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe('assistant chat persistence', () => {
  it('restores the conversation the learner already had', async () => {
    saveAssistantChat(5, THREAD);

    render(<AssistantView />);

    expect(await screen.findByText('Where is my roadmap?')).toBeTruthy();
    expect(screen.getByText('Your roadmap is being generated.')).toBeTruthy();
    // The welcome cards must not cover a restored conversation.
    expect(screen.queryByText('How can I help you today?')).toBeNull();
  });

  it('offers no delete control before anything was said', () => {
    render(<AssistantView />);

    expect(screen.queryByRole('button', { name: 'Delete conversation' })).toBeNull();
  });

  it('deletes the conversation from the screen and from the browser', async () => {
    saveAssistantChat(5, THREAD);
    render(<AssistantView />);
    await screen.findByText('Where is my roadmap?');

    fireEvent.click(screen.getByRole('button', { name: 'Delete conversation' }));
    // A second click is required — deleting a thread is not undoable.
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.queryByText('Where is my roadmap?')).toBeNull());
    expect(screen.getByText('How can I help you today?')).toBeTruthy();
    expect(loadAssistantChat(5)).toEqual([]);
  });

  it('keeps the conversation when the confirmation is cancelled', async () => {
    saveAssistantChat(5, THREAD);
    render(<AssistantView />);
    await screen.findByText('Where is my roadmap?');

    fireEvent.click(screen.getByRole('button', { name: 'Delete conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('Where is my roadmap?')).toBeTruthy();
    expect(loadAssistantChat(5)).toHaveLength(2);
  });
});
