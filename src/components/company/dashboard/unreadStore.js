import { useSyncExternalStore } from 'react';

/*
 * One unread-notification count for the whole company workspace, so the bell
 * in the top bar, the sidebar badge, the dashboard panel and the
 * Notification History page always show the same number. `null` until a
 * screen has loaded it; the layout then falls back to `counts`.
 */
let unread = null;
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export const unreadStore = {
  get: () => unread,
  set(n) {
    const next = n == null ? null : Math.max(0, Number(n) || 0);
    if (next === unread) return;
    unread = next;
    emit();
  },
  adjust(delta) {
    if (unread == null) return;
    unreadStore.set(unread + delta);
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  reset() {
    unread = null;
    emit();
  },
};

export function useUnreadCount(fallback = 0) {
  const value = useSyncExternalStore(unreadStore.subscribe, unreadStore.get, unreadStore.get);
  return value ?? fallback ?? 0;
}
