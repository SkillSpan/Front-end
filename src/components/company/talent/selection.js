import { useSyncExternalStore } from 'react';
import { COMPARE_MAX } from './talentApi';

/*
 * Candidates picked for comparison (US-COMP-06 Scenario 2). Kept for this tab
 * (sessionStorage) so moving between search, a summary and back keeps the pick.
 * Only ids are stored — nothing about the candidate.
 */
const KEY = 'skillspan.talent.compare.v1';
const listeners = new Set();
let ids = (() => {
  try { return JSON.parse(window.sessionStorage.getItem(KEY) || '[]').slice(0, COMPARE_MAX); } catch { return []; }
})();
const emit = () => { try { window.sessionStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ } listeners.forEach((l) => l()); };

export const compareSelection = {
  get: () => ids,
  has: (id) => ids.includes(String(id)),
  toggle(id) {
    const k = String(id);
    if (ids.includes(k)) ids = ids.filter((x) => x !== k);
    else if (ids.length < COMPARE_MAX) ids = [...ids, k];
    else return false;
    emit();
    return true;
  },
  set(next) { ids = next.map(String).slice(0, COMPARE_MAX); emit(); },
  clear() { ids = []; emit(); },
  subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
};

export function useCompareSelection() {
  return useSyncExternalStore(compareSelection.subscribe, compareSelection.get, compareSelection.get);
}
