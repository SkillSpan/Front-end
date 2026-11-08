/*
 * Company Settings — data layer.
 *
 * Wired to endpoints that exist in src/api.js:
 *   POST /api/v1/auth/logout-all           logoutAllDevices()   (AUTH-13)
 *   GET  /api/v1/notifications/preferences getNotificationsPreferences()  (NOT-02)
 *   PUT  /api/v1/notifications/preferences updateNotificationsPreferences()
 *
 * TODO(api): no endpoint exists yet for these — the forms validate on the
 * client and, outside preview, report "not available yet" instead of
 * pretending to save. Add the function to src/api.js and call it below:
 *   - Update representative account (name, phone):
 *       PATCH /api/v1/auth/me  { name, phone }            → saveAccount()
 *   - Change password (logged in):
 *       POST  /api/v1/auth/change-password
 *             { current_password, password, password_confirmation } → changePassword()
 *   - Deactivate organization account:
 *       POST  /api/v1/organizations/{id}/deactivate { reason } → deactivateAccount()
 * TODO(api): confirm the notification-preferences payload keys with the
 * backend (assumed below: new_applicant, project_status, messages).
 */
import {
  logoutAllDevices,
  getNotificationsPreferences,
  updateNotificationsPreferences,
} from '../../../api';

export const NOTIFICATION_KEYS = ['new_applicant', 'project_status', 'messages'];
export const DEFAULT_PREFS = { new_applicant: true, project_status: true, messages: true };

const delay = (ms) => new Promise((r) => { setTimeout(r, ms); });

export class NotAvailableError extends Error {
  constructor() { super('not_available'); this.code = 'not_available'; }
}

function unwrap(res) {
  return res?.data?.data ?? res?.data ?? res;
}

/** Server preferences → { key: boolean } for the keys this screen shows. */
export function readPrefs(res) {
  let body = unwrap(res);
  if (body && !Array.isArray(body) && typeof body === 'object' && body.preferences) body = body.preferences;
  const out = { ...DEFAULT_PREFS };
  if (Array.isArray(body)) {
    body.forEach((row) => {
      const key = row?.key ?? row?.category ?? row?.type;
      const on = row?.enabled ?? row?.in_app ?? row?.value;
      if (NOTIFICATION_KEYS.includes(key) && typeof on === 'boolean') out[key] = on;
    });
  } else if (body && typeof body === 'object') {
    NOTIFICATION_KEYS.forEach((key) => { if (typeof body[key] === 'boolean') out[key] = body[key]; });
  }
  return out;
}

export async function loadPrefs({ demo }) {
  if (demo) { await delay(250); return { ...DEFAULT_PREFS }; }
  return readPrefs(await getNotificationsPreferences());
}

export async function savePrefs(prefs, { demo }) {
  if (demo) { await delay(450); return prefs; }
  await updateNotificationsPreferences({ preferences: prefs });
  return prefs;
}

export async function saveAccount(values, { demo }) {
  if (demo) { await delay(500); return values; }
  throw new NotAvailableError();
}

export async function changePassword(values, { demo }) {
  if (demo) { await delay(600); return true; }
  throw new NotAvailableError();
}

export async function signOutEverywhere({ demo }) {
  if (demo) { await delay(400); return false; }
  await logoutAllDevices();
  return true;
}

export async function deactivateAccount(values, { demo }) {
  if (demo) { await delay(600); return true; }
  throw new NotAvailableError();
}

/** Same rules as RegisterStep1 / ResetPassword: required, ≥ 8 chars, confirm matches. */
export function validatePassword({ current, next, confirm }) {
  const e = {};
  if (!current) e.current = 'set.err.currentReq';
  if (!next) e.next = 'set.err.newReq';
  else if (next.length < 8) e.next = 'set.err.newLen';
  else if (current && next === current) e.next = 'set.err.newSame';
  if (!confirm) e.confirm = 'set.err.confirmReq';
  else if (next && confirm !== next) e.confirm = 'set.err.confirmMatch';
  return e;
}
