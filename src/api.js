// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from './utils/cookies';
// Frontend API cache (src/cache): GET answers are reused / revalidated there,
// mutations clear related answers, and the cache is emptied whenever the
// session ends or the signed-in user / organization changes.
import { apiKey, clearQueryCache, currentLocale, fetchQuery, invalidateAfterMutation, setCacheScope } from './cache/queryCache';
import { SEND_ACCEPT_LANGUAGE, cacheRuleFor } from './cache/cacheConfig';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
// Laravel backend for local dev / staging / production. Trailing slashes
// are stripped so `${API_BASE_URL}${path}` never ends up with `//`.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
// The deployed Laravel API (US-COMP-03 / US-COMP-04 frontend guides, 02-11-2026):
// https://skillspan.alwaysdata.net, every route under /api/v1/. Local development
// falls back to it; production builds still read VITE_API_BASE_URL (see
// .env.example / .env.production) so a build can never silently call an old host.
// Note from the guide: the token is tied to the server — after switching the
// base URL, sign out and in again (the old token answers 401).
export const DEFAULT_API_BASE_URL = 'https://skillspan.alwaysdata.net';
export const API_BASE_URL = (configuredApiBaseUrl || (import.meta.env.DEV ? DEFAULT_API_BASE_URL : '')).replace(/\/+$/, '');

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;

// Listeners notified when the local session is cleared because the backend
// told us it's no longer valid (a 401 on an authenticated endpoint that
// proves the session, e.g. logout). AuthContext subscribes so it can drop
// its in-memory user state and bounce the user to the landing/login page.
const sessionExpiredListeners = new Set();

export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // ignore listener errors so one bad listener doesn't break the rest
    }
  });
}

// Called by screens that got a 401 from an endpoint that is not in
// isAuthEndpointRequiringSession() below (e.g. a company endpoint added later):
// same end state as the automatic handling — cookies cleared, AuthContext told,
// SessionExpired shown.
export function expireSession() {
  clearSession();
  notifySessionExpired();
}

// ---------------------------------------------------------------------------
// Session (cookie) helpers
// ---------------------------------------------------------------------------

export function saveSession({ token, user, organizations } = {}) {
  if (token) setCookie(TOKEN_COOKIE, token, SESSION_DAYS);
  if (user) {
    // A different user or organization → start from an empty cache.
    setCacheScope({ ...user, organizations: organizations || user.organizations || [] });
    setCookie(USER_COOKIE, JSON.stringify({ ...user, organizations: organizations || [] }), SESSION_DAYS);
  }
}

export function getToken() {
  return getCookie(TOKEN_COOKIE);
}

export function getStoredUser() {
  const raw = getCookie(USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// The cache belongs to whoever is signed in when the app loads.
setCacheScope(getToken() ? getStoredUser() : null);

export function isAuthenticated() {
  return !!getToken();
}

// Pulled in from the skill-matrix/career-roles branch merge - the backend
// user object shape has varied a bit across endpoints (id / user_id /
// learner_id / uuid), so this centralizes "which field is the learner's id"
// instead of every caller guessing.
export function resolveLearnerId(user) {
  return user?.id ?? user?.user_id ?? user?.learner_id ?? user?.uuid ?? null;
}

export function clearSession() {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
  // Logout / 401 / session expired: nothing cached may outlive the session.
  clearQueryCache();
  setCacheScope(null);
}

// Revokes the server-side session (if any) and then drops the local
// cookies. Network/5xx failures are swallowed - the local session is
// cleared regardless so the UI never gets stuck in a "logged in but
// backend says no" state.
export async function clearSessionAndRevoke() {
  try {
    await request('/api/v1/auth/logout', { method: 'POST', withAuth: true });
  } catch {
    // intentionally ignored - local cleanup must always run
  }
  clearSession();
  notifySessionExpired();
}

// ---------------------------------------------------------------------------
// Low level request helper
// ---------------------------------------------------------------------------

// Copy handed to plain callers, so a screen that edits a response object can
// never change the cached answer another screen gets.
const cloneData = (data) => {
  if (data == null || typeof data !== 'object') return data;
  try {
    return typeof structuredClone === 'function' ? structuredClone(data) : JSON.parse(JSON.stringify(data));
  } catch {
    return data;
  }
};

// request() = rawRequest() + the frontend API cache:
//  - GET on an endpoint whose rule in src/cache/cacheConfig.js says
//    `transport: true` reuses a FRESH cached answer and shares an identical
//    request that is already running (never a stale one; screens that want
//    stale-while-revalidate use the useCachedQuery hook). `cache: false`
//    skips it; a call with its own abort `signal` is never shared.
//  - a successful POST/PATCH/PUT/DELETE clears the related cached answers
//    (INVALIDATION_MAP in cacheConfig.js).
//  - any logout request empties the cache first.
async function request(path, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  if (String(path).startsWith('/api/v1/auth/logout')) clearQueryCache();
  if (method === 'GET' && options.cache !== false && !options.signal) {
    const rule = cacheRuleFor(path);
    if (rule?.transport) {
      const data = await fetchQuery(apiKey(path), () => rawRequest(path, options));
      return cloneData(data);
    }
  }
  const data = await rawRequest(path, options);
  if (method !== 'GET') invalidateAfterMutation(method, path);
  return data;
}

async function rawRequest(
  path,
  { method = 'GET', body, isFormData = false, withAuth = false, timeoutMs = 0, signal, headers: extraHeaders } = {},
) {
  if (!API_BASE_URL) {
    throw { status: 0, configuration: true, message: 'VITE_API_BASE_URL is missing. Configure the SkillSpan API URL before building for production.', errors: {} };
  }
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  // Off by default (src/cache/cacheConfig.js). When on, cache keys carry the
  // language too, so EN/AR answers are never mixed up.
  if (SEND_ACCEPT_LANGUAGE) headers['Accept-Language'] = currentLocale();
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  // Per-request extras, e.g. Idempotency-Key on Sprint 4 create / submit /
  // decision requests ("support safe retries", NFR-REL-03).
  if (extraHeaders) Object.assign(headers, extraHeaders);

  // Optional hard timeout + caller-provided cancel signal. Without this a
  // sleeping / unreachable backend leaves the fetch pending forever and the
  // UI stuck on a "loading" state.
  const controller = new AbortController();
  let timedOut = false;
  let timer;
  if (timeoutMs > 0) {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'omit',
      signal: controller.signal,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    if (timedOut) {
      throw {
        status: 0,
        timeout: true,
        message: 'The server is taking too long to respond. It may be starting up - please wait a few seconds and try again.',
        errors: {},
        cause: networkError,
      };
    }
    if (signal?.aborted) {
      throw { status: 0, aborted: true, message: 'Request cancelled.', errors: {}, cause: networkError };
    }
    throw {
      status: 0,
      message: 'Unable to reach the server. Check your internet connection, wait a few seconds (the server may be waking up) and try again.',
      errors: {},
      cause: networkError,
    };
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some responses (e.g. 204) may have no body.
  }

  if (!response.ok) {
    // 401 from an authenticated endpoint means the Laravel session/token
    // is no longer valid. Drop the local session and notify subscribers
    // (AuthContext) so the user is bounced to login. We exclude the
    // unauthenticated auth endpoints themselves - a 401 from /login is a
    // real "wrong password" error, not a session-expired event.
    if (response.status === 401 && withAuth && isAuthEndpointRequiringSession(path)) {
      clearSession();
      notifySessionExpired();
    }

    throw {
      status: response.status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || {},
      // Machine-readable error code + extra context (e.g. ASSESSMENT_ALREADY_EXISTS
      // carries the existing assessment id) - sent by the Laravel API.
      code: data.code,
      details: data.details,
    };
  }

  return data;
}

// Hosted backends on free tiers (e.g. Render) go to sleep when idle and need
// 30-60s to wake up; the first request then fails as a plain network error.
// This pings the Laravel health route (/up) and waits for it to answer.
// `no-cors` makes the ping independent of CORS - it only needs to know the
// server is up. Never throws.
export async function wakeUpApi({ timeoutMs = 60000 } = {}) {
  if (!API_BASE_URL) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(`${API_BASE_URL}/up`, { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Paths that prove the user is currently signed in (logout, profile, etc).
// A 401 from any of these means the session was revoked/expired and we
// should drop the local cookies + redirect to login.
function isAuthEndpointRequiringSession(path) {
  if (!path) return false;
  if (path.startsWith('/api/v1/auth/logout')) return true;
  if (path.startsWith('/api/v1/profile')) return true;
  // Company workspace (Sprint 4, US-COMP-03 Scenario 5): these only answer a
  // signed-in representative, so a 401 means the session is gone.
  if (path.startsWith('/api/v1/organization')) return true;
  if (path.startsWith('/api/v1/company')) return true;
  if (path.startsWith('/api/v1/notifications')) return true;
  // Sprint 4 project / application / team routes (US-PRJ-01/02, US-MATCH-03/04).
  if (path.startsWith('/api/v1/projects')) return true;
  if (path.startsWith('/api/v1/applications')) return true;
  if (path.startsWith('/api/v1/team-invitations')) return true;
  if (path.startsWith('/api/v1/rubrics')) return true;
  // Talent discovery (US-COMP-05/06/07).
  if (path.startsWith('/api/v1/talent')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

// Pre-flight duplicate-email check used by register step 1, so the user finds
// out right away (instead of at the very last step) that the email is taken.
// Resolves to { exists: boolean, message?: string }.
//
// Contract assumed (POST /api/v1/auth/check-email, body { email }):
//  - 200 with a flag such as { exists: true } / { available: false } /
//    { data: { exists: true } }, or
//  - 409 / 422 (optionally with errors.email) when the email is taken.
// Anything else (network error, timeout, 404, 5xx) is rethrown so the caller
// can decide to fail open - the final register request still validates it.
export const EMAIL_ALREADY_REGISTERED_MESSAGE =
  'This email is already registered. Please log in or use a different email.';

export async function checkEmail(email, { signal } = {}) {
  const firstString = (v) => (Array.isArray(v) ? v.find((x) => typeof x === 'string') : typeof v === 'string' ? v : undefined);
  try {
    const res = await request('/api/v1/auth/check-email', {
      method: 'POST',
      body: { email },
      timeoutMs: 20000,
      signal,
    });
    const d = (res && typeof res.data === 'object' && res.data) || res || {};
    const exists =
      d.exists === true ||
      d.taken === true ||
      d.registered === true ||
      d.is_registered === true ||
      d.email_exists === true ||
      d.available === false ||
      d.is_available === false;
    return { exists, message: exists ? firstString(d.message) || EMAIL_ALREADY_REGISTERED_MESSAGE : undefined };
  } catch (err) {
    if (err && (err.status === 409 || err.status === 422)) {
      return {
        exists: true,
        message: firstString(err.errors?.email) || err.message || EMAIL_ALREADY_REGISTERED_MESSAGE,
      };
    }
    throw err;
  }
}

// Registration uploads documents (multipart) and may hit a sleeping backend,
// so it gets a generous timeout and can be cancelled through `signal`.
export const REGISTER_ORGANIZATION_TIMEOUT_MS = 90000;

export const registerOrganization = (formData, { signal, timeoutMs = REGISTER_ORGANIZATION_TIMEOUT_MS } = {}) =>
  request('/api/v1/auth/register/organization', {
    method: 'POST',
    body: formData,
    isFormData: true,
    timeoutMs,
    signal,
  });

export const verifyOtp = (email, otp) =>
  request('/api/v1/auth/verify', { method: 'POST', body: { email, otp } });

export const resendOtp = (email) =>
  request('/api/v1/auth/resend-otp', { method: 'POST', body: { email } });

export const loginUser = (email, password) =>
  request('/api/v1/auth/login', { method: 'POST', body: { email, password } });

// Google Sign-In endpoints expected by the current frontend contract tests.
export const loginWithGoogle = (credential, termsAccepted = false, privacyAccepted = false, extra = {}) =>
  request('/api/v1/auth/login/google', {
    method: 'POST',
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      ...extra,
    },
  });

export const loginOrganization = (email, password) =>
  request('/api/v1/auth/login/organization', { method: 'POST', body: { email, password } });

export const forgotPassword = (email) =>
  request('/api/v1/auth/forgot-password', { method: 'POST', body: { email } });

export const resendForgotPassword = (email) =>
  request('/api/v1/auth/forgot-password/resend', { method: 'POST', body: { email } });

export const resetPassword = ({ email, otp, password, password_confirmation }) =>
  request('/api/v1/auth/reset-password', {
    method: 'POST',
    body: { email, otp, password, password_confirmation },
  });

// Alias used by VerifyCode.jsx
export const resendForgotPasswordOtp = resendForgotPassword;

export const verifyForgotPasswordOtp = (email, otp) =>
  request('/api/v1/auth/forgot-password/verify', {
    method: 'POST',
    body: { email, otp },
  });

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
// Confirmed against the backend's routes/api.php (see api_endpoints_render.md).
// Both require Authorization: Bearer {token}, which `request()` adds via withAuth.

// Revokes only the current session's token on the server.
export const logoutUser = () =>
  request('/api/v1/auth/logout', { method: 'POST', withAuth: true });

// Revokes every active session/token for this account (all devices).
export const logoutAllDevices = () =>
  request('/api/v1/auth/logout-all', { method: 'POST', withAuth: true });

// ---------------------------------------------------------------------------
// Account settings (company settings page)
// ---------------------------------------------------------------------------
// Confirmed against the backend's routes/api.php: PATCH /api/v1/auth/me and
// POST /api/v1/auth/change-password sit behind auth:sanctum + account.active,
// so any signed-in account can call them (company or learner).

// Updates the signed-in representative's own name / phone / locale.
export const updateMyAccount = (payload) =>
  request('/api/v1/auth/me', { method: 'PATCH', body: payload, withAuth: true });

// Changes the password. The backend verifies current_password, requires 8+
// characters and a value different from the current one, then revokes every
// OTHER token — this device stays signed in.
export const changeMyPassword = (payload) =>
  request('/api/v1/auth/change-password', { method: 'POST', body: payload, withAuth: true });

// Deactivates the company account. The backend records the reason, suspends
// the members and deletes their tokens, so every later call answers 401.
export const deactivateOrganization = (organizationId, payload = {}) =>
  request(`/api/v1/organizations/${organizationId}/deactivate`, {
    method: 'POST', body: payload, withAuth: true,
  });

// ---------------------------------------------------------------------------
// Learner profile (role:learner only)
// ---------------------------------------------------------------------------
// Confirmed against the backend's routes/api.php (see api_endpoints_render.md):
// POST/GET/PUT /api/v1/profile, all requiring Authorization: Bearer {token}.
//
// Confirmed field contract (learner-profile task):
//   university_name            (free text - university name)
//   student_university_number  (free text - learner's student/university ID)
//   specialization             (free text - specialization name)
//   academic_level
//   expected_graduation        (YYYY-MM-DD)
//   bio
//   visibility                 (public | organization_only | private)
// NOTE: POST is an upsert; a StudentProfile row is created at registration,
// so POST fills/updates the existing row (200) or creates one (201) instead
// of rejecting with "already exists". The frontend can always POST the full
// profile data during onboarding (LearnerProfileSetup.jsx).
export const getProfile = () => request('/api/v1/profile', { method: 'GET', withAuth: true });

export const createProfile = (payload) =>
  request('/api/v1/profile', { method: 'POST', body: payload, withAuth: true });

export const updateProfile = (payload) =>
  request('/api/v1/profile', { method: 'PUT', body: payload, withAuth: true });

// Learner profile photo — mirrors the panel admin avatar (decode / centre-crop
// / re-encode on the backend). Upload is multipart; the raw image is fetched as
// a blob because the serve route is auth-protected and can't be used as an
// <img src> with a bearer header.
export const uploadProfileAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return request('/api/v1/profile/avatar', {
    method: 'POST',
    body: form,
    isFormData: true,
    withAuth: true,
    timeoutMs: 60000,
  });
};

export const deleteProfileAvatar = () =>
  request('/api/v1/profile/avatar', { method: 'DELETE', withAuth: true });

export const fetchProfileAvatarUrl = async () => {
  const token = getToken();
  if (!API_BASE_URL || !token) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/profile/avatar`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'omit',
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Baseline Assessments (role:learner only, requires Authorization: Bearer {token})
// ---------------------------------------------------------------------------
// Confirmed against SkillSpan_New_Endpoints.pdf (an addendum to
// api_endpoints_render.md - these routes come straight from routes/api.php
// and are not documented anywhere else). Drives the Baseline Skill
// Assessment flow in AssessmentWizard.jsx / SkillAssessment.jsx:
//  1. startBaselineAssessment()                - POST, begins a new attempt,
//                                                returns { assessment id }
//  2. getBaselineAssessment(id)                - GET,  fetch one attempt
//  3. autosaveBaselineAssessment(id, payload)  - PATCH, save progress
//                                                before final submission
//  4. submitBaselineAssessment(id)             - POST, final submit +
//                                                server-side score/skill
//                                                calculation
// ⚠️ Exact response/request field names are NOT confirmed with the backend
// team yet (the PDF only lists method+path+description, no schemas) -
// callers should treat the response shape defensively and keep a local
// fallback (see assessmentStorage.js) until this is confirmed in writing.

// payload: { specialization_id, career_role_id } - the backend picks the
// questions itself (career_role_skills -> baseline_assessment_items), the
// frontend never queries the question bank directly.
export const startBaselineAssessment = (payload) =>
  request('/api/v1/baseline-assessments', { method: 'POST', body: payload, withAuth: true });

export const getBaselineAssessment = (assessmentId) =>
  request(`/api/v1/baseline-assessments/${assessmentId}`, { method: 'GET', withAuth: true });

// Autosave (progress save before submission) - PATCH per the addendum.
export const autosaveBaselineAssessment = (assessmentId, payload) =>
  request(`/api/v1/baseline-assessments/${assessmentId}`, {
    method: 'PATCH',
    body: payload,
    withAuth: true,
  });

// Final submit - locks the attempt in and triggers score calculation.
export const submitBaselineAssessment = (assessmentId, responses) =>
  request(`/api/v1/baseline-assessments/${assessmentId}/submit`, { method: 'POST', body: { responses }, withAuth: true });

// ---------------------------------------------------------------------------
// Reference data / dropdowns (public - no token required)
// ---------------------------------------------------------------------------
// Confirmed against SkillSpan_New_Endpoints.pdf. Used to populate the
// University / Specialization / Country dropdowns in LearnerProfileSetup.jsx
// instead of the previous hardcoded lists.

export const getUniversities = () => request('/api/v1/reference/universities', { method: 'GET' });

export const getSpecializations = () => request('/api/v1/reference/specializations', { method: 'GET' });

export const getCountries = () => request('/api/v1/reference/countries', { method: 'GET' });

// Universities for one specific country only.
export const getUniversitiesByCountry = (country) =>
  request(`/api/v1/reference/countries/${encodeURIComponent(country)}/universities`, { method: 'GET' });

// ---------------------------------------------------------------------------
// Skills (requires Authorization: Bearer {token})
// ---------------------------------------------------------------------------
// Confirmed against SkillSpan_New_Endpoints.pdf. The Skill Matrix is what
// SkillAssessmentResults.jsx calls "Initializing Skill Matrix" (BR-11) -
// getSkillsMatrix() is used there to prefer the server-calculated matrix
// over the locally-computed one whenever it's available.

export const getSkillsTaxonomy = () => request('/api/v1/skills/taxonomy', { method: 'GET', withAuth: true });

export const getSkillsMatrix = () => request('/api/v1/skills/matrix', { method: 'GET', withAuth: true });

export const addSkillToMatrix = (payload) =>
  request('/api/v1/skills/matrix', { method: 'POST', body: payload, withAuth: true });

export const updateSkillMatrixEntry = (id, payload) =>
  request(`/api/v1/skills/matrix/${id}`, { method: 'PUT', body: payload, withAuth: true });

// Removes a skill from the signed-in learner's matrix.
//   DELETE /api/v1/learner/skills/{skill_id}
// `skillId` is the id from the `skills` table (e.g. 20 for Python), NOT the
// learner_skills row id. The learner comes from the token, so no learner_id is
// sent. Only the learner<->skill link is removed, never the skill itself.
// (DELETE /api/v1/skills/matrix/{id} is not supported by the backend - PUT only.)
export const deleteLearnerSkill = (skillId) =>
  request(`/api/v1/learner/skills/${skillId}`, { method: 'DELETE', withAuth: true });

// Alias for addSkillToMatrix - same endpoint, kept under this name because
// it's what SkillMatrix.jsx / careerRolesApi.js (merged in from the
// skill-matrix/career-roles branch) import. It's an upsert server-side
// (unique on learner_id + skill_id, see SkillsController@store), not a
// strict create.
export const upsertSkillMatrix = addSkillToMatrix;

// ---------------------------------------------------------------------------
// Evidence (requires Authorization: Bearer {token})
// ---------------------------------------------------------------------------
// Confirmed against SkillSpan_Full_API_Reference.pdf / EvidenceController.

// payload should be FormData when sending evidence_file, or a plain object
// when sending evidence_url instead - pass isFormData accordingly.
// role:learner.
export const submitEvidence = (payload, isFormData = false) =>
  request('/api/v1/evidence', { method: 'POST', body: payload, isFormData, withAuth: true });

// role:learner - returns only the current user's *verified* evidence.
export const getMyEvidence = () => request('/api/v1/evidence', { method: 'GET', withAuth: true });

// ⚠️ No ownership/role check on this one server-side - any signed-in user
// can fetch any evidence record by id. Flagged, not fixed here (backend
// issue) - don't rely on this endpoint alone to gate access to a record's
// contents in the UI.
export const getEvidenceById = (id) => request(`/api/v1/evidence/${id}`, { method: 'GET', withAuth: true });

// role:admin - accept/reject; does NOT recalculate the skill's level/
// confidence automatically (see SKL-06 in the SRS - that's a separate step).
export const reviewEvidence = (id, verificationStatus, reviewerNotes) =>
  request(`/api/v1/evidence/${id}/review`, {
    method: 'PUT',
    body: { verification_status: verificationStatus, reviewer_notes: reviewerNotes },
    withAuth: true,
  });

// ---------------------------------------------------------------------------
// Career roles (requires Authorization: Bearer {token}, role:learner)
// ---------------------------------------------------------------------------
// Confirmed against CareerRoleController.php - GET /, GET /{id}, and
// GET /{id}/skills are all implemented and registered under
// prefix('career-roles'). Only approved career roles are ever returned;
// an existing-but-unapproved role responds 422 (code CAREER_ROLE_NOT_APPROVED),
// a missing one 404 (CAREER_ROLE_NOT_FOUND) - see careerRolesApi.js for how
// those surface in the UI.

// page/perPage are optional - only sent when provided.
export const getCareerRoles = ({ page, perPage, specializationId, search } = {}) => {
  const params = new URLSearchParams();
  // GET /api/v1/career-roles?specialization_id=5 - only the roles linked to
  // that specialization (career_role_specialization).
  if (specializationId) params.set('specialization_id', specializationId);
  // Applied server-side, BEFORE pagination. Filtering the loaded page instead
  // only ever searched the first 15 rows, so a role on page 2 was unreachable.
  if (search && String(search).trim()) params.set('search', String(search).trim());
  if (page) params.set('page', page);
  if (perPage) params.set('per_page', perPage);
  const qs = params.toString();
  return request(`/api/v1/career-roles${qs ? `?${qs}` : ''}`, { method: 'GET', withAuth: true });
};

export const getCareerRoleById = (id) =>
  request(`/api/v1/career-roles/${id}`, { method: 'GET', withAuth: true });

export const getSavedCareerRoles = () =>
  request('/api/v1/saved-career-roles', { method: 'GET', withAuth: true, cache: false });

export const setCareerRoleSaved = (id, saved) =>
  request(`/api/v1/saved-career-roles/${id}`, { method: saved ? 'PUT' : 'DELETE', withAuth: true });

export const getCareerRoleSkills = (id) =>
  request(`/api/v1/career-roles/${id}/skills`, { method: 'GET', withAuth: true });

// ---------------------------------------------------------------------------
// Learner inbox (requires Authorization: Bearer {token}, role:learner)
// Read-only by contract: companies write, the learner reads. There is no
// reply, accept or decline endpoint on purpose.
// ---------------------------------------------------------------------------

export const getLearnerMessages = ({ page, perPage } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (perPage) params.set('per_page', perPage);
  const qs = params.toString();
  return request(`/api/v1/learner/messages${qs ? `?${qs}` : ''}`, { method: 'GET', withAuth: true });
};

// ---------------------------------------------------------------------------
// Readiness (requires Authorization: Bearer {token}, role:learner)
// ---------------------------------------------------------------------------

export const calculateReadiness = (payload) =>
  request('/api/v1/readiness/calculate', { method: 'POST', body: payload, withAuth: true });

// A learner who has never calculated readiness has no snapshot, and the API
// answers that with 404 READINESS_NOT_FOUND (ReadinessController::latest). That
// is the normal first-run state, not a failure, so it resolves to `null` instead
// of rejecting: callers can then keep the rest of the page and show "not
// calculated yet" rather than an error banner. Every other status still throws.
export const getLatestReadiness = () =>
  request('/api/v1/readiness/latest', { method: 'GET', withAuth: true })
    .catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });


// ---------------------------------------------------------------------------
// Learner workspace APIs (API handoff 29-09-2026)
// ---------------------------------------------------------------------------
export const getApplications = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/applications${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const updateApplication = (projectId, applicationId, payload = {}) =>
  request(`/api/v1/projects/${projectId}/applications/${applicationId}`, { method: 'PATCH', body: payload, withAuth: true });
export const withdrawApplication = (applicationId) =>
  request(`/api/v1/applications/${applicationId}/withdraw`, { method: 'POST', withAuth: true });
export const getProjects = () => request('/api/v1/projects', { withAuth: true });
export const getProject = (id) => request(`/api/v1/projects/${id}`, { withAuth: true });
export const applyToProject = (projectId, payload = {}) =>
  request(`/api/v1/projects/${projectId}/applications`, { method: 'POST', body: payload, withAuth: true });
export const matchProject = (projectId, payload = {}) =>
  request(`/api/v1/projects/${projectId}/match`, { method: 'POST', body: payload, withAuth: true });

// Talent Discovery returns discoverable students for approved company admins (GET /api/v1/talent)
export const getTalentDiscovery = ({ page, perPage, search, career_role, min_readiness, sort } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (perPage) params.set('per_page', perPage);
  if (search) params.set('search', search);
  if (career_role) params.set('career_role', career_role);
  if (min_readiness !== undefined && min_readiness !== null && min_readiness !== '') {
    params.set('min_readiness', min_readiness);
  }
  if (sort) params.set('sort', sort);
  const qs = params.toString();
  return request(`/api/v1/talent${qs ? `?${qs}` : ''}`, { method: 'GET', withAuth: true });
};

export const getTalentFilters = () => request('/api/v1/talent/filters', { method: 'GET', withAuth: true });

export const getTalentStudent = (studentId) =>
  request(`/api/v1/talent/${studentId}`, { method: 'GET', withAuth: true });


export const getRecommendations = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/recommendations${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const submitRecommendationFeedback = (id, payload) =>
  request(`/api/v1/recommendations/${id}/feedback`, { method: 'POST', body: payload, withAuth: true });
// `options` carries a timeout for callers that block a progress screen on the
// result (the assessment submit does); the Data Science round trip is the
// slowest call in the product and must not hang a page forever.
export const calculateIntelligence = (payload = {}, options = {}) =>
  request('/api/v1/intelligence/calculate', { method: 'POST', body: payload, withAuth: true, ...options });
// Same contract as getLatestReadiness: 404 = "no intelligence snapshot yet"
// (IntelligenceController::latest), which is a first-run state. Resolves to
// `null`; any other failure still propagates.
export const getLatestIntelligence = () =>
  request('/api/v1/intelligence/latest', { withAuth: true })
    .catch((error) => {
      if (error?.status === 404) return null;
      throw error;
    });
export const calculateReadinessScore = (payload = {}) =>
  request('/api/v1/readiness/calculate', { method: 'POST', body: payload, withAuth: true });
export const askAssistant = (payload) =>
  request('/api/v1/assistant/ask', { method: 'POST', body: payload, withAuth: true });
export const reportAssistantInteraction = (id, payload) =>
  request(`/api/v1/assistant/interactions/${id}/report`, { method: 'PUT', body: payload, withAuth: true });
export const createSupportRequest = (payload = {}) =>
  request('/api/v1/support/requests', { method: 'POST', body: payload, withAuth: true });
export const getSupportRequests = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/support/requests${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const getSupportRequest = (id) => request(`/api/v1/support/requests/${id}`, { withAuth: true });
export const sendSupportMessage = (id, body) =>
  request(`/api/v1/support/requests/${id}/messages`, { method: 'POST', body: { body }, withAuth: true });
export const getMentorConnections = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/mentor/connections${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const createMentorConnection = (payload) => request('/api/v1/mentor/connections', { method: 'POST', body: payload, withAuth: true });
export const updateMentorConnection = (id, payload) => request(`/api/v1/mentor/connections/${id}`, { method: 'PATCH', body: payload, withAuth: true });
export const getMentorStudents = () => request('/api/v1/mentor/students', { withAuth: true });
export const getConversations = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/conversations${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
// GET /api/v1/notifications?page=&per_page=&unread=1 (US-COMP-03 guide §6):
// per_page is capped at 50 by the server (a bigger number answers 50, no error);
// `unread=1` is the filter name (the older unread_only=1 still works).
// The answer carries meta.unread_count, so the bell needs no second request.
export const getNotifications = ({ page, perPage, unread } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  if (unread) q.set('unread', '1');
  return request(`/api/v1/notifications${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
// → { data: { unread_count } } (US-COMP-03 guide §2, row 6).
export const getUnreadNotificationCount = () => request('/api/v1/notifications/unread-count', { withAuth: true });
export const markAllNotificationsRead = () => request('/api/v1/notifications/read-all', { method: 'POST', withAuth: true });
export const markNotificationRead = (id) => request(`/api/v1/notifications/${id}/read`, { method: 'POST', withAuth: true });
// US-COMP-03 guide §6: PATCH /api/v1/notifications/{id}/read is the verb to use
// (200 on success, 404 when the notification is not the current user's; safe to
// repeat). POST on the same path still works, so the learner screens above keep it.
export const patchNotificationRead = (id) => request(`/api/v1/notifications/${id}/read`, { method: 'PATCH', withAuth: true });

/**
 * Authenticated JSON request for the Sprint 4 company modules
 * (src/components/company/projects|applications|team/*Api.js). Each module
 * keeps its own endpoint constants, so re-pointing a route is a one-line
 * change there. Same client as every other call: Bearer token, 401 ->
 * session expired, cache invalidation, api.js error shape.
 */
export const companyRequest = (path, { method = 'GET', body, headers, cache } = {}) =>
  request(path, { method, body, headers, cache, withAuth: true });

export function unwrapApiData(payload) {
  return payload?.data?.data ?? payload?.data ?? payload;
}

// GET /api/v1/organization/profile — the dashboard's organization card
// (US-COMP-03 guide §5): now carries profile_completeness (0–100) and
// profile_fields [{ key, done }]. Still answered; same payload as /profile/me.
export const getOrganizationProfile = () => request('/api/v1/organization/profile', { withAuth: true });

// GET /api/v1/company/dashboard (US-COMP-03 guide §3/§8) — every number is
// computed by the server; the frontend sums nothing.
// → { data: { counts, permissions, tasks, projectStates, recentProjects, funnel } }
export const getCompanyDashboard = () =>
  request('/api/v1/company/dashboard', { withAuth: true });

// ---------------------------------------------------------------------------
// Organization Profile (Sprint 4, US-COMP-04) — US-COMP-04 frontend guide
// ---------------------------------------------------------------------------
// GET   /api/v1/profile/me                       → the whole organization profile
// PATCH /api/v1/profile/me                       → partial update (changed fields only)
// POST  /api/v1/company/profile/documents        → multipart: type + file (upload / replace)
// GET   /api/v1/company/profile/documents/{id}   → the file itself (attachment)
// All need Bearer <token>, a company_admin account and a verified organization.
// Field mapping and the 422 → field-error handling:
// src/components/company/profile/companyProfileApi.js
export const getCompanyProfile = () => request('/api/v1/profile/me', { withAuth: true });
export const updateCompanyProfile = (payload) =>
  request('/api/v1/profile/me', { method: 'PATCH', body: payload, withAuth: true });

// Downloads a document through its ready-made `url` (documents.*.url, e.g.
// /api/v1/company/profile/documents/5 — the guide says not to build it
// ourselves). Returns { blob, filename }. 404 → DOCUMENT_NOT_FOUND /
// DOCUMENT_UNAVAILABLE (thrown with the usual { status, code, message } shape).
export async function downloadCompanyDocument(url) {
  if (!API_BASE_URL) {
    throw { status: 0, configuration: true, message: 'VITE_API_BASE_URL is missing. Configure the SkillSpan API URL before building for production.', errors: {} };
  }
  const path = /^https?:\/\//i.test(url) ? url : `${API_BASE_URL}${url}`;
  const headers = { Accept: 'application/json, application/octet-stream, */*' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(path, { method: 'GET', headers, credentials: 'omit' });
  } catch (cause) {
    throw { status: 0, message: 'Unable to reach the server. Check your internet connection and try again.', errors: {}, cause };
  }
  if (!response.ok) {
    let data = {};
    try { data = await response.json(); } catch { /* binary or empty body */ }
    if (response.status === 401) {
      clearSession();
      notifySessionExpired();
    }
    throw { status: response.status, code: data.code, message: data.message || 'Something went wrong. Please try again.', errors: data.errors || {} };
  }
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : '';
  return { blob: await response.blob(), filename };
}

// Multipart upload with progress. fetch() cannot report upload progress, so
// this one uses XMLHttpRequest — same error shape and same 401 handling as
// request() above.
export function uploadCompanyProfileDocument(formData, { onProgress, signal } = {}) {
  const path = '/api/v1/company/profile/documents';
  return new Promise((resolve, reject) => {
    if (!API_BASE_URL) {
      reject({ status: 0, configuration: true, message: 'VITE_API_BASE_URL is missing. Configure the SkillSpan API URL before building for production.', errors: {} });
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (SEND_ACCEPT_LANGUAGE) xhr.setRequestHeader('Accept-Language', currentLocale());
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }
    if (signal) {
      if (signal.aborted) { reject({ status: 0, aborted: true, message: 'Request cancelled.', errors: {} }); return; }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }
    xhr.onabort = () => reject({ status: 0, aborted: true, message: 'Request cancelled.', errors: {} });
    xhr.onerror = () => reject({
      status: 0,
      message: 'Unable to reach the server. Check your internet connection, wait a few seconds (the server may be waking up) and try again.',
      errors: {},
    });
    xhr.onload = () => {
      let data;
      try { data = xhr.responseText ? JSON.parse(xhr.responseText) : {}; } catch { data = {}; }
      if (xhr.status >= 200 && xhr.status < 300) {
        invalidateAfterMutation('POST', path); // profile + dashboard (cacheConfig.js)
        resolve(data);
        return;
      }
      if (xhr.status === 401 && isAuthEndpointRequiringSession(path)) {
        clearSession();
        notifySessionExpired();
      }
      reject({
        status: xhr.status,
        message: data.message || 'Something went wrong. Please try again.',
        errors: data.errors || {},
        code: data.code,
        details: data.details,
      });
    };
    xhr.send(formData);
  });
}
export const getNotificationsPreferences = () => request('/api/v1/notifications/preferences', { withAuth: true });
export const updateNotificationsPreferences = (payload) => request('/api/v1/notifications/preferences', { method: 'PUT', body: payload, withAuth: true });
export const getConversation = (id) => request(`/api/v1/conversations/${id}`, { withAuth: true });
export const getConversationMessages = (id, { page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/conversations/${id}/messages${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const sendConversationMessage = (id, payload) => request(`/api/v1/conversations/${id}/messages`, { method: 'POST', body: payload, withAuth: true });
export const getChatbotMessages = (id, { page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/conversations/${id}/chatbot/messages${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const sendChatbotMessage = (id, payload) => request(`/api/v1/conversations/${id}/chatbot/messages`, { method: 'POST', body: payload, withAuth: true });
export const markConversationRead = (id) => request(`/api/v1/conversations/${id}/read`, { method: 'POST', withAuth: true });
// Removes the conversation from the caller's own list only. It is not a delete:
// the other participant keeps the thread and the audit records, and the
// conversation reappears as soon as a new message arrives.
export const hideConversation = (id) => request(`/api/v1/conversations/${id}`, { method: 'DELETE', withAuth: true });
export const getConversationStatus = (id) => request(`/api/v1/conversations/${id}/status`, { withAuth: true });
export const createConversation = (connectionId, payload = {}) => request(`/api/v1/connections/${connectionId}/conversations`, { method: 'POST', body: payload, withAuth: true });
