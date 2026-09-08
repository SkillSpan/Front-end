// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from './utils/cookies';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
// Laravel backend for local dev / staging / production.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://back-end-zdip.onrender.com').replace(/\/+$/, '');

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;
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
      // A listener must not prevent the remaining listeners from running.
    }
  });
}

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

export async function clearSessionAndRevoke() {
  try {
    await request('/api/v1/auth/logout', { method: 'POST', withAuth: true });
  } catch {
    // Local cleanup still happens when the server is unavailable.
  }
  clearSession();
  notifySessionExpired();
}

// ---------------------------------------------------------------------------
// Low level request helper
// ---------------------------------------------------------------------------

async function request(path, { method = 'GET', body, isFormData = false, withAuth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (withAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError) {
    throw {
      status: 0,
      message: 'Unable to reach the server. Please check your internet connection and try again.',
      errors: {},
      cause: networkError,
    };
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Some responses (e.g. 204) may have no body.
  }

  if (!response.ok) {
    if (response.status === 401 && withAuth && path.startsWith('/api/v1/auth/logout')) {
      clearSession();
      notifySessionExpired();
    }
    throw {
      status: response.status,
      message: data.message || 'Something went wrong. Please try again.',
      errors: data.errors || {},
      data,
    };
  }

  return data;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

export const registerOrganization = (formData) =>
  request('/api/v1/auth/register/organization', { method: 'POST', body: formData, isFormData: true });

export const verifyOtp = (email, otp) =>
  request('/api/v1/auth/verify', { method: 'POST', body: { email, otp } });

export const resendOtp = (email) =>
  request('/api/v1/auth/resend-otp', { method: 'POST', body: { email } });

export const loginUser = (email, password) =>
  request('/api/v1/auth/login', { method: 'POST', body: { email, password } });

// Google Sign-In (individual/student accounts only). `credential` is the
// Google ID token obtained from Google Identity Services on the frontend
// (see src/Login.jsx). terms_accepted/privacy_accepted are only required
// (and should only be sent as true) when completing signup for a brand
// new account - see the two-step flow (Login.jsx -> RegisterWizard
// starting at the academic-status step for new accounts).
//
// `extra` lets us pass additional fields collected after the redirect
// (currently just `academic_status`, from RegisterStep2). ⚠️ NOT PART OF
// THE CONFIRMED CONTRACT - google_login_frontend_guide.pdf only documents
// { credential, terms_accepted, privacy_accepted }. Confirm with backend
// that academic_status is accepted/stored on this endpoint before relying
// on it; if not, we'll need a follow-up PATCH/profile-update call instead.
//
// NOTE ON THE ENDPOINT PATH: the backend guide we received contains a
// garbled/contradictory note about whether this path is
// /api/auth/login/google or /api/auth/google/login - but the guide's own
// code sample unambiguously uses /api/auth/login/google, so that's what
// we use here. Flag this to the backend team to confirm in writing if
// requests start failing with 404.
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

export const loginOrganization = (email, password) =>
  request('/api/v1/auth/login/organization', { method: 'POST', body: { email, password } });

export const loginOrganizationWithGoogle = (credential) =>
  request('/api/auth/login/organization/google', { method: 'POST', body: { credential } });

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
