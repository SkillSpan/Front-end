/*
 * Company Settings — data layer.
 *
 * Wired to endpoints that exist in src/api.js:
 *   POST  /api/v1/auth/logout-all           logoutAllDevices()   (AUTH-13)
 *   GET   /api/v1/notifications/preferences getNotificationsPreferences()  (NOT-02)
 *   PUT   /api/v1/notifications/preferences updateNotificationsPreferences()
 *   PATCH /api/v1/auth/me                   updateMyAccount()
 *   POST  /api/v1/auth/change-password      changeMyPassword()
 *   POST  /api/v1/organizations/{id}/deactivate deactivateOrganization()
 *
 * Notification keys are confirmed with the backend: it stores them against the
 * categories that actually dispatch — new_applicant → application,
 * messages → message, project_status → project_status — and echoes the same
 * keys back in `key`, so readPrefs/savePrefs stay symmetrical.
 *
 * Server errors are thrown untouched ({status, code, message, errors}) so the
 * screens can map errors.current_password / errors.password / errors.reason
 * onto the fields.
 */
import {
  logoutAllDevices,
  getNotificationsPreferences,
  updateNotificationsPreferences,
  updateMyAccount,
  changeMyPassword,
  deactivateOrganization,
} from '../../../api';

export const NOTIFICATION_KEYS = ['new_applicant', 'project_status', 'messages'];
export const DEFAULT_PREFS = { new_applicant: true, project_status: true, messages: true };

const delay = (ms) => new Promise((r) => { setTimeout(r, ms); });

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
  const res = await updateMyAccount({ name: values.name, phone: values.phone || null });
  return unwrap(res)?.user ?? values;
}

export async function changePassword(values, { demo }) {
  if (demo) { await delay(600); return true; }
  await changeMyPassword({
    current_password: values.current_password,
    password: values.password,
    password_confirmation: values.password_confirmation,
  });
  return true;
}

export async function signOutEverywhere({ demo }) {
  if (demo) { await delay(400); return false; }
  await logoutAllDevices();
  return true;
}

export async function deactivateAccount(values, { demo }) {
  if (demo) { await delay(600); return true; }
  await deactivateOrganization(values.organizationId, {
    reason: values.reason || null,
  });
  return true;
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
