// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from './utils/cookies';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
<<<<<<< HEAD
// Laravel backend for local dev / staging / production.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://back-end-zdip.onrender.com';
=======
// Laravel backend for local dev / staging / production. Trailing slashes
// are stripped so `${API_BASE_URL}${path}` never ends up with `//`.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://back-end-zdip.onrender.com').replace(/\/+$/, '');
>>>>>>> feature-my-work

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;

<<<<<<< HEAD
=======
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

>>>>>>> feature-my-work
// ---------------------------------------------------------------------------
// Session (cookie) helpers
// ---------------------------------------------------------------------------

export function saveSession({ token, user, organizations } = {}) {
  if (token) setCookie(TOKEN_COOKIE, token, SESSION_DAYS);
  if (user) {
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

export function isAuthenticated() {
  return !!getToken();
}

export function clearSession() {
  removeCookie(TOKEN_COOKIE);
  removeCookie(USER_COOKIE);
}

<<<<<<< HEAD
=======
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

>>>>>>> feature-my-work
// ---------------------------------------------------------------------------
// Low level request helper
// ---------------------------------------------------------------------------

<<<<<<< HEAD
async function request(path, { method = 'GET', body, isFormData = false, withAuth = false } = {}) {
=======
async function request(
  path,
  { method = 'GET', body, isFormData = false, withAuth = false, timeoutMs = 0, signal } = {},
) {
>>>>>>> feature-my-work
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

<<<<<<< HEAD
=======
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

>>>>>>> feature-my-work
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
<<<<<<< HEAD
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
=======
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
>>>>>>> feature-my-work
    throw {
      status: 0,
      message: 'Unable to reach the server. Please check your internet connection and try again.',
      errors: {},
      cause: networkError,
    };
<<<<<<< HEAD
=======
  } finally {
    if (timer) clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
>>>>>>> feature-my-work
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some responses (e.g. 204) may have no body.
  }

  if (!response.ok) {
<<<<<<< HEAD
=======
    // 401 from an authenticated endpoint means the Laravel session/token
    // is no longer valid. Drop the local session and notify subscribers
    // (AuthContext) so the user is bounced to login. We exclude the
    // unauthenticated auth endpoints themselves - a 401 from /login is a
    // real "wrong password" error, not a session-expired event.
    if (response.status === 401 && withAuth && isAuthEndpointRequiringSession(path)) {
      clearSession();
      notifySessionExpired();
    }

>>>>>>> feature-my-work
    throw {
      status: response.status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || {},
    };
  }

  return data;
}

<<<<<<< HEAD
=======
// Paths that prove the user is currently signed in (logout, profile, etc).
// A 401 from any of these means the session was revoked/expired and we
// should drop the local cookies + redirect to login.
function isAuthEndpointRequiringSession(path) {
  if (!path) return false;
  if (path.startsWith('/api/v1/auth/logout')) return true;
  if (path.startsWith('/api/v1/profile')) return true;
  return false;
}

>>>>>>> feature-my-work
// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

<<<<<<< HEAD
export const registerOrganization = (formData) =>
  request('/api/v1/auth/register/organization', { method: 'POST', body: formData, isFormData: true });
=======
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
>>>>>>> feature-my-work

export const verifyOtp = (email, otp) =>
  request('/api/v1/auth/verify', { method: 'POST', body: { email, otp } });

export const resendOtp = (email) =>
  request('/api/v1/auth/resend-otp', { method: 'POST', body: { email } });

export const loginUser = (email, password) =>
  request('/api/v1/auth/login', { method: 'POST', body: { email, password } });

// Google Sign-In endpoints expected by the current frontend contract tests.
export const loginWithGoogle = (credential, termsAccepted = false, privacyAccepted = false, extra = {}) =>
  request('/api/auth/login/google', {
    method: 'POST',
    body: {
      credential,
      terms_accepted: termsAccepted,
      privacy_accepted: privacyAccepted,
      ...extra,
    },
  });

export const loginOrganizationWithGoogle = (credential) =>
  request('/api/auth/login/organization/google', {
    method: 'POST',
    body: {
      credential,
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

// ---------------------------------------------------------------------------
// Baseline Assessments (role:learner only, requires Authorization: Bearer {token})
// ---------------------------------------------------------------------------
// Confirmed against SkillSpan_New_Endpoints.pdf (an addendum to
// api_endpoints_render.md - these routes come straight from routes/api.php
// and are not documented anywhere else). Drives the Baseline Skill
// Assessment flow in AssessmentWizard.jsx / SkillAssessment.jsx:
//   1. startBaselineAssessment()               - POST, begins a new attempt,
//                                                 returns { assessment id }
//   2. getBaselineAssessment(id)                - GET,  fetch one attempt
//   3. autosaveBaselineAssessment(id, payload)  - PATCH, save progress
//                                                 before final submission
//   4. submitBaselineAssessment(id)             - POST, final submit +
//                                                 server-side score/skill
//                                                 calculation
// ⚠️ Exact response/request field names are NOT confirmed with the backend
// team yet (the PDF only lists method+path+description, no schemas) -
// callers should treat the response shape defensively and keep a local
// fallback (see assessmentStorage.js) until this is confirmed in writing.

export const startBaselineAssessment = () =>
  request('/api/v1/baseline-assessments', { method: 'POST', withAuth: true });

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
export const submitBaselineAssessment = (assessmentId) =>
  request(`/api/v1/baseline-assessments/${assessmentId}/submit`, { method: 'POST', withAuth: true });

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
