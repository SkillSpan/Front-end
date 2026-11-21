import { describe, it, expect, beforeEach } from 'vitest';

import {
  clearAssistantChat,
  loadAssistantChat,
  saveAssistantChat,
} from '../assistantChatStorage';

const THREAD = [
  { id: 'u1', role: 'user', type: 'text', text: 'Where is my roadmap?', ts: '10:00' },
  { id: 'a1', role: 'assistant', type: 'text', text: 'Your roadmap is being generated.', ts: '10:00' },
];

beforeEach(() => {
  window.localStorage.clear();
});

describe('assistant chat storage', () => {
  it('round-trips a conversation', () => {
    saveAssistantChat(5, THREAD);
    expect(loadAssistantChat(5)).toEqual(THREAD);
  });

  it('keeps each learner on their own thread', () => {
    saveAssistantChat(5, THREAD);
    saveAssistantChat(9, [{ id: 'u2', role: 'user', text: 'Something else', ts: '11:00' }]);

    expect(loadAssistantChat(5)).toHaveLength(2);
    expect(loadAssistantChat(9)).toHaveLength(1);
    expect(loadAssistantChat(7)).toEqual([]);
  });

  it('removes the entry when the conversation is deleted', () => {
    saveAssistantChat(5, THREAD);
    clearAssistantChat(5);

    expect(loadAssistantChat(5)).toEqual([]);
    expect(Object.keys(window.localStorage).filter((k) => k.includes('assistant.chat'))).toHaveLength(0);
  });

  it('drops the entry when saving an empty conversation', () => {
    saveAssistantChat(5, THREAD);
    saveAssistantChat(5, []);

    expect(loadAssistantChat(5)).toEqual([]);
  });

  it('survives a corrupt entry instead of throwing', () => {
    window.localStorage.setItem('skillspan.assistant.chat.v1.5', '{not json');

    expect(loadAssistantChat(5)).toEqual([]);
    // The bad value is cleared so the next write starts clean.
    expect(window.localStorage.getItem('skillspan.assistant.chat.v1.5')).toBeNull();
  });

  it('ignores entries that are older than a week', () => {
    window.localStorage.setItem(
      'skillspan.assistant.chat.v1.5',
      JSON.stringify({ version: 1, savedAt: Date.now() - 8 * 24 * 60 * 60 * 1000, messages: THREAD }),
    );

    expect(loadAssistantChat(5)).toEqual([]);
  });

  it('keeps only the most recent messages', () => {
    const many = Array.from({ length: 120 }, (_, index) => ({
      id: `m${index}`,
      role: index % 2 === 0 ? 'user' : 'assistant',
      text: `message ${index}`,
      ts: '10:00',
    }));

    saveAssistantChat(5, many);
    const restored = loadAssistantChat(5);

    expect(restored).toHaveLength(80);
    expect(restored[restored.length - 1].text).toBe('message 119');
  });
});
