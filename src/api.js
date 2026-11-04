// api.js
// Central place for talking to the SkillSpan Auth API and for managing the
// signed-in session (kept in cookies, see utils/cookies.js).

import { setCookie, getCookie, removeCookie } from './utils/cookies';

// Base URL is injected at build time via Vite env vars. Set
// VITE_API_BASE_URL in your .env (see .env.example) to point at the
// Laravel backend for local dev / staging / production. Trailing slashes
// are stripped so `${API_BASE_URL}${path}` never ends up with `//`.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
// Local development falls back to the hosted API. Production builds must
// explicitly configure the backend URL so they cannot silently call an old API.
export const API_BASE_URL = (configuredApiBaseUrl || (import.meta.env.DEV ? 'https://skillspan.alwaysdata.net' : '')).replace(/\/+$/, '');

const TOKEN_COOKIE = 'skillspan_token';
const USER_COOKIE = 'skillspan_user';
const SESSION_DAYS = 7;

// Listeners notified when the local session is cleared because the backend
// told us it's no longer valid (a 401 on an authenticated request).
// AuthContext subscribes so it can drop its in-memory user and send the user
// to the login page.
const sessionExpiredListeners = new Set();

export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

function notifySessionExpired(detail) {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener(detail);
    } catch {
      // ignore listener errors so one bad listener doesn't break the rest
    }
  });
}

// The login page reads this query flag to show a one-line notice instead of
// an error.
export const SESSION_EXPIRED_PARAM = 'expired';
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

// Routes where a visitor without a session is expected. A 401 that arrives
// while one of these is on screen must not redirect again (no loops).
const PUBLIC_ROUTE_PREFIXES = ['/session-expired', '/login', '/register', '/get-started', '/forgot-password', '/company/login', '/company/register', '/company/forgot-password'];

function isPublicRoute(pathname) {
  if (!pathname || pathname === '/') return true;
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

// Only same-app paths are accepted as a returnTo target, so the login page
// can't be used to bounce the user to another site.
export function safeReturnTo(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return null;
  const pathname = value.split(/[?#]/)[0];
  if (isPublicRoute(pathname)) return null;
  return value;
}

// The login page for a returnTo target, with the expired-session notice on.
export function expiredLoginUrl(returnTo) {
  const target = safeReturnTo(returnTo);
  const params = new URLSearchParams();
  if (target) params.set('returnTo', target);
  params.set(SESSION_EXPIRED_PARAM, '1');
  return `${target?.startsWith('/company') ? '/company/login' : '/login'}?${params.toString()}`;
}

// Where a 401 sends the user: the "Your session has expired" screen from the
// Figma file, which then leads to login and back to `returnTo`.
export function buildSessionExpiredRedirect(location = typeof window !== 'undefined' ? window.location : null) {
  const pathname = location?.pathname || '/';
  const returnTo = safeReturnTo(`${pathname}${location?.search || ''}`);
  return returnTo ? `/session-expired?returnTo=${encodeURIComponent(returnTo)}` : '/session-expired';
}

function defaultRedirect(url) {
  if (typeof window !== 'undefined') window.location.replace(url);
}

let sessionExpiredRedirect = defaultRedirect;

// The app swaps the hard redirect for a router navigation once React Router
// is mounted (see AuthContext). Passing nothing restores the default.
export function setSessionExpiredRedirect(handler) {
  sessionExpiredRedirect = typeof handler === 'function' ? handler : defaultRedirect;
}

// Called for a 401 on an authenticated request. `sentToken` is the token that
// request carried. When several requests fail together, the first one clears
// the cookie, so the others no longer match and do nothing: one redirect only.
// A late 401 for an old token also can't sign out a session created since.
export function handleUnauthorized(sentToken) {
  if (!sentToken || getToken() !== sentToken) return false;
  clearSession();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const redirectTo = isPublicRoute(pathname) ? null : buildSessionExpiredRedirect();
  notifySessionExpired({ redirectTo });
  if (redirectTo) sessionExpiredRedirect(redirectTo);
  return true;
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

async function request(
  path,
  { method = 'GET', body, isFormData = false, withAuth = false, timeoutMs = 0, signal } = {},
) {
  if (!API_BASE_URL) {
    throw { status: 0, configuration: true, message: 'VITE_API_BASE_URL is missing. Configure the SkillSpan API URL before building for production.', errors: {} };
  }
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const sentToken = withAuth ? getToken() : null;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

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
    // A 401 on an authenticated request means the stored token is no longer
    // valid (expired, revoked, or issued by another backend). The public auth
    // endpoints are excluded: a 401 from /login is a wrong password, not an
    // expired session. Logout is excluded too: its callers clear the session
    // themselves and should not be sent to the "expired" notice.
    if (response.status === 401 && withAuth && !isPublicAuthEndpoint(path) && !path.startsWith('/api/v1/auth/logout')) {
      handleUnauthorized(sentToken);
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

// Endpoints used before a session exists (login, register, OTP, password
// reset). Their 401s are form errors and never end a session.
const PUBLIC_AUTH_ENDPOINTS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/verify',
  '/api/v1/auth/resend-otp',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
];

export function isPublicAuthEndpoint(path) {
  if (!path) return false;
  const pathname = path.split('?')[0];
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => pathname === endpoint || pathname.startsWith(`${endpoint}/`));
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export const registerUser = (payload) =>
  request('/api/v1/auth/register', { method: 'POST', body: payload });

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
// role:learner. The response row carries the link or the stored file path
// in `reference`.
export const submitEvidence = (payload, isFormData = false) =>
  request('/api/v1/evidence', { method: 'POST', body: payload, isFormData, withAuth: true });

// role:learner - every evidence row of the signed-in learner, in all
// statuses, including the verified `assessment_test` rows the baseline
// assessment writes (see isLearnerEvidence in evidenceApi.js). `status`
// narrows it to one verification status.
export const getMyEvidence = ({ status } = {}) =>
  request(`/api/v1/evidence${status ? `?status=${encodeURIComponent(status)}` : ''}`, { method: 'GET', withAuth: true });

// Admins can read any record; a learner only their own (404 otherwise).
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

// page/perPage/specializationId are optional - only sent when provided.
// specialization_id narrows the list to the roles linked to that
// specialization (the free-track specialization returns every role).
export const getCareerRoles = ({ page, perPage, specializationId } = {}) => {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (perPage) params.set('per_page', perPage);
  if (specializationId) params.set('specialization_id', specializationId);
  const qs = params.toString();
  return request(`/api/v1/career-roles${qs ? `?${qs}` : ''}`, { method: 'GET', withAuth: true });
};

export const getCareerRoleById = (id) =>
  request(`/api/v1/career-roles/${id}`, { method: 'GET', withAuth: true });

export const getCareerRoleSkills = (id) =>
  request(`/api/v1/career-roles/${id}/skills`, { method: 'GET', withAuth: true });

// ---------------------------------------------------------------------------
// Readiness (requires Authorization: Bearer {token}, role:learner)
// ---------------------------------------------------------------------------

export const calculateReadiness = (payload) =>
  request('/api/v1/readiness/calculate', { method: 'POST', body: payload, withAuth: true });

export const getLatestReadiness = () => request('/api/v1/readiness/latest', { method: 'GET', withAuth: true });


// ---------------------------------------------------------------------------
// Learner workspace APIs (API handoff 29-09-2026)
// ---------------------------------------------------------------------------
export const getApplications = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/applications${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const updateApplication = (projectId, applicationId, payload = {}) =>
  request(`/api/v1/projects/${projectId}/applications/${applicationId}`, { method: 'PATCH', body: payload, withAuth: true });
// `reason` is optional; the backend stores it with the withdrawal.
export const withdrawApplication = (applicationId, reason) =>
  request(`/api/v1/applications/${applicationId}/withdraw`, {
    method: 'POST',
    body: reason ? { reason } : undefined,
    withAuth: true,
  });
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
export const getLatestIntelligence = () => request('/api/v1/intelligence/latest', { withAuth: true });
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
export const getNotifications = ({ page, perPage } = {}) => {
  const q = new URLSearchParams(); if (page) q.set('page', page); if (perPage) q.set('per_page', perPage);
  return request(`/api/v1/notifications${q.toString() ? `?${q}` : ''}`, { withAuth: true });
};
export const getUnreadNotificationCount = () => request('/api/v1/notifications/unread-count', { withAuth: true });
export const markAllNotificationsRead = () => request('/api/v1/notifications/read-all', { method: 'POST', withAuth: true });
export const markNotificationRead = (id) => request(`/api/v1/notifications/${id}/read`, { method: 'POST', withAuth: true });

export function unwrapApiData(payload) {
  return payload?.data?.data ?? payload?.data ?? payload;
}

export const getOrganizationProfile = () => request('/api/v1/organization/profile', { withAuth: true });
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
