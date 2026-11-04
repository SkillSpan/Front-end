// The assistant thread lived in React state only, so any reload — or simply
// navigating away and back — threw the conversation away. It is now kept in the
// browser, keyed per learner.
//
// Why localStorage rather than a cookie: a cookie is capped at ~4 KB and is
// attached to every single request to the API, so a 40-message thread would
// either be truncated or start bloating every call. The chat never needs to
// reach the server — it is a convenience copy of what the learner already sees.
const STORE_KEY = "skillspan.assistant.chat.v1";

// Enough history to feel continuous without letting the entry grow unbounded.
const MAX_MESSAGES = 80;

// A week-old conversation is stale enough that restoring it is confusing.
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function storageKey(userId) {
  const id = userId == null ? "" : String(userId).trim();
  return id ? `${STORE_KEY}.${id}` : STORE_KEY;
}

function isMessage(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value.role === "user" || value.role === "assistant"),
  );
}

function readStorage() {
  try {
    return window.localStorage;
  } catch {
    // Private mode / blocked storage — the chat still works, it just will not
    // survive a reload.
    return null;
  }
}

export function loadAssistantChat(userId) {
  if (typeof window === "undefined") return [];
  const store = readStorage();
  if (!store) return [];

  const key = storageKey(userId);

  try {
    const raw = store.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt) || 0;
    if (savedAt && Date.now() - savedAt > MAX_AGE_MS) {
      store.removeItem(key);
      return [];
    }

    const rows = Array.isArray(parsed?.messages) ? parsed.messages : [];
    return rows.filter(isMessage).slice(-MAX_MESSAGES);
  } catch {
    // A corrupt entry must never stop the assistant from opening.
    store.removeItem(key);
    return [];
  }
}

export function saveAssistantChat(userId, messages) {
  if (typeof window === "undefined") return;
  const store = readStorage();
  if (!store) return;

  const rows = (Array.isArray(messages) ? messages : []).filter(isMessage).slice(-MAX_MESSAGES);

  try {
    if (!rows.length) {
      store.removeItem(storageKey(userId));
      return;
    }
    store.setItem(
      storageKey(userId),
      JSON.stringify({ version: 1, savedAt: Date.now(), messages: rows }),
    );
  } catch {
    // Quota exceeded: drop the stored copy rather than throwing on every send.
    try {
      store.removeItem(storageKey(userId));
    } catch {
      /* nothing else to do */
    }
  }
}

export function clearAssistantChat(userId) {
  if (typeof window === "undefined") return;
  const store = readStorage();
  if (!store) return;
  try {
    store.removeItem(storageKey(userId));
  } catch {
    /* nothing else to do */
  }
}
